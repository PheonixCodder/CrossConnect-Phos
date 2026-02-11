import {
  Fulfillment202309SearchPackageResponseDataPackages,
  Order202309GetOrderListResponseDataOrders,
  Order202309GetOrderListResponseDataOrdersLineItems,
  Product202309InventorySearchResponseDataInventory,
  Product202309InventorySearchResponseDataInventorySkus,
  Product202502SearchProductsResponseDataProducts,
  Product202502SearchProductsResponseDataProductsSkus,
  ReturnRefund202309SearchReturnsResponseDataReturnOrders as TikTokReturn,
} from '../../libs/tiktok';
import { Database } from '../../supabase/supabase.types';

export function mapTiktokProductToDB(
  product: Product202502SearchProductsResponseDataProducts,
  storeId: string,
): Database['public']['Tables']['products']['Insert'][] {
  if (!product?.id || !product.skus?.length) return [];

  return product.skus
    .filter((sku) => sku.sellerSku)
    .map((sku: Product202502SearchProductsResponseDataProductsSkus) => ({
      store_id: storeId,
      platform: 'tiktok',
      external_product_id: product.id!,
      sku: sku.sellerSku!,
      title: product.title ?? null,
      description: null,
      currency: 'USD',
      price: sku.price?.taxExclusivePrice
        ? Number(sku.price.taxExclusivePrice)
        : sku.price?.salePrice
          ? Number(sku.price.salePrice)
          : null,
      status: product.status ?? null,
    }));
}

export function mapTiktokInventoryToDB(
  inventory: Product202309InventorySearchResponseDataInventory,
  sku: Product202309InventorySearchResponseDataInventorySkus,
  storeId: string,
  productId: string,
): Database['public']['Tables']['inventory']['Insert'] {
  return {
    store_id: storeId,
    sku: sku.sellerSku!,
    product_id: productId,

    platform_quantity: sku.totalAvailableQuantity ?? 0,
    reserved_quantity: sku.totalCommittedQuantity ?? 0,

    warehouse_quantity:
      sku.warehouseInventory?.reduce(
        (sum, w) => sum + (w.availableQuantity ?? 0),
        0,
      ) ?? null,

    inbound_quantity: null,

    inventory_status:
      (sku.totalAvailableQuantity ?? 0) > 0 ? 'in_stock' : 'out_of_stock',

    last_platform_event: 'tiktok_inventory_sync',
    last_synced_at: new Date().toISOString(),
  };
}

export function shouldUpdateTiktokInventory(
  existing: Database['public']['Tables']['inventory']['Row'],
  next: Database['public']['Tables']['inventory']['Insert'],
): boolean {
  return (
    existing.platform_quantity !== next.platform_quantity ||
    existing.reserved_quantity !== next.reserved_quantity ||
    existing.warehouse_quantity !== next.warehouse_quantity ||
    existing.inventory_status !== next.inventory_status
  );
}

export function mapTiktokOrderToDB(
  o: Order202309GetOrderListResponseDataOrders,
  storeId: string,
): Database['public']['Tables']['orders']['Insert'] {
  return {
    store_id: storeId,
    platform: 'tiktok',
    external_order_id: o.id!,
    currency: o.payment?.currency ?? 'USD',
    status: mapTiktokOrderStatus(o.status),
    payment_status: o.paidTime ? 'paid' : 'pending',
    fulfillment_status: o.status ?? null,
    ordered_at: o.createTime
      ? new Date(o.createTime * 1000).toISOString()
      : null,
    subtotal: Number(o.payment?.subTotal ?? 0),
    tax: Number(o.payment?.tax ?? 0),
    shipping: Number(o.payment?.shippingFee ?? 0),
    total: Number(o.payment?.totalAmount ?? 0),
  };
}

export function mapTiktokOrderStatus(
  status?: string,
): Database['public']['Enums']['order_status'] {
  switch (status) {
    case 'COMPLETED':
    case 'DELIVERED':
      return 'completed';
    case 'CANCEL':
      return 'cancelled';
    case 'UNPAID':
      return 'pending';
    case 'REFUNDED':
      return 'refunded';
    default:
      return 'paid';
  }
}

export function mapTiktokOrderItemsToDB(
  lineItems: Order202309GetOrderListResponseDataOrdersLineItems[],
  orderId: string,
  productIdBySku: Map<string, string>,
): Database['public']['Tables']['order_items']['Insert'][] {
  return lineItems.map((li) => {
    const sku: string =
      (li.sellerSku as string) ??
      (li.skuId as string) ??
      (li.combinedListingSkus?.[0]?.sellerSku as string);

    const productId = productIdBySku.get(sku);

    const unitPrice = Number(li.salePrice ?? li.originalPrice ?? '0');

    return {
      order_id: orderId,
      external_line_item_id: li.id,
      sku,
      product_id: productId,
      quantity: 1,
      price: unitPrice,
      total: unitPrice,
      fulfilled_quantity: 0,
      refunded_quantity: 0,
    };
  });
}

export function mapTiktokFulfillmentsToDB(
  packages: Fulfillment202309SearchPackageResponseDataPackages[],
  store: Database['public']['Tables']['stores']['Row'],
  orderIdByExternalId: Map<string, string>,
  lineItemProductMap: Map<string, string | null>,
): Database['public']['Tables']['fulfillments']['Insert'][] {
  const rows: Database['public']['Tables']['fulfillments']['Insert'][] = [];

  for (const pkg of packages) {
    const orderExternalId = pkg.orders?.[0]?.id;
    if (!orderExternalId) continue;

    const orderId = orderIdByExternalId.get(orderExternalId);
    if (!orderId) continue;

    for (const lineItemId of pkg.orderLineItemIds ?? []) {
      rows.push({
        store_id: store.id,
        platform: 'tiktok',
        order_id: orderId,
        product_id: lineItemProductMap.get(lineItemId) ?? null,
        external_fulfillment_id: pkg.id!,
        external_fulfillment_line_item_id: lineItemId,
        tracking_number: pkg.trackingNumber ?? null,
        carrier: pkg.shippingProviderName ?? null,
        status: pkg.status ?? 'unknown',
      });
    }
  }

  return rows;
}

export function mapTiktokReturnsToDB(
  returns: TikTokReturn[],
  storeId: string,
  orderIdMap: Map<string, string>,
): Database['public']['Tables']['returns']['Insert'][] {
  const mapped: Database['public']['Tables']['returns']['Insert'][] = [];

  for (const ret of returns) {
    const externalOrderId = ret.orderId;
    const externalReturnId = ret.returnId;

    if (!externalOrderId || !externalReturnId) continue;

    const internalOrderId = orderIdMap.get(externalOrderId);
    if (!internalOrderId) continue; // FK safety

    const refundTotal =
      ret.refundAmount?.refundTotal != null
        ? Number(ret.refundAmount.refundTotal)
        : null;

    mapped.push({
      external_return_id: externalReturnId,
      order_id: internalOrderId, // ✅ INTERNAL ID
      store_id: storeId,
      platform: 'tiktok',
      status: ret.returnStatus ?? 'unknown',
      refund_amount: refundTotal,
      currency: ret.refundAmount?.currency ?? null,
    });
  }

  return mapped;
}
