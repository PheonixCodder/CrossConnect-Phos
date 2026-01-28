import {
  ListOrdersResponse200,
  ListShipmentsResponse200,
  ListProductsResponse200,
} from '../../../.api/apis/warehance-api';
import { Database } from '../../supabase/supabase.types';
import { Order } from './warehance.types';

export function mapWarehanceProductsToDB(
  data: ListProductsResponse200['data'],
  storeId: string,
  platform: string,
): Database['public']['Tables']['products']['Insert'][] {
  return (data?.products ?? []).map((product) => {
    const status =
      product.available! > 0
        ? 'active'
        : product.backordered! > 0
          ? 'backorder'
          : 'out_of_stock';

    return {
      external_product_id: String(product.id),
      sku: product.sku ?? `UNKNOWN-${product.id}`,
      title: product.name,
      description: null,

      platform,
      store_id: storeId,

      currency: null,
      price: null,
      status,
    };
  });
}
export function mapPlatformInventoryToDB(
  products: any[], // ← changed: now takes the full array
  storeId: string,
  productIdBySku: Map<string, string>, // ← pass the map instead of single productId
): Database['public']['Tables']['inventory']['Insert'][] {
  // Use a Map to deduplicate by SKU and keep the last occurrence
  const inventoryMap = new Map<
    string,
    Database['public']['Tables']['inventory']['Insert']
  >();

  for (const product of products) {
    const sku = product?.sku?.trim?.();

    // Skip invalid entries
    if (!sku || typeof sku !== 'string' || sku.length === 0) {
      console.warn(`Skipping product with invalid/missing SKU:`, product);
      continue;
    }

    const productId = productIdBySku.get(sku);
    if (!productId) {
      console.warn(`No product_id found for SKU: ${sku}`);
      continue;
    }

    const nextInventory = {
      sku,
      store_id: storeId,
      product_id: productId,
      platform_quantity: product.available ?? 0,
      reserved_quantity: product.allocated ?? 0,
      warehouse_quantity: product.on_hand ?? 0,
      inbound_quantity: null,
      inventory_status: (product.backordered > 0
        ? 'backorder'
        : product.available > 0
          ? 'in_stock'
          : 'out_of_stock') as Database['public']['Enums']['inventory_status'],
      last_platform_event: 'sync',
      last_synced_at: new Date().toISOString(),
    };

    // If we already have this SKU, we keep the last one (you can change logic)
    if (inventoryMap.has(sku)) {
      console.warn(`Duplicate SKU found, keeping last occurrence: ${sku}`);
      // Optional: you could merge instead, e.g.:
      // const existing = inventoryMap.get(sku)!;
      // nextInventory.platform_quantity += existing.platform_quantity; // example merge
    }

    inventoryMap.set(sku, nextInventory);
  }

  const uniqueInventory = Array.from(inventoryMap.values());

  console.log(
    `Mapped ${products.length} products → ${uniqueInventory.length} unique inventory rows`,
  );

  if (products.length !== uniqueInventory.length) {
    console.warn(
      `${products.length - uniqueInventory.length} duplicate SKUs were deduplicated`,
    );
  }

  return uniqueInventory;
}

/**
 * Decide if inventory row needs update
 */
export function shouldUpdateWarehouseInventory(
  existing: Database['public']['Tables']['inventory']['Row'],
  incoming: Database['public']['Tables']['inventory']['Insert'],
) {
  const newQty = incoming.platform_quantity ?? 0;
  const newStatus = newQty > 0 ? 'in_stock' : 'out_of_stock';
  return (
    existing.platform_quantity !== newQty ||
    existing.inventory_status !== newStatus
  );
}

function resolveOrderStatus(
  order: any,
): Database['public']['Enums']['order_status'] {
  if (order.cancelled) return 'cancelled';

  switch (order.fulfillment_status) {
    case 'fulfilled':
      return 'completed';

    case 'partially_fulfilled':
    case 'in_progress':
      return 'paid';

    case 'unfulfilled':
    default:
      return 'pending';
  }
}

export function mapWarehanceOrdersToDB(
  data: ListOrdersResponse200['data'],
  storeId: string,
  platform: string,
): Database['public']['Tables']['orders']['Insert'][] {
  return (data?.orders ?? []).map((order) => {
    const fulfillmentStatus =
      order.fulfillment_status === 'fulfilled' ? 'fulfilled' : 'unfulfilled';

    const status = order.cancelled
      ? 'cancelled'
      : fulfillmentStatus === 'fulfilled'
        ? 'completed'
        : 'pending';

    return {
      external_order_id: String(order.id),
      store_id: storeId,
      platform,
      currency: 'USD',

      status,
      fulfillment_status: fulfillmentStatus,
      payment_status: order.cancelled ? 'refunded' : 'paid',

      ordered_at: order.order_date,

      subtotal: order.subtotal_amount ?? null,
      shipping: order.shipping_amount ?? null,
      tax: order.tax_amount ?? null,
      total: order.total_amount ?? null,
    };
  });
}

export function mapWarehanceOrderItemsToDB(
  order: Order,
  orderId: string,
  productIdBySku: Map<string, string>,
): Database['public']['Tables']['order_items']['Insert'][] {
  return (order.order_items ?? []).map((item) => {
    const sku = item.sku ?? `UNKNOWN-${item.id}`;
    const productId = productIdBySku.get(sku) ?? null;

    const quantity = item.quantity ?? 0;
    const fulfilledQuantity = item.quantity_shipped ?? 0;

    return {
      order_id: orderId,
      sku,
      product_id: productId,

      quantity,
      fulfilled_quantity: fulfilledQuantity,
      refunded_quantity: item.cancelled ? quantity : 0,

      price: null, // Warehance does not expose item pricing
      total: null,
    };
  });
}

export function mapWarehanceShipmentsToDB(
  shipments: ListShipmentsResponse200['data'],
  storeId: string,
  platform: string,
  orderIdByExternalId: Map<string, string>,
  productIdByExternalId: Map<string, string>,
): Database['public']['Tables']['fulfillments']['Insert'][] {
  const inserts: Database['public']['Tables']['fulfillments']['Insert'][] = [];

  for (const shipment of shipments?.shipments ?? []) {
    const orderExternalId = String(shipment.order?.id);
    const orderId = orderIdByExternalId.get(orderExternalId);
    if (!orderId) continue;

    const status = shipment.voided ? 'voided' : 'shipped';

    for (const parcel of shipment.shipment_parcels ?? []) {
      // OPTIONAL: associate first product only
      let productId: string | null = null;

      const firstItem = parcel.items?.[0];
      if (firstItem?.product?.id) {
        productId =
          productIdByExternalId.get(String(firstItem.product.id)) ?? null;
      }

      inserts.push({
        external_fulfillment_id: `${shipment.id}-${parcel.id}`, // UNIQUE PER PARCEL
        store_id: storeId,
        platform,
        order_id: orderId,
        product_id: productId, // nullable is OK

        carrier: shipment.carrier_connection?.carrier ?? null,
        tracking_number: parcel.tracking_number ?? null,
        status,
      });
    }
  }

  return inserts;
}
