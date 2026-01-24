import {
  ListOrdersResponse200,
  ListShipmentsResponse200,
  ListProductsResponse200,
} from '@api/warehance-api';
import { Database } from '../../supabase/supabase.types';
import { Order } from './warehance.types';

export function mapWarehanceProductsToDB(
  data: ListProductsResponse200['data'],
  storeId: string,
  platform: string,
): Database['public']['Tables']['products']['Insert'][] {
  return (
    data?.products?.map((product) => ({
      external_product_id: String(product.id),
      sku: product.sku ?? `UNKNOWN-${product.id}`,
      title: product.name,
      description: null,
      platform,
      store_id: storeId,
      currency: null,
      price: null,
      status:
        (product.available ?? 0) > 0
          ? 'active'
          : (product.backordered ?? 0) > 0
            ? 'backorder'
            : 'out_of_stock',
    })) ?? []
  );
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
  return (
    (data?.orders ?? []).map((order) => ({
      external_order_id: String(order.id),
      store_id: storeId,
      platform,
      currency: 'USD',
      status: resolveOrderStatus(order),
      fulfillment_status: order.fulfillment_status,
      payment_status: null,
      ordered_at: order.order_date,
      subtotal: order.subtotal_amount ?? null,
      shipping: order.shipping_amount ?? null,
      tax: order.tax_amount ?? null,
      total: order.total_amount ?? null,
    })) ?? []
  );
}

export function mapWarehanceOrderItemsToDB(
  order: Order,
  orderId: string,
  productIdBySku: Map<string, string>,
): Database['public']['Tables']['order_items']['Insert'][] {
  return (order.order_items ?? []).map((item) => {
    // 1. Handle the SKU fallback
    const itemSku = item.sku ?? 'UNKNOWN';
    const productId = productIdBySku.get(itemSku) ?? null;

    return {
      order_id: orderId,
      sku: itemSku, // Ensuring string, not string | undefined
      product_id: productId,
      // 2. Fallback for quantity (defaults to 0 if undefined)
      quantity: item.quantity ?? 0,
      fulfilled_quantity: item.quantity_shipped ?? 0,
      // 3. Fallback for refunded_quantity
      refunded_quantity: item.cancelled ? (item.quantity ?? 0) : 0,
      price: 0,
      total: 0,
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

  const newShipments = shipments?.shipments;

  for (const shipment of newShipments ?? []) {
    const orderExternalId = String(shipment.order?.id);
    const orderId = orderIdByExternalId.get(orderExternalId);
    if (!orderId) continue;

    for (const parcel of shipment.shipment_parcels ?? []) {
      const trackingNumber = parcel.tracking_number ?? null;

      for (const item of parcel.items ?? []) {
        const productExternalId = String(item.product?.id);
        const productId = productIdByExternalId.get(productExternalId) ?? null;

        inserts.push({
          external_fulfillment_id: String(parcel.id),
          store_id: storeId,
          platform,
          order_id: orderId,
          product_id: productId,
          carrier: shipment.carrier_connection?.carrier ?? null,
          tracking_number: trackingNumber,
          status: shipment.voided ? 'voided' : 'shipped',
        });
      }
    }
  }

  return inserts;
}
