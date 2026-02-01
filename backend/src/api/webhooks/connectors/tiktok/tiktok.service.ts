import { Database } from '../../../../supabase/supabase.types';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import { InjectSupabaseClient } from 'nestjs-supabase-js';
import { mapTiktokOrderStatus } from '../../../../connectors/tiktok/tiktok.mapper';

@Injectable()
export class TikTokWebhooksService {
  private readonly logger = new Logger(TikTokWebhooksService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectSupabaseClient()
    private readonly supabaseClient: SupabaseClient<Database>,
  ) {}

  /**
   * Verify using TikTok's HMAC-SHA256 logic:
   * signature = hmac_sha256(app_secret, app_key + raw_body)
   */

  verifySignature(rawBody: Buffer, signature: string) {
    const appKey = this.config.getOrThrow<string>('TIKTOK_APP_KEY');
    const appSecret = this.config.getOrThrow<string>('TIKTOK_APP_SECRET');

    const signedPayload = appKey + rawBody.toString('utf8');
    const expected = crypto
      .createHmac('sha256', appSecret)
      .update(signedPayload)
      .digest('hex');

    if (
      !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
    ) {
      throw new UnauthorizedException('Invalid TikTok signature');
    }
  }
  /* ---------------- EVENT ROUTING ---------------- */

  async verifyAndProcess(body: any, tiktokShopId: string) {
    const { data, error } = await this.supabaseClient
      .from('stores')
      .select('id')
      .eq('shopDomain', tiktokShopId)
      .single();

    if (error || !data) return;
    const storeId = data.id;

    // 2️⃣ Route event
    switch (body.type) {
      case 1:
        await this.handleOrderUpdate(storeId, body);
        break;

      case 27:
        await this.handleInventoryUpdate(storeId, body);
        break;

      case 12:
        await this.handleReturnUpdate(storeId, body);
        break;

      case 6:
        await this.handleDeauth(storeId, body);
        break;

      default:
        this.logger.warn(`Unhandled TikTok event type ${body.type}`);
    }
  }

  private async createAlert(params: {
    storeId: string;
    alertType: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    productId?: string;
    relatedEntityId?: string;
  }) {
    const { error } = await this.supabaseClient.rpc('create_alert', {
      p_alert_type: params.alertType,
      p_message: params.message,
      p_platform: 'tiktok',
      p_product_id: (params.productId as string) ?? null,
      p_related_entity_id: (params.relatedEntityId as string) ?? null,
      p_severity: params.severity,
      p_store_id: params.storeId,
    });

    if (error) {
      this.logger.error('Alert creation failed', error);
    }
  }

  private async insertRawEvent(
    storeId: string,
    body: any,
    entity: string,
    eventType: string,
    externalEventId: string,
  ) {
    const { error } = await this.supabaseClient.from('raw_events').insert({
      store_id: storeId,
      platform: 'tiktok',
      entity,
      event_type: eventType,
      external_event_id: externalEventId,
      payload: body,
    });

    if (error) {
      this.logger.error('Raw event insert failed', error);
      throw error;
    }
  }

  private async handleOrderUpdate(storeId: string, payload: any) {
    const externalOrderId = payload.data.order_id;
    const status = mapTiktokOrderStatus(payload.data.order_status as string);

    const orderStatus = payload.data.order_status;
    const orderId = payload.data.order_id;

    if (orderStatus === 'CANCEL') {
      await this.createAlert({
        storeId,
        alertType: 'order_cancelled',
        severity: 'medium',
        relatedEntityId: orderId,
        message: 'Order was cancelled on TikTok Shop.',
      });
    }

    if (orderStatus === 'ON_HOLD') {
      await this.createAlert({
        storeId,
        alertType: 'order_on_hold',
        severity: 'high',
        relatedEntityId: orderId,
        message: 'Order is on hold and requires seller action.',
      });
    }

    await this.insertRawEvent(
      storeId,
      payload,
      'order',
      'order_status_updated',
      externalOrderId as string,
    );

    const { error } = await this.supabaseClient
      .from('orders')
      .update({ status })
      .eq('external_order_id', externalOrderId as string)
      .eq('store_id', storeId);

    if (error) {
      this.logger.error('Order update failed', error);
      throw error;
    }

    await this.supabaseClient
      .from('stores')
      .update({ last_orders_synced_at: new Date().toISOString() })
      .eq('id', storeId);
  }

  private async handleInventoryUpdate(storeId: string, payload: any) {
    const { sku_id, current_inventory_status, inventory_distribution } =
      payload.data;

    const { trigger_reason, product_id } = payload.data;

    if (current_inventory_status === 'OUT_OF_STOCK') {
      await this.createAlert({
        storeId,
        alertType: 'inventory_out_of_stock',
        severity: 'high',
        productId: product_id,
        message: 'Product is out of stock on TikTok Shop.',
      });
    }

    if (current_inventory_status === 'LOW_STOCK') {
      await this.createAlert({
        storeId,
        alertType: 'inventory_low_stock',
        severity: 'medium',
        productId: product_id,
        message: 'Product inventory is running low on TikTok Shop.',
      });
    }

    if (
      trigger_reason?.alert_type === 'PREDICTION' &&
      trigger_reason.lead_days <= 7
    ) {
      await this.createAlert({
        storeId,
        alertType: 'inventory_stock_prediction',
        severity: 'medium',
        productId: product_id,
        message: `Predicted stock out in ${trigger_reason.lead_days} days.`,
      });
    }

    await this.insertRawEvent(
      storeId,
      payload,
      'inventory',
      'inventory_status_updated',
      sku_id as string,
    );

    const statusMap: Record<string, any> = {
      SUFFICIENT_STOCK: 'in_stock',
      LOW_STOCK: 'backorder',
      OUT_OF_STOCK: 'out_of_stock',
    };

    const { error } = await this.supabaseClient
      .from('inventory')
      .update({
        inventory_status: statusMap[current_inventory_status],
        platform_quantity: inventory_distribution?.available_quantity ?? null,
        reserved_quantity: inventory_distribution?.committed_quantity ?? null,
        warehouse_quantity: inventory_distribution?.total_quantity ?? null,
        last_platform_event: 'tiktok_inventory_webhook',
        last_synced_at: new Date().toISOString(),
      })
      .eq('sku', sku_id as string)
      .eq('store_id', storeId);

    if (error) {
      this.logger.error('Inventory update failed', error);
      throw error;
    }
  }
  private async handleReturnUpdate(storeId: string, payload: any) {
    const { return_id, order_id, return_status, refund_amount } = payload.data;

    if (return_status === 'RETURN_OR_REFUND_REQUEST_PENDING') {
      await this.createAlert({
        storeId,
        alertType: 'return_requested',
        severity: 'medium',
        relatedEntityId: return_id,
        message: 'Buyer requested a return or refund.',
      });
    }

    if (return_status === 'RETURN_OR_REFUND_REQUEST_COMPLETE') {
      await this.createAlert({
        storeId,
        alertType: 'refund_completed',
        severity: 'low',
        relatedEntityId: return_id,
        message: 'Return or refund completed successfully.',
      });
    }

    await this.insertRawEvent(
      storeId,
      payload,
      'return',
      'return_status_updated',
      return_id as string,
    );

    const { error } = await this.supabaseClient.from('returns').upsert({
      external_return_id: return_id,
      order_id,
      store_id: storeId,
      platform: 'tiktok',
      status: return_status,
      refund_amount: refund_amount ?? null,
    });

    if (error) {
      this.logger.error('Return update failed', error);
      throw error;
    }

    if (return_status === 'RETURN_OR_REFUND_REQUEST_COMPLETE') {
      await this.supabaseClient
        .from('orders')
        .update({ status: 'refunded' })
        .eq('external_order_id', order_id as string)
        .eq('store_id', storeId);
    }
  }
  private async handleDeauth(storeId: string, payload: any) {
    await this.createAlert({
      storeId,
      alertType: 'store_deauthorized',
      severity: 'critical',
      message:
        'TikTok Shop disconnected. Reauthorization required immediately.',
    });

    await this.insertRawEvent(
      storeId,
      payload,
      'store',
      'store_deauthorized',
      payload.shop_id as string,
    );

    await this.supabaseClient
      .from('stores')
      .update({
        auth_status: 'expired',
        auth_expires_at: new Date().toISOString(),
      })
      .eq('id', storeId);
  }
}

// "type": 1,  Order status change
//         Parameter name	Sample	Description
//         order_id 576462377512830168 The identification of a TikTok Shop order
//         order_status CANCEL The most recent order status, with possible values:
//                                                                                * UNPAID
//                                                                                * ON_HOLD
//                                                                                * AWAITING_SHIPMENT
//                                                                                * AWAITING_COLLECTION
//                                                                                * CANCEL
//                                                                                * IN_TRANSIT
//                                                                                * DELIVERED
//                                                                                * COMPLETED
//         is_on_hold_order false Indicates whether the order has experienced or will experience ON_HOLD status
//         update_time 1627587505 The order status update time, represented as a Unix timestamp (seconds).
//         Event example
//         {
//          "type": 1,
//          "tts_notification_id": "7327112393057371910",
//          "shop_id": "7494049642642441621",
//          "timestamp": 1644412885,
//          "data": {
//            "order_id": "576486316948490001",
//            "order_status": "UNPAID",
//            "is_on_hold_order": false,
//            "update_time": 1644412885
//          }
//         }

// "type": 27, Inventory status change
//         Parameter type name	Sample	Description
//         type int 27 The ID of this webhook topic, which is 27.
//         tts_notification_id string "7327112393057371910" The ID of this webhook notification.
//         shop_id string "7494049642642441621" The shop ID.
//         timestamp int 1644412885 The time when this webhook is triggered. Unix timestamp.
//         data object
//         └ product_id string "732357708734418520388" The ID of the product.
//         └ sku_id string "73235770873441823254" The ID of the SKU.
//         └ trigger_reason object
//         └└ alert_type string "PREDICTION" PREDICTION: TikTok Shop predicts the inventory will go out of stock in X days, REALTIME: The inventory has reached, LOW_STOCK or OUT_OF_STOCK
//         └└ lead_days int 21 When alert_type == PREDICTION, the value is the time slot between update_time and the predicted out-of-stock date. When alert_type == REALTIME, the parameter is not returned.
//         └└ low_stock_threshold int 0 When alert_type == REALTIME, the value is the low stock threshold met. When alert_type == PREDICTION, the parameter is not returned.
//         └ current_inventory_status string "LOW_STOCK" SUFFICIENT_STOCK: defined as having enough stocks. LOW_STOCK: defined as available stock ≤ stock alert value. OUT_OF_STOCK: defined as having 0 available stock.
//         └ inventory_distribution object
//         └└ total_quantity int 100 The total quantity of the stock physically in the warehouses. total_quantity=available_quantity + creator_reserved_quantity + campaign_reserved_quantity + committed_quantity.
//         └└ available_quantity int 50 The total number of SKUs available for ordering in the warehouses.
//         └└ creator_reserved_quantity int 20 The total number of SKUs reserved for creators in the warehouses.
//         └└ campaign_reserved_quantity int 20 The total number of SKUs reserved for campaigns in the warehouses.
//         └└ committed_quantity int 40 The total number of SKUs reserved by existing customer orders in the warehouses.
//         └ update_time int 1627587600 The time when the status changed, represented as a Unix timestamp (seconds).
//         Event example:
//                     {
//                   "type": 27,
//                   "tts_notification_id": "7327112393057371910",
//                   "shop_id": "7494049642642441621",
//                   "timestamp": 1644412885,
//                   "data": {
//                     "product_id": "732357708734418520388"
//                     "sku_id": "73235770873441823254"
//                     "trigger_reason": {
//                         "alert_type": "PREDICTION",
//                         "lead_days": 21
//                     },
//                     "current_inventory_status": "LOW_STOCK",
//                     "inventory_distribution": {
//                         "total_quantity": 100,
//                         "available_quantity": 50,
//                         "creator_reserved_quantity": 20,
//                         "campaign_reserved_quantity": 20,
//                         "committed_quantity": 10
//                     },
//                     "update_time": 1627587600
//                   }
//                 }

// "type": 12, Return status change
//          The return status change webhook is triggered when the return_status of an order changes:
//          The BUYER initiates a return or refund request and is pending SELLER review: RETURN_OR_REFUND_REQUEST_PENDING
//          The SELLER declines the BUYER's return or refund request: REFUND_OR_RETURN_REQUEST_REJECT
//          The return request is approved and the SELLER is waiting for the BUYER to return the approved items: AWAITING_BUYER_SHIP. If the BUYER doesn't ship the items to the SELLER before the deadline, the request will be closed automatically.
//          To return the items to the SELLER, the BUYER drops off the package successfully or the BUYER ships the package and uploads the tracking number: BUYER_SHIPPED_ITEM
//          The SELLER declines the refund request for the return: REJECT_RECEIVE_PACKAGE
//          The SELLER accepts the refund request or issues a refund for the return: RETURN_OR_REFUND_REQUEST_SUCCESS
//          The BUYER or SYSTEM closes the return or refund request: RETURN_OR_REFUND__REQUEST_CANCELLED
//          The return or refund is successful: RETURN_OR_REFUND_REQUEST_COMPLETE
//          Additionally, a BUYER may request an identical replacement item instead
//          The BUYER initiates a replacement request and is pending SELLER review: REPLACEMENT_REQUEST_PENDING
//          The SELLER declines the BUYER's replacement request: REPLACEMENT_REQUEST_REJECT
//          The SELLER decides to issue a refund to the BUYER without replacement: REPLACEMENT_REQUEST_REFUND_SUCCESS
//          The BUYER cancels the replacement request: REPLACEMENT_REQUEST_CANCEL
//          The SELLER approves the replacement request: REPLACEMENT_REQUEST_COMPLETE
//          Parameter	Description	Sample
//          order_id The identification of a TikTok Shop order 577087614418520388
//          return_role Return or refund request user, with possible values:                BUYER
//                                                                           * BUYER
//                                                                           * SELLER
//                                                                           * SYSTEM
//          return_type The return or refund request type, with possible values:            REFUND
//                                                                           * REFUND
//                                                                           * REPLACEMENT
//                                                                           * RETURN_AND_REFUND
//          return_role Return or refund request user, with possible values:                RETURN_OR_REFUND_REQUEST_PENDING
//                                                                           * AWAITING_BUYER_SHIP
//                                                                           * BUYER_SHIPPED_ITEM
//                                                                           * REFUND_OR_RETURN_REQUEST_REJECT
//                                                                           * REJECT_RECEIVE_PACKAGE
//                                                                           * REPLACEMENT_REQUEST_CANCEL
//                                                                           * REPLACEMENT_REQUEST_COMPLETE
//                                                                           * REPLACEMENT_REQUEST_PENDING
//                                                                           * REPLACEMENT_REQUEST_REFUND_SUCCESS
//                                                                           * REPLACEMENT_REQUEST_REJECT
//                                                                           * RETURN_OR_REFUND_REQUEST_CANCEL
//                                                                           * RETURN_OR_REFUND_REQUEST_COMPLETE
//                                                                           * RETURN_OR_REFUND_REQUEST_PENDING
//                                                                           * RETURN_OR_REFUND_REQUEST_SUCCESS
//          return_id The identifier of a specific return. 4035318504086604100
//          create_time The time when the request was created. 1627587600
//          update_time The time when return order status update, represented as a Unix timestamp (seconds). 1627587600

// "type": 6,  Seller deauthorization
//          Parameter	Description	Sample
//          type The identification of each type of notification 6
//          shop_id The identification of the shop 123455
//          timestamp The time when the notification is pushed, represented as a Unix timestamp (seconds). 1627587506
//          data The object contains business parameters related to the specific notification type. "data": {"message": "Shop_id {xxx} is deauthorized from your APP by merchant."}
