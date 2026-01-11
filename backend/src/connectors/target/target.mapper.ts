import { Database } from 'src/supabase/supabase.types';

// Product
export interface TargetProductField {
  name: string;
  value: string;
}

export interface TargetPrice {
  last_updated: string;
  list_price: number;
  map_price?: number;
  offer_price?: number;
}

export interface TargetProductStatus {
  id: string;
  listing_status:
    | 'APPROVED'
    | 'PENDING'
    | 'REJECTED'
    | 'UNLISTED'
    | 'SUSPENDED';
  validation_status:
    | 'INITIATED'
    | 'VALIDATED'
    | 'ERROR'
    | 'BLOCKED'
    | 'REVIEW'
    | 'DEPRECATED';
  current: boolean;
  latest: boolean;
  version: number;
  created: string;
  last_modified: string;
}

export interface TargetQuantity {
  distribution_center_id: string;
  quantity: number;
  created: string;
  last_modified: string;
}

export interface TargetProduct {
  id: string;
  external_id: string;
  seller_id: string;
  tcin: string;
  created: string;
  created_by: string;
  last_modified: string;
  last_modified_by: string;
  parent_id?: string;
  relationship_type: 'VAP' | 'SA';
  fields?: TargetProductField[];
  price: TargetPrice;
  product_statuses: TargetProductStatus[];
  quantities: TargetQuantity[];
}

function getFieldValue(
  fields: { name: string; value: string }[] | undefined,
  fieldName: string,
): string | null {
  return (
    fields?.find((f) => f.name.toLowerCase() === fieldName.toLowerCase())
      ?.value ?? null
  );
}

function getCurrentStatus(statuses: TargetProductStatus[]) {
  return statuses.find((s) => s.current) ?? statuses[0];
}

export function mapTargetProductToSupabaseProduct(
  product: TargetProduct,
  storeId: string,
): Database['public']['Tables']['products']['Insert'] {
  const currentStatus = getCurrentStatus(product.product_statuses);

  return {
    external_product_id: product.id,
    sku: product.external_id,
    platform: 'target',
    store_id: storeId,

    title:
      getFieldValue(product.fields, 'title') ??
      getFieldValue(product.fields, 'name'),

    description: getFieldValue(product.fields, 'description'),

    price: product.price.offer_price ?? product.price.list_price ?? null,
    currency: 'USD',

    status: currentStatus?.listing_status,

    created_at: product.created,
    updated_at: product.last_modified,
  };
}

export function mapTargetInventoryToSupabaseInventory(
  product: TargetProduct,
  storeId: string,
  productId: string,
): Database['public']['Tables']['inventory']['Insert'] {
  const totalQuantity =
    product.quantities?.reduce((sum, q) => sum + (q.quantity ?? 0), 0) ?? 0;

  return {
    product_id: productId,
    sku: product.external_id,
    store_id: storeId,

    platform_quantity: totalQuantity,
    inventory_status: totalQuantity > 0 ? 'in_stock' : 'out_of_stock',

    last_platform_event: product.product_statuses.find((s) => s.current)
      ?.listing_status,

    last_synced_at: new Date().toISOString(),
  };
}

// Order
export type TargetOrderLineStatus = {
  quantity: number;
  status: 'PENDING' | 'ACKNOWLEDGED_BY_SELLER' | 'SHIPPED' | 'CANCELED';
};

export type TargetOrderLineDiscount = {
  description: string;
  discount_amount: number;
  promotion_id: string;
  promotion_text: string;
};

export type TargetOrderLineOtherInfo = {
  name: string;
  value: string;
};

export type TargetOrderLine = {
  cancellation_reason?:
    | 'OTHER'
    | 'GENERAL_ADJUSTMENT'
    | 'ITEM_NOT_AVAILABLE'
    | 'CUSTOMER_RETURNED_ITEM'
    | 'COULD_NOT_SHIP'
    | 'ALTERNATE_ITEM_PROVIDED'
    | 'BUYER_CANCELED'
    | 'CUSTOMER_EXCHANGE'
    | 'MERCHANDISE_NOT_RECEIVED'
    | 'SHIPPING_ADDRESS_UNDELIVERABLE';
  discounts?: TargetOrderLineDiscount[];
  external_id: string; // SKU
  is_registry_item?: boolean;
  is_two_day_ship?: boolean;
  order_line_number: string;
  order_line_statuses: TargetOrderLineStatus[];
  other_fees?: number;
  other_info?: TargetOrderLineOtherInfo[];
  quantity: number;
  routing?: string;
  tcin?: string;
  total_gift_option_price?: number;
  total_handling_price?: number;
  total_item_discount?: number;
  total_price: number;
  total_shipping_discount?: number;
  total_shipping_price?: number;
  unit_price: number;
};

export type TargetOrder = {
  status:
    | 'PENDING'
    | 'RELEASED_FOR_SHIPMENT'
    | 'ACKNOWLEDGED_BY_SELLER'
    | 'PARTIALLY_SHIPPED'
    | 'SHIPPED'
    | 'CANCELED'
    | 'REFUNDED';
  currency: string;
  distribution_center_id?: string;
  id: string; // external order id from Target
  level_of_service?: string;
  order_date?: string;
  order_lines: TargetOrderLine[];
  order_number: string;
  other_info?: TargetOrderLineOtherInfo[];
  requested_delivery_date?: string;
  requested_shipment_date?: string;
  scac?: string;
  seller_id: string;
  ship_advice_number: string;
  ship_node_id?: string;
  vmm_vendor_id?: string;
  created: string;
  created_by?: string;
  last_modified: string;
  last_modified_by?: string;
};

export type TargetFulfillment = {
  id: string; // external fulfillment id
  order_id: string; // external order id (Target)
  order_line_number: string;
  quantity: number;
  shipping_method?: string;
  tracking_number?: string;
  shipped_date?: string;
  created: string;
  created_by?: string;
  last_modified: string;
  last_modified_by?: string;
};

/**
 * Map Target API order to DB orders.Insert
 * Note: storeId must come from store repo (store scoping)
 */
export function mapOrderToDB(
  order: TargetOrder,
  storeId: string,
): Database['public']['Tables']['orders']['Insert'] {
  const subtotal = order.order_lines.reduce(
    (sum, line) => sum + (line.unit_price ?? 0) * (line.quantity ?? 0),
    0,
  );
  const shipping = order.order_lines.reduce(
    (sum, line) => sum + (line.total_shipping_price ?? 0),
    0,
  );
  const total =
    order.order_lines.reduce((sum, line) => sum + (line.total_price ?? 0), 0) +
    shipping;

  return {
    // you may or may not want to control `id` explicitly. We do NOT require it here
    // because OrdersRepository.upsert uses onConflict: 'external_order_id'
    // but we can set a deterministic internal id if desired. Here we omit id.
    external_order_id: order.id,
    platform: 'target',
    store_id: storeId,
    status: (order.status ?? 'PENDING').toLowerCase() as any,
    currency: order.currency ?? 'USD',
    ordered_at: order.order_date,
    subtotal: subtotal || null,
    shipping: shipping || null,
    total: total || null,
    created_at: order.created,
    updated_at: order.last_modified,
    fulfillment_status: null,
    payment_status: null,
  };
}

/**
 * Map Target order lines to DB order_items.Insert
 * - orderInternalId is the internal orders.id (returned from DB upsert)
 * - productMap: external_product_id (SKU) -> internal products.id
 */
export function mapOrderLinesToDB(
  orderInternalId: string,
  orderLines: TargetOrderLine[],
  productMap: Record<string, string>,
): Database['public']['Tables']['order_items']['Insert'][] {
  const now = new Date().toISOString();
  return orderLines.map((line) => {
    const productId = productMap[line.external_id] ?? null;
    const fulfilledQty =
      line.order_line_statuses?.find((s) => s.status === 'SHIPPED')?.quantity ??
      null;

    return {
      order_id: orderInternalId,
      product_id: productId,
      sku: line.external_id,
      price: line.unit_price,
      quantity: line.quantity,
      total: line.total_price,
      fulfilled_quantity: fulfilledQty,
      refunded_quantity: 0,
      created_at: now,
      updated_at: now,
    };
  });
}

/**
 * Map Target fulfillment -> DB fulfillments.Insert
 * - orderInternalId is the internal orders.id (returned from DB upsert)
 * - productId should be resolved at call site by matching order_line_number -> line.external_id -> productMap
 */
export function mapFulfillmentToDB(
  fulfillment: TargetFulfillment,
  orderInternalId: string,
  productId: string | null,
  storeId: string,
): Database['public']['Tables']['fulfillments']['Insert'] {
  return {
    external_fulfillment_id: fulfillment.id,
    order_id: orderInternalId,
    platform: 'target',
    product_id: productId ?? null,
    store_id: storeId,
    status: 'shipped',
    carrier: fulfillment.shipping_method ?? null,
    tracking_number: fulfillment.tracking_number ?? null,
    created_at: fulfillment.created,
    updated_at: fulfillment.last_modified,
  };
}

// Product Returns
export interface TargetInboundTrackingData {
  inbound_location_id?: number;
  inbound_ship_date?: string; // ISO 8601
  inbound_tracking_number?: string;
}

export interface TargetReturnTrackingData {
  bill_of_lading?: string;
  crc_received_date?: string; // ISO 8601
  license_plate?: number;
  scac?: string;
  ship_date?: string; // ISO 8601
  store_physical_disposition?: string;
  tracking_number?: string;
}

export interface TargetProductReturn {
  // --- Audit ---
  id: string;
  created: string; // ISO 8601
  created_by: string;
  last_modified: string;
  last_modified_by: string;

  // --- Seller / Order ---
  seller_id: string;
  order_id: string; // External Target order ID
  order_number?: string;
  reference_id?: string;

  // --- Product ---
  external_id: string; // External SKU
  tcin: string;
  quantity: number;

  // --- Return info ---
  return_date: string; // ISO 8601
  return_reason: string;
  customer_can_keep?: boolean;
  is_online?: boolean;
  location_id?: number;

  // --- Dispositions ---
  financial_disposition?: string;
  physical_disposition?: string;

  // --- Logistics ---
  inbound_tracking_data?: TargetInboundTrackingData;
  tracking_data?: TargetReturnTrackingData[];
}

type ReturnInsert = Database['public']['Tables']['returns']['Insert'];

export function mapTargetReturnsToDB(
  returns: TargetProductReturn[],
  storeId: string,
): ReturnInsert[] {
  return returns.map((ret) => ({
    // External return ID from Target
    external_return_id: ret.id,

    // ⚠️ IMPORTANT
    // This is STILL the EXTERNAL order ID
    // It will be replaced later with internal DB order.id
    order_id: ret.order_id,

    store_id: storeId,
    platform: 'target',

    status: ret.return_reason ?? 'UNKNOWN',

    // Optional / nullable fields
    currency: 'USD', // Target is USD unless otherwise stated
    refund_amount: null,

    // Audit timestamps (optional – Supabase can default these)
    created_at: ret.created,
    updated_at: ret.last_modified,
  }));
}
