import { Database } from 'src/supabase/supabase.types';
import { AmazonMerchantListingRow } from './amazon.types';
import { InventorySummary } from '@sp-api-sdk/fba-inventory-api-v1';
import { Order, OrderItem } from '@sp-api-sdk/orders-api-v0';

export function mapAmazonInventoryFromFbaSummary(
  summary: InventorySummary,
  storeId: string,
  productId: string,
): Database['public']['Tables']['inventory']['Insert'] {
  const totalQty = summary.totalQuantity ?? null;

  const inventoryStatus =
    totalQty === null ? null : totalQty > 0 ? 'in_stock' : 'out_of_stock';

  return {
    store_id: storeId,
    product_id: productId,
    sku: summary.sellerSku ?? '',

    platform_quantity: totalQty,
    warehouse_quantity: totalQty,

    inbound_quantity:
      summary.inventoryDetails?.inboundWorkingQuantity ??
      summary.inventoryDetails?.inboundShippedQuantity ??
      null,

    reserved_quantity:
      summary.inventoryDetails?.reservedQuantity?.totalReservedQuantity ?? null,

    inventory_status: inventoryStatus,

    last_platform_event: 'amazon_fba_inventory',
    last_synced_at: new Date().toISOString(),
  };
}

export function mapAmazonProductToSupabaseProduct(
  row: AmazonMerchantListingRow,
  storeId: string,
): Database['public']['Tables']['products']['Insert'] {
  const price =
    row.price !== null && row.price !== ''
      ? Number.parseFloat(row.price)
      : null;

  return {
    store_id: storeId,
    platform: 'amazon',

    // Core identifiers
    sku: row['seller-sku'],
    external_product_id: row['product-id'] ?? row['listing-id'] ?? row['seller-sku'],

    // Descriptive
    title: row['item-name'] ?? null,
    description: row['item-description'] ?? null,

    // Commercial
    price: Number.isFinite(price) ? price : null,
    currency: 'EUR', // marketplace-derived later if needed

    // Lifecycle
    status: row.status ?? null,
  };
}

type InventoryRow = Database['public']['Tables']['inventory']['Row'];

type InventoryInsert = Database['public']['Tables']['inventory']['Insert'];

/**
 * Determines whether inventory should be updated based on
 * meaningful field-level differences.
 *
 * This prevents noisy upserts and unnecessary writes.
 */
export function shouldUpdateAmazonInventory(
  existing: InventoryRow,
  incoming: InventoryInsert,
): boolean {
  /**
   * Helper to normalize null/undefined/NaN
   */
  const norm = (value?: number | null) =>
    value === undefined || Number.isNaN(value) ? null : value;

  /**
   * Fields that actually represent inventory state
   * (timestamps and metadata excluded)
   */
  const numericFields: (keyof InventoryInsert)[] = [
    'platform_quantity',
    'warehouse_quantity',
    'inbound_quantity',
    'reserved_quantity',
  ];

  for (const field of numericFields) {
    const prev = norm(existing[field] as number | null);
    const next = norm(incoming[field] as number | null);

    if (prev !== next) {
      return true;
    }
  }

  // Compare string fields directly
  if (existing.inventory_status !== incoming.inventory_status) {
    return true;
  }

  return false;

  return false;
}
export function mapAmazonOrderToDB(
  order: Order,
  storeId: string,
  platform: string,
): Database['public']['Tables']['orders']['Insert'] {
  return {
    store_id: storeId,
    platform,
    external_order_id: order.AmazonOrderId,
    ordered_at: order.PurchaseDate,
    updated_at: order.LastUpdateDate,
    status: mapOrderStatus(order.OrderStatus),
    fulfillment_status: order.FulfillmentChannel ?? null,
    currency: order.OrderTotal?.CurrencyCode ?? 'USD',
    subtotal: order.OrderTotal?.Amount ? Number(order.OrderTotal.Amount) : null,
    total: order.OrderTotal?.Amount ? Number(order.OrderTotal.Amount) : null,
    tax: null, // Can be mapped if Amazon provides tax breakdown
    shipping: order.ShipmentServiceLevelCategory ? 0 : null, // Placeholder
    payment_status: order.OrderStatus === 'Pending' ? 'pending' : 'paid',
  };
}
function mapOrderStatus(
  status: string,
): Database['public']['Enums']['order_status'] {
  switch (status) {
    case 'Pending':
    case 'PendingAvailability':
      return 'pending';
    case 'Unshipped':
      return 'pending';
    case 'PartiallyShipped':
      return 'pending';
    case 'Shipped':
      return 'completed';
    case 'Canceled':
      return 'cancelled';
    case 'Unfulfillable':
      return 'cancelled';
    default:
      return 'pending';
  }
}
export function mapAmazonOrderItemToDB(
  item: OrderItem,
  orderId: string,
  productId?: string,
): Database['public']['Tables']['order_items']['Insert'] {
  const price = item.ItemPrice?.Amount ? Number(item.ItemPrice.Amount) : 0;

  const total = price * item.QuantityOrdered;

  return {
    order_id: orderId,
    product_id: productId ?? null,
    sku: item.SellerSKU ?? item.ASIN,
    quantity: item.QuantityOrdered,
    fulfilled_quantity: item.QuantityShipped ?? 0,
    refunded_quantity: 0, // Amazon returns could be handled separately
    price,
    total,
  };
}
export function mapAmazonShipmentToDB(
  order: Order,
  item: OrderItem,
  storeId: string,
  orderId: string,
  productId?: string,
): Database['public']['Tables']['fulfillments']['Insert'] {
  const externalFulfillmentId = `${order.AmazonOrderId}_${item.OrderItemId}`;

  return {
    store_id: storeId,
    platform: 'amazon',
    order_id: orderId,
    product_id: productId ?? null,
    external_fulfillment_id: externalFulfillmentId,
    status: order.OrderStatus,
    carrier: item.ShippingPrice ? 'Amazon' : null,
    tracking_number: null,
  };
}
