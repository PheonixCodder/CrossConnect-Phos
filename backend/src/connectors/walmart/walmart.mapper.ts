import { Database } from 'src/supabase/supabase.types';
import {
  WalmartItem,
  Inventory,
  ReturnOrder,
  Order,
  OrderLine as WalmartOrderLine,
} from './walmart.types';

/**
 * Product mapping
 */
export function mapWalmartProductToDB(
  products: WalmartItem[],
  storeId: string,
): Database['public']['Tables']['products']['Insert'][] {
  return products.map((product) => {
    // Title and description
    const title = product.productName ?? null;

    // External product id: prefer wpid > gtin > upc > sku
    const externalId =
      product.wpid ?? product.gtin ?? product.upc ?? product.sku;

    return {
      sku: product.sku,
      external_product_id: externalId,
      platform: 'walmart',
      store_id: storeId,
      title,
      description: null, // WalmartItem sample doesn't include rich description attribute here
      price: product.price?.amount ?? null,
      currency: product.price?.currency ?? null,
      status: product.publishedStatus ?? product.lifecycleStatus ?? null,
    };
  });
}

/**
 * Inventory mapping
 */
export function mapWalmartInventoryToDB(
  inventory: Inventory,
  storeId: string,
  productId: string,
): Database['public']['Tables']['inventory']['Insert'] {
  const qty = inventory.quantity?.amount ?? 0;
  return {
    sku: inventory.sku,
    store_id: storeId,
    product_id: productId,
    platform_quantity: qty,
    warehouse_quantity: qty,
    reserved_quantity: 0,
    inbound_quantity: 0,
    inventory_status: qty > 0 ? 'in_stock' : 'out_of_stock',
    last_platform_event: 'walmart_inventory_sync',
    last_synced_at: new Date().toISOString(),
  };
}

/**
 * Small helper: throttle / batch utility — same behavior as before
 */
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

/**
 * Adaptive fetch — exponential backoff on 429
 */
interface ThrottleOptions<T> {
  batchSize?: number;
  initialDelayMs?: number;
  maxRetries?: number;
  handler: (item: T) => Promise<any>;
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
            // If SDK surfaces HTTP status on error object
            const status = err?.response?.status ?? err?.status;
            if (status === 429) {
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

/**
 * Decide if inventory row needs update
 */
export function shouldUpdateInventory(
  existing: Database['public']['Tables']['inventory']['Row'],
  incoming: Inventory,
) {
  const newQty = incoming.quantity?.amount ?? 0;
  const newStatus = newQty > 0 ? 'in_stock' : 'out_of_stock';
  return (
    existing.platform_quantity !== newQty ||
    existing.inventory_status !== newStatus
  );
}

/**
 * Fulfillments mapping from an order line
 *
 * Accepts the walmart order line (walmart.types.OrderLine) and returns
 * a fulfillments insert row or null if not applicable.
 */
export function mapWalmartFulfillmentsToDB(
  line: WalmartOrderLine,
  orderId: string,
  storeId: string,
  productId?: string,
): Database['public']['Tables']['fulfillments']['Insert'] | null {
  // Look for shipped/created status; adjust per your rules
  const statuses = line.orderLineStatuses?.orderLineStatus ?? [];
  const shipped = statuses.find((s) =>
    ['Shipped', 'Created'].includes(s.status),
  );

  if (!shipped) return null;

  return {
    external_fulfillment_id: `${orderId}-${line.lineNumber}`,
    order_id: orderId,
    store_id: storeId,
    platform: 'walmart',
    product_id: productId ?? null,
    status: 'pending', // default - you may map differently
    tracking_number: null,
    carrier: null,
  };
}

/**
 * Order status derivation
 */
export function deriveOrderStatus(
  order: Order,
): Database['public']['Enums']['order_status'] {
  const lines = order.orderLines?.orderLine ?? [];

  const hasCancelled = lines.some((l) =>
    l.orderLineStatuses?.orderLineStatus?.some((s) => s.status === 'Cancelled'),
  );
  if (hasCancelled) return 'cancelled';

  const hasRefund = lines.some((l) => Boolean((l as any).refund));
  if (hasRefund) return 'refunded';

  const allShipped =
    lines.length > 0 &&
    lines.every((l) =>
      l.orderLineStatuses?.orderLineStatus?.some((s) => s.status === 'Shipped'),
    );
  if (allShipped) return 'completed';

  return 'paid';
}

/**
 * Map order to DB.orders insert
 */
export function mapWalmartOrderToDB(
  order: Order,
  storeId: string,
): Database['public']['Tables']['orders']['Insert'] {
  const summary = (order as any).orderSummary ?? {};
  const status = deriveOrderStatus(order);

  const subtotal =
    summary?.orderSubTotals?.find((s: any) => s.subTotalType === 'PRODUCT')
      ?.totalAmount?.currencyAmount ?? null;

  const tax =
    summary?.orderSubTotals?.find((s: any) => s.subTotalType === 'TAX')
      ?.totalAmount?.currencyAmount ?? null;

  const shipping =
    summary?.orderSubTotals?.find((s: any) => s.subTotalType === 'SHIPPING')
      ?.totalAmount?.currencyAmount ?? null;

  const total = summary?.totalAmount?.currencyAmount ?? null;

  return {
    external_order_id: order.purchaseOrderId,
    store_id: storeId,
    platform: 'walmart',
    currency: summary?.totalAmount?.currencyUnit ?? 'USD',
    ordered_at: new Date(order.orderDate).toISOString(),
    subtotal,
    tax,
    shipping,
    total,
    status,
    payment_status: status === 'paid' || status === 'completed' ? 'paid' : null,
    fulfillment_status: status === 'completed' ? 'fulfilled' : 'unfulfilled',
  };
}

/**
 * Map single order line to order_items insert
 */
export function mapWalmartOrderItemsToDB(
  line: WalmartOrderLine,
  orderId: string,
  productId?: string,
): Database['public']['Tables']['order_items']['Insert'] {
  const quantity = Number(line.orderLineQuantity?.amount ?? 0);

  // Best-effort to find product charge
  const productCharge =
    (line.charges as any)?.charge?.find(
      (c: any) => c.chargeType === 'PRODUCT',
    ) ?? (line.charges as any)?.charge?.[0];

  const unitPrice = productCharge?.chargeAmount?.amount ?? 0;

  const isShipped = (line.orderLineStatuses?.orderLineStatus ?? []).some(
    (s) => s.status === 'Shipped',
  );

  return {
    order_id: orderId,
    product_id: productId ?? null,
    sku: line.item?.sku ?? '',
    quantity,
    price: unitPrice,
    total: unitPrice * quantity,
    fulfilled_quantity: isShipped ? quantity : 0,
    refunded_quantity: (line as any).refund ? quantity : 0,
  };
}

/**
 * Map returns (array) -> DB returns inserts
 *
 * Accepts an array of ReturnOrder (your walmart.types.ReturnOrder)
 */
export function mapWalmartReturnsToDB(
  walmartReturns: ReturnOrder[],
  storeId: string,
): Database['public']['Tables']['returns']['Insert'][] {
  const results: Database['public']['Tables']['returns']['Insert'][] = [];

  for (const returnOrder of walmartReturns ?? []) {
    if (!returnOrder || !returnOrder.returnOrderId) continue;

    // try to determine external order id: customerOrderId || first line purchaseOrderId
    const externalOrderId =
      returnOrder.customerOrderId ??
      returnOrder.returnOrderLines?.[0]?.purchaseOrderId;

    if (!externalOrderId) continue;

    const refundAmount = returnOrder.totalRefundAmount?.currencyAmount ?? null;
    const currency = returnOrder.totalRefundAmount?.currencyUnit ?? null;

    // Normalize status
    let status = 'processing';
    const lineStatuses =
      returnOrder.returnOrderLines?.map((l) => ({
        status: l.status,
        refundStatus: l.currentRefundStatus,
      })) ?? [];

    if (
      lineStatuses.some(
        (l) =>
          l.refundStatus === 'REFUND_COMPLETED' ||
          l.refundStatus === 'COMPLETED',
      )
    ) {
      status = 'refunded';
    } else if (
      lineStatuses.some((l) =>
        ['INITIATED', 'RECEIVED'].includes(l.status ?? ''),
      )
    ) {
      status = 'pending';
    }

    results.push({
      external_return_id: returnOrder.returnOrderId,
      order_id: externalOrderId, // temporary — resolved to internal id in job
      store_id: storeId,
      platform: 'walmart',
      refund_amount: refundAmount,
      currency,
      status,
    });
  }

  return results;
}
