import { Database } from 'src/supabase/supabase.types';
import { GetInventory } from './faire.types';

// Products

export type FaireVariantImage = {
  url: string;
};

export type FaireVariantOption = {
  name: string;
  value: string;
};

export type FaireVariant = {
  id: string;
  idempotence_token: string;
  name: string;
  sku: string;
  images?: FaireVariantImage[];
  options?: FaireVariantOption[];
  wholesale_price_cents: number;
  retail_price_cents: number;
};

export type FaireProduct = {
  id: string;
  idempotence_token: string;
  brand_id: string;
  name: string;
  short_description?: string;
  description?: string;
  wholesale_price_cents?: number;
  retail_price_cents?: number;
  sale_state: 'FOR_SALE' | 'SALES_PAUSED';
  lifecycle_state: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'DELETED';
  unit_multiplier?: number;
  minimum_order_quantity?: number;
  per_style_minimum_order_quantity?: number;
  variant_option_sets?: {
    name: string;
    values: string[];
  }[];
  taxonomy_type?: {
    id: string;
    name: string;
  };
  variants: FaireVariant[];
  made_in_country?: string;
  created_at: string;
  updated_at: string;
};

const mapFaireStatus = (
  lifecycle: FaireProduct['lifecycle_state'],
  sale: FaireProduct['sale_state'],
): 'ACTIVE' | 'DRAFT' | 'ARCHIVED' => {
  if (lifecycle === 'DELETED') {
    return 'ARCHIVED';
  }

  if (
    lifecycle === 'DRAFT' ||
    lifecycle === 'UNPUBLISHED' ||
    sale === 'SALES_PAUSED'
  ) {
    return 'DRAFT';
  }

  // lifecycle === 'PUBLISHED' && sale === 'FOR_SALE'
  return 'ACTIVE';
};

export const mapProductsToDB = (
  product: FaireProduct,
  storeId: string,
): Database['public']['Tables']['products']['Insert'][] => {
  return product.variants.map((variant) => ({
    store_id: storeId,
    platform: 'FAIRE',
    external_product_id: variant.id,
    sku: variant.sku,
    title: `${product.name} - ${variant.name}`,
    description: product.description ?? product.short_description ?? '',
    status: mapFaireStatus(product.lifecycle_state, product.sale_state),
    price: variant.wholesale_price_cents / 100,
    currency: 'USD',
  }));
};

// Orders

export type FaireOrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  sku: string;
  price_cents: number;
  product_name: string;
  variant_name: string;
  includes_tester: boolean;
};

export type FaireOrderAddress = {
  name: string;
  address1: string;
  address2?: string;
  postal_code: string;
  city: string;
  state: string;
  state_code?: string;
  phone_number?: string;
  country: string;
  country_code: string;
  company_name?: string;
};

export type FaireOrderPayout = {
  payout_fee_cents: number;
  payout_fee_bps: number;
  commission_cents: number;
  commission_bps: number;
};

export type FaireShipmentItem = {
  id: string;
  order_id: string;
  maker_cost_cents: number;
  carrier: string;
  tracking_code: string;
  created_at: string;
  updated_at: string;
  shipping_type: string;
};

export type FaireOrder = {
  id: string;
  created_at: string;
  updated_at: string;
  state:
    | 'NEW'
    | 'PROCESSING'
    | 'PRE_TRANSIT'
    | 'IN_TRANSIT'
    | 'DELIVERED'
    | 'PENDING_RETAILER_CONFIRMATION'
    | 'BACKORDERED'
    | 'CANCELED';
  cancel_reason?:
    | 'REQUESTED_BY_RETAILER'
    | 'RETAILER_NOT_GOOD_FIT'
    | 'CHANGE_REPLACE_ORDER'
    | 'ITEM_OUT_OF_STOCK'
    | 'INCORRECT_PRICING'
    | 'ORDER_TOO_SMALL'
    | 'REJECT_INTERNATIONAL_ORDER'
    | 'OTHER';
  free_shipping_reason?:
    | 'INSIDER_FREE_SHIPPING'
    | 'FAIRE_DIRECT'
    | 'BRAND_DISCOUNT'
    | 'FIRST_ORDER'
    | 'PROMO_CODE'
    | 'FREE_SHIPPING_THRESHOLD';
  items: FaireOrderItem[];
  shipments: FaireShipmentItem[];
  address: FaireOrderAddress;
  retailer_id: string;
  payout_costs: FaireOrderPayout;
  source: string;
  purchase_order_number: string;
  has_pending_retailer_cancellation_request: boolean;
};

const mapOrderStatus = (
  state: FaireOrder['state'],
): 'pending' | 'paid' | 'cancelled' | 'refunded' | 'completed' => {
  switch (state) {
    case 'NEW':
    case 'PROCESSING':
    case 'PRE_TRANSIT':
    case 'PENDING_RETAILER_CONFIRMATION':
    case 'BACKORDERED':
      return 'pending';
    case 'IN_TRANSIT':
      return 'completed';
    case 'DELIVERED':
      return 'completed';
    case 'CANCELED':
      return 'cancelled';
    default:
      return 'pending';
  }
};

export const mapOrdersToDB = (
  orders: FaireOrder[],
  storeId: string,
  productMap?: Map<string, string>, // external_product_id -> internal UUID
  orderIdMap?: Map<string, string>, // external_order_id -> internal UUID
): {
  orders: Database['public']['Tables']['orders']['Insert'][];
  orderItems: Database['public']['Tables']['order_items']['Insert'][];
  shipments: Database['public']['Tables']['fulfillments']['Insert'][];
} => {
  const ordersDB: Database['public']['Tables']['orders']['Insert'][] = [];
  const orderItemsDB: Database['public']['Tables']['order_items']['Insert'][] =
    [];
  const shipmentsDB: Database['public']['Tables']['fulfillments']['Insert'][] =
    [];

  for (const order of orders) {
    const subtotalCents = order.items.reduce(
      (sum, item) => sum + item.price_cents * item.quantity,
      0,
    );
    const total = subtotalCents / 100;

    // --- Orders ---
    const orderInsert: Database['public']['Tables']['orders']['Insert'] = {
      store_id: storeId,
      platform: 'FAIRE',
      external_order_id: order.id,
      status: mapOrderStatus(order.state),
      currency: 'USD',
      total,
      subtotal: total,
      tax: null,
      shipping: null,
      payment_status: null,
      fulfillment_status: null,
      ordered_at: order.created_at,
      created_at: order.created_at,
      updated_at: order.updated_at,
    };
    ordersDB.push(orderInsert);

    // --- Order Items ---
    for (const item of order.items) {
      const totalItem = (item.price_cents * item.quantity) / 100;

      const itemInsert: Database['public']['Tables']['order_items']['Insert'] =
        {
          order_id: orderIdMap?.get(order.id) ?? order.id, // use internal ID if available
          sku: item.sku,
          product_id: item.product_id
            ? (productMap?.get(item.product_id) ?? null)
            : null,
          quantity: item.quantity,
          fulfilled_quantity: 0,
          refunded_quantity: 0,
          price: item.price_cents / 100,
          total: totalItem,
          created_at: order.created_at,
          updated_at: order.updated_at,
        };

      orderItemsDB.push(itemInsert);
    }

    // --- Shipments / Fulfillments ---
    if (order.shipments && order.shipments.length > 0) {
      for (const shipment of order.shipments) {
        const shipmentInsert: Database['public']['Tables']['fulfillments']['Insert'] =
          {
            store_id: storeId,
            platform: 'FAIRE',
            external_fulfillment_id: shipment.id,
            order_id: orderIdMap?.get(order.id) ?? order.id,
            status: 'pending',
            carrier: shipment.carrier ?? null,
            tracking_number: shipment.tracking_code ?? null,
            created_at: shipment.created_at,
            updated_at: shipment.updated_at,
          };

        shipmentsDB.push(shipmentInsert);
      }
    }
  }

  return { orders: ordersDB, orderItems: orderItemsDB, shipments: shipmentsDB };
};

// Inventory
export const generateInventoryUrl = (
  products: Database['public']['Tables']['products']['Insert'][],
): string => {
  if (!products || products.length === 0) {
    throw new Error('No products provided to generate inventory URL');
  }
  const baseUrl = '/product-inventory/by-skus';
  // Map all skus and encode them for URL safety
  const skus = products.map((p) => p.sku).filter(Boolean);
  if (skus.length === 0) {
    throw new Error('No valid SKUs found in products');
  }
  const skuParams = skus
    .map((sku) => `skus=${encodeURIComponent(sku)}`)
    .join('&');
  return `${baseUrl}?${skuParams}`;
};
type InventoryRow = Database['public']['Tables']['inventory']['Row'];
type InventoryInsert = Database['public']['Tables']['inventory']['Insert'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];

const normalizeQuantity = (metric: {
  type: 'QUANTITY' | 'UNTRACKED';
  quantity: number | null;
}): number | null => {
  // Business decision: UNTRACKED → null (NOT 0)
  if (metric.type === 'UNTRACKED') return null;
  return metric.quantity;
};

const deriveInventoryStatus = (
  qty: number | null,
): InventoryInsert['inventory_status'] => {
  if (qty === null) return null;
  if (qty <= 0) return 'out_of_stock';
  return 'in_stock';
};

export const mapInventoryToDB = (
  inventoryData: GetInventory,
  storeId: string,
  insertedProducts: ProductInsert[],
  existingInventoryBySku: Record<string, InventoryRow>,
): InventoryInsert[] => {
  const productBySku = new Map<string, ProductInsert>(
    insertedProducts.map((p) => [p.sku, p]),
  );

  const updates: InventoryInsert[] = [];

  for (const [sku, item] of Object.entries(inventoryData)) {
    const product = productBySku.get(sku);

    if (!product) {
      console.warn(
        `Skipping inventory sync — SKU not found in products: ${sku}`,
      );
      continue;
    }

    const warehouseQty = normalizeQuantity(item.on_hand_quantity);
    const reservedQty = normalizeQuantity(item.committed_quantity);
    const platformQty = normalizeQuantity(item.available_quantity);
    const status = deriveInventoryStatus(platformQty);

    const existing = existingInventoryBySku[sku];

    // Change detection: skip unchanged inventory
    if (
      existing &&
      existing.warehouse_quantity === warehouseQty &&
      existing.reserved_quantity === reservedQty &&
      existing.platform_quantity === platformQty &&
      existing.inventory_status === status
    ) {
      continue;
    }

    updates.push({
      store_id: storeId,
      product_id: product.id, // internal DB ID
      sku,
      warehouse_quantity: warehouseQty,
      reserved_quantity: reservedQty,
      platform_quantity: platformQty,
      inventory_status: status,
      last_platform_event: 'FAIRE_SYNC',
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return updates;
};
