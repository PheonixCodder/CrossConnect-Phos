import { Database } from 'src/supabase/supabase.types';
import {
  FetchFulfillmentsQuery,
  FetchInventoryLevelsQuery,
  FetchOrdersQuery,
  FetchProductsQuery,
  FetchReturnsQuery,
} from './graphql/generated/admin.generated';

type ShopifyProductNode = FetchProductsQuery['products']['nodes'][number];
type ShopifyInventoryItemNode =
  FetchInventoryLevelsQuery['inventoryItems']['nodes'][number];
type ShopifyInventoryLevelNode =
  ShopifyInventoryItemNode['inventoryLevels']['nodes'][number];

export function mapShopifyProductToDB(
  product: ShopifyProductNode,
  storeId: string,
): Database['public']['Tables']['products']['Insert'][] {
  if (!product.variants?.nodes) return [];

  return product.variants.nodes.map((variant) => ({
    external_product_id: product.id,
    platform: 'shopify',
    store_id: storeId,
    sku: variant.sku || `UNKNOWN-${variant.id.split('/').pop()}`,
    title: product.title,
    description: product.descriptionPlainSummary || null,
    price: variant.price ? parseFloat(variant.price as string) : 0,
    currency: 'USD',
    status: product.status.toLowerCase(),
  }));
}

export function mapShopifyInventoryToDB(
  item: ShopifyInventoryItemNode,
  level: ShopifyInventoryLevelNode,
  storeId: string,
  productId: string,
): Database['public']['Tables']['inventory']['Insert'] {
  const available =
    level.quantities?.find((q) => q.name === 'available')?.quantity ?? 0;

  return {
    store_id: storeId,
    product_id: productId,
    sku: item.sku || 'NO-SKU',
    platform_quantity: available,
    inventory_status: available > 0 ? 'in_stock' : 'out_of_stock',
    last_platform_event: 'shopify_inventory_sync',
    last_synced_at: new Date().toISOString(),
  };
}

export function shouldUpdateShopifyInventory(
  existing: Database['public']['Tables']['inventory']['Row'],
  next: Database['public']['Tables']['inventory']['Insert'],
): boolean {
  return existing.platform_quantity !== next.platform_quantity;
}
type ShopifyOrderNode = FetchOrdersQuery['orders']['nodes'][number];
type ShopifyLineItemNode = ShopifyOrderNode['lineItems']['nodes'][number];
type ShopifyFulfillmentOrderNode =
  FetchFulfillmentsQuery['orders']['nodes'][number];

export function mapShopifyOrderToDB(
  order: ShopifyOrderNode,
  storeId: string,
): Database['public']['Tables']['orders']['Insert'] {
  // Defensive selection for MoneyV2 fields in 2026-01
  const subtotal = parseFloat(
    (order.subtotalPriceSet?.shopMoney?.amount as string) || '0',
  );
  const tax = parseFloat(
    (order.totalTaxSet?.shopMoney?.amount as string) || '0',
  );
  const total = parseFloat(
    (order.totalPriceSet?.shopMoney?.amount as string) || '0',
  );

  return {
    store_id: storeId,
    platform: 'shopify',
    external_order_id: order.id,
    status: order.cancelReason
      ? 'cancelled'
      : order.canMarkAsPaid
        ? 'pending'
        : 'paid',
    currency: order.currencyCode,
    subtotal,
    tax,
    total,
    shipping: 0, // In 2026, totalShippingPriceSet is the preferred field if added to query
    ordered_at: order.createdAt,
    payment_status: order.canMarkAsPaid ? 'pending' : 'paid',
  };
}

export function mapShopifyOrderItemsToDB(
  items: ShopifyLineItemNode[],
  orderId: string,
  productIdBySku: Map<string, string>,
): Database['public']['Tables']['order_items']['Insert'][] {
  return items.map((item) => {
    const unitPrice = 0; // Default if price data is missing
    const quantity = item.quantity || 0;

    return {
      order_id: orderId,
      sku: item.sku ?? 'UNKNOWN',
      product_id: item.sku ? productIdBySku.get(item.sku) : null,
      quantity,
      price: unitPrice,
      total: unitPrice * quantity,
    };
  });
}

export function mapShopifyFulfillmentsToDB(
  orderNodes: ShopifyFulfillmentOrderNode[],
  storeId: string,
  orderIdByExternalId: Map<string, string>,
  productIdByExternalId: Map<string, string>,
): Database['public']['Tables']['fulfillments']['Insert'][] {
  const rows: Database['public']['Tables']['fulfillments']['Insert'][] = [];

  for (const orderNode of orderNodes) {
    const internalOrderId = orderIdByExternalId.get(orderNode.id);
    if (!internalOrderId) continue;

    for (const fulfillment of orderNode.fulfillments || []) {
      // Map tracking info (Shopify 2026-01 provides an array of trackingInfo)
      const primaryTracking = fulfillment.trackingInfo?.[0];

      // Fulfillments in Shopify link to the items within that specific fulfillment
      // For this DB schema, we associate the fulfillment status to the products
      for (const item of orderNode.lineItems.nodes) {
        rows.push({
          store_id: storeId,
          platform: 'shopify',
          external_fulfillment_id: fulfillment.id,
          order_id: internalOrderId,
          product_id: item.product?.id
            ? productIdByExternalId.get(item.product.id)
            : null,
          status: fulfillment.status.toLowerCase(),
          carrier: primaryTracking?.company || null,
          tracking_number: primaryTracking?.number || null,
        });
      }
    }
  }
  return rows;
}

type ShopifyReturnOrderNode = NonNullable<
  FetchReturnsQuery['orders']['edges']
>[number]['node'];
type ShopifyReturnNode = NonNullable<
  ShopifyReturnOrderNode['returns']['nodes']
>[number];

export function mapShopifyReturnToDB(
  order: ShopifyReturnOrderNode,
  returnNode: ShopifyReturnNode,
  storeId: string,
  internalOrderId: string,
): Database['public']['Tables']['returns']['Insert'] {
  // Summing the total refunded amount from the order's refund connection
  const totalRefunded =
    order.refunds?.reduce((sum, refund) => {
      return (
        sum +
        parseFloat(String(refund.totalRefundedSet.shopMoney.amount) || '0')
      );
    }, 0) || 0;

  return {
    store_id: storeId,
    platform: 'shopify',
    order_id: internalOrderId, // Database UUID (FK)
    external_return_id: returnNode.id, // Shopify GID
    status: returnNode.status.toLowerCase(), // e.g., "open", "returned"
    currency: order.currencyCode,
    refund_amount: totalRefunded,
  };
}
