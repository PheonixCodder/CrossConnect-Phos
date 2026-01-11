import { InlineResponse2002 } from '@whitebox-co/walmart-marketplace-api/lib/src/apis/returns';
import {
  InlineResponse200OrderOrderLinesOrderLine,
  InlineResponse200OrderOrderLinesOrderLineStatusesOrderLineStatusStatusEnum,
} from '@whitebox-co/walmart-marketplace-api/lib/src/apis/orders';
import { InlineResponse200 } from '@whitebox-co/walmart-marketplace-api/lib/src/apis/inventory';
import { InlineResponse200Order } from '@whitebox-co/walmart-marketplace-api/lib/src/apis/orders';
import { InlineResponse2003ItemResponse } from '@whitebox-co/walmart-marketplace-api/lib/src/apis/items';
import { Database } from 'src/supabase/supabase.types';

type ProductInsert = Database['public']['Tables']['products']['Insert'];

export function mapWalmartProductToDB(
  products: InlineResponse2003ItemResponse[],
  storeId: string,
): ProductInsert[] {
  return products.map((product) => {
    const description =
      product.additionalAttributes?.nameValueAttribute
        ?.map((attr) => {
          const values = attr.value
            .map((v) => (typeof v === 'string' ? v : JSON.stringify(v)))
            .join(', ');
          return `${attr.name}: ${values}`;
        })
        .join(' | ') ?? null;

    return {
      sku: product.sku,
      external_product_id:
        product.wpid ?? product.gtin ?? product.upc ?? product.sku,

      platform: 'walmart',
      store_id: storeId,

      title: product.productName ?? null,
      description,

      price: product.price?.amount ?? null,
      currency: product.price?.currency ?? null,

      status: product.publishedStatus ?? product.lifecycleStatus ?? null,
    };
  });
}

export function mapWalmartInventoryToDB(
  inventory: InlineResponse200,
  storeId: string,
  productId: string,
): Database['public']['Tables']['inventory']['Insert'] {
  const quantity = inventory.quantity?.amount ?? 0;

  return {
    sku: inventory.sku,
    store_id: storeId,
    product_id: productId,

    platform_quantity: quantity,
    warehouse_quantity: quantity,
    reserved_quantity: 0,
    inbound_quantity: 0,

    inventory_status: quantity > 0 ? 'in_stock' : 'out_of_stock',

    last_platform_event: 'walmart_inventory_sync',
    last_synced_at: new Date().toISOString(),
  };
}

export async function fetchInventoryWithThrottle<T>(
  items: T[],
  handler: (item: T) => Promise<void>,
  batchSize = 3,
  delayMs = 500,
) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.allSettled(batch.map(handler));
    await new Promise((r) => setTimeout(r, delayMs));
  }
}

interface ThrottleOptions<T> {
  batchSize?: number; // How many parallel requests
  initialDelayMs?: number; // Base delay between batches
  maxRetries?: number; // Retry attempts for rate-limits
  handler: (item: T) => Promise<any>; // Actual fetch handler
}

export async function fetchInventoryAdaptive<T>(
  items: T[],
  options: ThrottleOptions<T>,
) {
  const {
    batchSize = 3,
    initialDelayMs = 500,
    maxRetries = 3,
    handler,
  } = options;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (item) => {
        let attempt = 0;
        let delay = initialDelayMs;

        while (attempt <= maxRetries) {
          try {
            return await handler(item);
          } catch (err: any) {
            if (err?.response?.status === 429) {
              // Rate limit hit: exponential backoff
              attempt++;
              await new Promise((r) => setTimeout(r, delay));
              delay *= 2;
              continue;
            }
            throw err;
          }
        }
      }),
    );

    // Wait between batches
    await new Promise((r) => setTimeout(r, initialDelayMs));
  }
}
export function shouldUpdateInventory(
  existing: Database['public']['Tables']['inventory']['Row'],
  incoming: InlineResponse200,
) {
  const newQty = incoming.quantity?.amount ?? 0;
  return (
    existing.platform_quantity !== newQty ||
    existing.inventory_status !== (newQty > 0 ? 'in_stock' : 'out_of_stock')
  );
}

export function mapWalmartFulfillmentsToDB(
  line: InlineResponse200OrderOrderLinesOrderLine,
  orderId: string,
  storeId: string,
  productId?: string,
): Database['public']['Tables']['fulfillments']['Insert'] | null {
  const shipped = line.orderLineStatuses.orderLineStatus?.find(
    (s) =>
      s.status ===
      InlineResponse200OrderOrderLinesOrderLineStatusesOrderLineStatusStatusEnum.Created,
  );

  if (!shipped) return null;

  return {
    external_fulfillment_id: `${orderId}-${line.lineNumber}`,
    order_id: orderId,
    store_id: storeId,
    platform: 'walmart',

    product_id: productId ?? null,
    status: 'pending',
  };
}

function deriveOrderStatus(
  order: InlineResponse200Order,
): 'paid' | 'cancelled' | 'refunded' | 'completed' {
  const lines = order.orderLines.orderLine ?? [];

  const hasCancelled = lines.some((l) =>
    l.orderLineStatuses.orderLineStatus?.some(
      (s) =>
        s.status ===
        InlineResponse200OrderOrderLinesOrderLineStatusesOrderLineStatusStatusEnum.Cancelled,
    ),
  );

  if (hasCancelled) return 'cancelled';

  const hasRefund = lines.some((l) => Boolean(l.refund));
  if (hasRefund) return 'refunded';

  const allShipped =
    lines.length > 0 &&
    lines.every((l) =>
      l.orderLineStatuses.orderLineStatus?.some(
        (s) =>
          s.status ===
          InlineResponse200OrderOrderLinesOrderLineStatusesOrderLineStatusStatusEnum.Shipped,
      ),
    );

  if (allShipped) return 'completed';

  return 'paid';
}

export function mapWalmartOrderToDB(
  order: InlineResponse200Order,
  storeId: string,
): Database['public']['Tables']['orders']['Insert'] {
  const summary = order.orderSummary;
  const status = deriveOrderStatus(order);

  return {
    external_order_id: order.purchaseOrderId,
    store_id: storeId,
    platform: 'walmart',

    currency: summary?.totalAmount?.currencyUnit ?? 'USD',
    ordered_at: new Date(order.orderDate).toISOString(),

    subtotal:
      summary?.orderSubTotals?.find((s) => s.subTotalType === 'PRODUCT')
        ?.totalAmount?.currencyAmount ?? null,

    tax:
      summary?.orderSubTotals?.find((s) => s.subTotalType === 'TAX')
        ?.totalAmount?.currencyAmount ?? null,

    shipping:
      summary?.orderSubTotals?.find((s) => s.subTotalType === 'SHIPPING')
        ?.totalAmount?.currencyAmount ?? null,

    total: summary?.totalAmount?.currencyAmount ?? null,

    status, // ✅ ENUM SAFE
    payment_status: status === 'paid' || status === 'completed' ? 'paid' : null,
    fulfillment_status: status === 'completed' ? 'fulfilled' : 'unfulfilled',
  };
}

export function mapWalmartOrderItemsToDB(
  line: InlineResponse200OrderOrderLinesOrderLine,
  orderId: string,
  productId?: string,
): Database['public']['Tables']['order_items']['Insert'] {
  const quantity = Number(line.orderLineQuantity.amount);

  const productCharge =
    line.charges.charge?.find((c) => c.chargeType === 'PRODUCT') ??
    line.charges.charge?.[0];

  const unitPrice = productCharge?.chargeAmount.amount ?? 0;

  const isShipped = line.orderLineStatuses.orderLineStatus?.some(
    (s) =>
      s.status ===
      InlineResponse200OrderOrderLinesOrderLineStatusesOrderLineStatusStatusEnum.Shipped,
  );

  return {
    order_id: orderId,
    product_id: productId ?? null,
    sku: line.item.sku,

    quantity,
    price: unitPrice,
    total: unitPrice * quantity,

    fulfilled_quantity: isShipped ? quantity : 0,
    refunded_quantity: line.refund ? quantity : 0,
  };
}

export function mapWalmartReturnsToDB(
  walmartReturns: InlineResponse2002,
  storeId: string,
): Database['public']['Tables']['returns']['Insert'][] {
  const results: Database['public']['Tables']['returns']['Insert'][] = [];

  for (const returnOrder of walmartReturns.returnOrders ?? []) {
    if (!returnOrder.returnOrderId) continue;

    // -------------------------
    // Resolve ORIGINAL order external ID
    // -------------------------
    const externalOrderId =
      returnOrder.customerOrderId ??
      returnOrder.returnOrderLines?.[0]?.purchaseOrderId;

    if (!externalOrderId) continue;

    // -------------------------
    // Refund amount
    // -------------------------
    const refundAmount = returnOrder.totalRefundAmount?.currencyAmount ?? null;

    const currency = returnOrder.totalRefundAmount?.currencyUnit ?? null;

    // -------------------------
    // Status normalization
    // -------------------------
    let status = 'processing';

    const lineStatuses =
      returnOrder.returnOrderLines?.map((l) => ({
        status: l.status,
        refundStatus: l.currentRefundStatus,
      })) ?? [];

    if (lineStatuses.some((l) => l.refundStatus === 'COMPLETED')) {
      status = 'refunded';
    } else if (
      lineStatuses.some(
        (l) => l.status === 'INITIATED' || l.status === 'RECEIVED',
      )
    ) {
      status = 'pending';
    }

    results.push({
      external_return_id: returnOrder.returnOrderId,
      order_id: externalOrderId, // TEMP external → resolved later
      store_id: storeId,
      platform: 'walmart',

      refund_amount: refundAmount,
      currency,
      status,
    });
  }

  return results;
}
