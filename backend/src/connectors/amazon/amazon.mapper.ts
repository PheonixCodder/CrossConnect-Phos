import { Database } from '../../supabase/supabase.types';
import {
  AmazonMerchantListingRow,
  AmazonReturnReportItem,
} from './amazon.types';
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
    sku: row['seller-sku'],
    external_product_id: row['seller-sku'],
    title: row['item-name'] ?? null,
    description: row['item-description'] ?? null,
    price: Number.isFinite(price) ? price : null,
    currency: 'USD',
    status: row.status ?? null,
    asin: row.asin1 ?? row.asin2 ?? row.asin3,
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
  return existing.inventory_status !== incoming.inventory_status;
}
export function mapAmazonOrderToDB(
  order: Order,
  storeId: string,
  platform: string,
  items: OrderItem[] = [],
): Database['public']['Tables']['orders']['Insert'] {
  const computedSubtotal = items.reduce((sum, item) => {
    const lineTotal =
      item.ItemPrice?.Amount !== undefined ? Number(item.ItemPrice.Amount) : 0;
    return sum + lineTotal;
  }, 0);

  const hasOrderTotal = order.OrderTotal?.Amount;

  return {
    store_id: storeId,
    platform,
    external_order_id: order.AmazonOrderId,
    ordered_at: order.PurchaseDate,
    updated_at: order.LastUpdateDate,
    status: mapOrderStatus(order.OrderStatus),
    fulfillment_status: order.FulfillmentChannel ?? null,

    currency:
      order.OrderTotal?.CurrencyCode ??
      items[0]?.ItemPrice?.CurrencyCode ??
      'USD',

    subtotal: hasOrderTotal
      ? Number(order.OrderTotal?.Amount)
      : computedSubtotal || null,

    total: hasOrderTotal
      ? Number(order.OrderTotal?.Amount)
      : computedSubtotal || null,

    tax: null, // can be derived later from OrderItem.Tax
    shipping: null, // derive from ShippingPrice if needed

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

function computeOrderTotalsFromItems(items: OrderItem[]) {
  let subtotal = 0;

  for (const item of items) {
    const itemTotal =
      item.ItemPrice?.Amount !== undefined ? Number(item.ItemPrice.Amount) : 0;

    subtotal += itemTotal;
  }

  return {
    subtotal: subtotal > 0 ? subtotal : null,
    total: subtotal > 0 ? subtotal : null,
    currency: items[0]?.ItemPrice?.CurrencyCode ?? 'USD',
  };
}

export function mapAmazonOrderItemToDB(
  item: OrderItem,
  orderId: string,
  productId?: string | null,
): Database['public']['Tables']['order_items']['Insert'] {
  // 1️⃣ Unit price (Amazon ItemPrice is TOTAL, not per-unit)
  const totalItemPrice =
    item.ItemPrice?.Amount !== undefined ? Number(item.ItemPrice.Amount) : 0;

  // 2️⃣ Quantity safety
  const quantityOrdered = item.QuantityOrdered ?? 0;

  // 3️⃣ Per-unit price (Amazon returns TOTAL for the line)
  const unitPrice = quantityOrdered > 0 ? totalItemPrice / quantityOrdered : 0;

  return {
    external_line_item_id: item.OrderItemId,
    order_id: orderId,
    product_id: productId ?? null,

    // ASIN is canonical, SKU is secondary
    sku: item.SellerSKU ?? item.ASIN,

    quantity: quantityOrdered,
    fulfilled_quantity: item.QuantityShipped ?? 0,
    refunded_quantity: 0,

    price: unitPrice,
    total: totalItemPrice,
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
    external_fulfillment_line_item_id: item.OrderItemId,
    order_id: orderId,
    product_id: productId ?? null,
    external_fulfillment_id: externalFulfillmentId,
    status: order.OrderStatus,
    carrier: item.ShippingPrice ? 'Amazon' : null,
    tracking_number: null,
  };
}

export function mapAmazonReturnToDB(
  r: AmazonReturnReportItem,
  storeId: string,
  orderId: string,
): Database['public']['Tables']['returns']['Insert'] {
  /**
   * FBA reports don't provide a unique 'Return ID' like MFN does.
   * We use the License Plate Number (LPN) or a composite of Order+SKU
   * to satisfy the 'external_return_id' constraint.
   */
  const externalReturnId = r.license_plate_number || `${r.order_id}_${r.sku}`;

  return {
    // Required Fields per your Schema
    external_return_id: externalReturnId,
    order_id: orderId,
    store_id: storeId,
    platform: 'amazon',

    // Status mapping: FBA reports use 'status' (e.g., 'Unit returned to inventory')
    status: r.status || 'Returned',

    // FBA Returns reports do not contain financial data
    refund_amount: null,
    currency: 'USD', // Standard default, or null if preferred

    // Timestamps (Database handles created_at, but we set updated_at if needed)
    updated_at: new Date().toISOString(),
  };
}

export interface AmazonOrderReportRow {
  'amazon-order-id': string;
  'merchant-order-id': string;
  'purchase-date': string;
  'last-updated-date': string;
  'order-status': string;
  'fulfillment-channel': string;
  'sales-channel': string;
  'order-channel': string;
  'ship-service-level': string;
  'product-name': string;
  sku: string;
  asin: string;
  'item-status': string;
  quantity: string;
  currency: string;
  'item-price': string;
  'item-tax': string;
  'shipping-price': string;
  'shipping-tax': string;
  'gift-wrap-price': string;
  'gift-wrap-tax': string;
  'item-promotion-discount': string;
  'ship-promotion-discount': string;
  'ship-city': string;
  'ship-state': string;
  'ship-postal-code': string;
  'ship-country': string;
  'promotion-ids': string;
  'is-business-order': string;
  'purchase-order-number': string;
  'price-designation': string;
}

export function mapReportOrderToDB(
  row: AmazonOrderReportRow,
  storeId: string,
): Database['public']['Tables']['orders']['Insert'] {
  const price = parseFloat(row['item-price'] || '0');
  const tax = parseFloat(row['item-tax'] || '0');
  const shipping = parseFloat(row['shipping-price'] || '0');

  return {
    store_id: storeId,
    platform: 'amazon',
    external_order_id: row['amazon-order-id'],
    ordered_at: row['purchase-date'],
    updated_at: row['last-updated-date'],
    status: mapReportStatus(row['order-status']),
    fulfillment_status: row['fulfillment-channel'],
    currency: row['currency'] || 'USD',
    subtotal: price,
    tax: tax,
    shipping: shipping,
    total: price + tax + shipping,
    payment_status: row['order-status'] === 'Pending' ? 'pending' : 'paid',
  };
}

export function mapReportOrderItemToDB(
  row: AmazonOrderReportRow,
  orderId: string,
  productId?: string | null,
): Database['public']['Tables']['order_items']['Insert'] {
  const qty = parseInt(row['quantity'] || '0', 10);
  const total = parseFloat(row['item-price'] || '0');

  return {
    order_id: orderId,
    external_line_item_id: `${row['amazon-order-id']}-${row['sku']}`,
    product_id: productId ?? null,
    sku: row['sku'],
    quantity: qty,
    fulfilled_quantity: row['order-status'] === 'Shipped' ? qty : 0,
    price: qty > 0 ? total / qty : 0,
    total: total,
    refunded_quantity: 0,
  };
}

export function mapReportFulfillmentToDB(
  row: AmazonOrderReportRow,
  storeId: string,
  orderId: string,
  productId?: string | null,
): Database['public']['Tables']['fulfillments']['Insert'] {
  return {
    store_id: storeId,
    order_id: orderId,
    product_id: productId ?? null,
    platform: 'amazon',
    external_fulfillment_id: `f-${row['amazon-order-id']}-${row['sku']}`,
    external_fulfillment_line_item_id: `${row['amazon-order-id']}-${row['sku']}`,
    status: row['order-status'],
    carrier: row['fulfillment-channel'] === 'AFN' ? 'Amazon' : null,
    tracking_number: null,
  };
}

function mapReportStatus(
  status: string,
): Database['public']['Enums']['order_status'] {
  const s = status.toLowerCase();
  if (s.includes('pending')) return 'pending';
  if (s.includes('shipped') || s === 'unshipped') return 'pending';
  if (s === 'cancelled') return 'cancelled';
  return 'pending';
}

function mapAmazonOrderStatus(
  status: string,
): Database['public']['Enums']['order_status'] {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'pending';
    case 'shipped':
      return 'completed';
    case 'canceled':
      return 'cancelled';
    case 'unshipped':
      return 'paid';
    default:
      return 'paid';
  }
}

export function mapFlatFileRowsToOrders(
  rows: any[],
  storeId: string,
): Database['public']['Tables']['orders']['Insert'][] {
  const orderMap = new Map<string, any[]>();

  for (const row of rows) {
    const orderId = row['amazon-order-id'];
    if (!orderMap.has(orderId)) orderMap.set(orderId, []);
    orderMap.get(orderId)!.push(row);
  }

  const orders: Database['public']['Tables']['orders']['Insert'][] = [];

  for (const [externalId, items] of orderMap.entries()) {
    const first = items[0];

    const subtotal = items.reduce(
      (sum, r) => sum + Number(r['item-price'] ?? 0),
      0,
    );

    const tax = items.reduce((sum, r) => sum + Number(r['item-tax'] ?? 0), 0);

    const shipping = items.reduce(
      (sum, r) => sum + Number(r['shipping-price'] ?? 0),
      0,
    );

    const total = subtotal + tax + shipping;

    orders.push({
      store_id: storeId,
      platform: 'amazon',
      external_order_id: externalId,
      ordered_at: first['purchase-date'],
      currency: first['currency'] ?? 'USD',
      subtotal,
      tax,
      shipping,
      total,
      status: mapAmazonOrderStatus(first['order-status']),
      payment_status: 'paid',
      fulfillment_status: first['order-status'],
    });
  }

  return orders;
}

export function mapFlatFileRowToOrderItem(
  row: any,
  orderId: string,
  productId: string | null,
): Database['public']['Tables']['order_items']['Insert'] {
  const price = Number(row['item-price'] ?? 0);
  const quantity = Number(row['quantity'] ?? 1);

  return {
    order_id: orderId,
    external_line_item_id: row['amazon-order-id'] + '-' + row['sku'],
    sku: row['sku'],
    product_id: productId,
    quantity,
    price,
    total: price * quantity,
    fulfilled_quantity: row['item-status'] === 'Shipped' ? quantity : 0,
  };
}
