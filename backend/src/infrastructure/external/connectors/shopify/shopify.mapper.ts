import { Database } from '../../../../infrastructure/persistence/supabase/supabase.types';
import {
  FetchFulfillmentsQuery,
  FetchInventoryLevelsQuery,
  FetchOrdersQuery,
  FetchProductsQuery,
  FetchReturnsQuery,
} from './graphql/generated/admin.generated';
import { SalesTableData } from './shopify.service';

export type ShopifyProductNode =
  FetchProductsQuery['products']['nodes'][number];
export type ShopifyInventoryItemNode =
  FetchInventoryLevelsQuery['inventoryItems']['nodes'][number];
type ShopifyInventoryLevelNode =
  ShopifyInventoryItemNode['inventoryLevels']['nodes'][number];

export function mapShopifyProductToDB(
  product: ShopifyProductNode,
  storeId: string,
): Database['public']['Tables']['products']['Insert'][] {
  if (!product.variants?.nodes?.length) return [];

  return product.variants.nodes.map((variant) => {
    // 🔑 CRITICAL FIX:
    // Namespace SKU by product to avoid batch conflicts
    const sku = buildShopifySku(
      product.id,
      variant.sku,
      variant.id.split('/').pop(),
    );
    return {
      external_product_id: product.id, // product-level ID (correct)
      platform: 'shopify',
      store_id: storeId,
      sku,
      title: product.title,
      description: product.descriptionPlainSummary || null,
      price: variant.price ? Number(variant.price) : 0,
      currency: 'USD',
      status: product.status?.toLowerCase() ?? 'draft',
    };
  });
}

export function buildShopifySku(
  productGid: string,
  rawSku: string | null | undefined,
  fallbackId?: string,
): string {
  const productId = productGid.split('/').pop();

  if (rawSku && rawSku.trim().length > 0) {
    return `shopify-${productId}-${rawSku.trim()}`;
  }

  if (fallbackId) {
    return `shopify-${productId}-inventory-${fallbackId}`;
  }

  return `shopify-${productId}-no-sku`;
}

export function mapShopifyInventoryToDB(
  item: ShopifyInventoryItemNode,
  level: ShopifyInventoryLevelNode,
  storeId: string,
  productId: string,
): Database['public']['Tables']['inventory']['Insert'] {
  const available =
    level.quantities?.find((q) => q.name === 'available')?.quantity ?? 0;

  const inventoryItemId = item.id.split('/').pop();

  const sku = buildShopifySku(
    item.variant.product.id,
    item.sku,
    inventoryItemId,
  );

  return {
    store_id: storeId,
    product_id: productId,
    sku,
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
export type ShopifyOrderNode = FetchOrdersQuery['orders']['nodes'][number];
type ShopifyLineItemNode = ShopifyOrderNode['lineItems']['nodes'][number];
export type ShopifyFulfillmentOrderNode =
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
    const unitPrice = item.originalUnitPriceSet?.shopMoney?.amount || '0'; // Default if price data is missing
    const quantity = item.quantity || 0;

    return {
      external_line_item_id: item.id,
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
  productIdBySku: Map<string, string>,
): Database['public']['Tables']['fulfillments']['Insert'][] {
  const rows: Database['public']['Tables']['fulfillments']['Insert'][] = [];

  for (const orderNode of orderNodes) {
    const internalOrderId = orderIdByExternalId.get(orderNode.id);
    if (!internalOrderId) continue;

    for (const fulfillment of orderNode.fulfillments || []) {
      const tracking = fulfillment.trackingInfo?.[0];
      const fulfillmentLines = fulfillment.fulfillmentLineItems?.nodes || [];

      for (const fLine of fulfillmentLines) {
        const lineItem = fLine.lineItem;
        if (!lineItem) continue;

        const rawSku = lineItem.sku;
        const productGid = lineItem.product?.id;
        if (!rawSku || !productGid) continue;

        // product.id looks like "gid://shopify/Product/123456789"
        const productNumericId = productGid.split('/').pop();

        // Rebuild the same SKU key we used when inserting products
        const skuKey = `shopify-${productNumericId}-${rawSku}`;

        const internalProductId = productIdBySku.get(skuKey);
        if (!internalProductId) {
          continue;
        }

        rows.push({
          store_id: storeId,
          platform: 'shopify',
          external_fulfillment_id: fulfillment.id,
          external_fulfillment_line_item_id: fLine.id,
          order_id: internalOrderId,
          product_id: internalProductId,
          status: fulfillment.status.toLowerCase(),
          carrier: tracking?.company || null,
          tracking_number: tracking?.number || null,
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
    order.returns?.nodes?.length === 1
      ? order.refunds?.reduce((sum, refund) => {
          return (
            sum +
            parseFloat(String(refund.totalRefundedSet.shopMoney.amount) || '0')
          );
        }, 0) || 0
      : 0;

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

type ShopifyQlColumn = {
  name: string;
  dataType: string;
  displayName: string;
};

type ShopifyQlTableData = {
  columns: ShopifyQlColumn[];
  rows: Record<string, any>[];
};

type MetricsInsert = Database['public']['Tables']['metrics_summary']['Insert'];

export function mapShopifyPerformanceToDb(
  tableData: SalesTableData | null,
  storeId: string,
): MetricsInsert[] {
  if (!tableData) return [];

  const { columns, rows } = tableData;

  // Find column names programmatically, in case Shopify renames fields later
  const colDay =
    columns.find((c) => c.dataType?.includes('DAY'))?.name ?? 'day';
  const colGrossSales =
    columns.find((c) => c.name === 'gross_sales')?.name ?? 'gross_sales';
  const colOrders = columns.find((c) => c.name === 'orders')?.name ?? 'orders';
  const colUnitsSold =
    columns.find((c) => c.name === 'units_sold')?.name ?? 'units_sold';

  const records: MetricsInsert[] = [];

  for (const row of rows) {
    const date = row[colDay] as string | undefined;
    if (!date) continue;

    // 1. Sales (gross_sales)
    const grossSales = row[colGrossSales];
    if (grossSales != null) {
      records.push(
        createShopifyMetricRow(storeId, date, 'sales', Number(grossSales)),
      );
    }

    // 2. Orders count
    const orders = row[colOrders];
    if (orders != null) {
      records.push(
        createShopifyMetricRow(storeId, date, 'orders_count', Number(orders)),
      );
    }

    // 3. Units sold
    const unitsSold = row[colUnitsSold];
    if (unitsSold != null) {
      records.push(
        createShopifyMetricRow(storeId, date, 'units_sold', Number(unitsSold)),
      );
    }
  }

  return records;
}

function createShopifyMetricRow(
  storeId: string,
  date: string,
  type: string,
  value: number,
): MetricsInsert {
  return {
    store_id: storeId,
    platform: 'shopify',
    date,
    metric_type: type,
    value,
    created_at: new Date().toISOString(),
  };
}
