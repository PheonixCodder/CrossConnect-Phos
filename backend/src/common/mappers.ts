import { Tables, TablesInsert } from '../supabase/supabase.types';

type OrderLike = Tables<'orders'> | TablesInsert<'orders'>;

type OrderItemLike = Tables<'order_items'> | TablesInsert<'order_items'>;

type FulfillmentLike = Tables<'fulfillments'> | TablesInsert<'fulfillments'>;

interface MetricsInput {
  orders: OrderLike[];
  orderItems: OrderItemLike[];
  fulfillments: FulfillmentLike[];
  platform: string;
  storeId: string;
}

export function deriveMetricsFromOrders({
  orders,
  orderItems,
  fulfillments,
  platform,
  storeId,
}: MetricsInput): TablesInsert<'metrics_summary'>[] {
  const metricsMap = new Map<
    string,
    {
      revenue: number;
      orders: number;
      itemsSold: number;
      fulfilledOrders: number;
    }
  >();

  for (const order of orders) {
    if (!order.ordered_at || !order.id) continue;

    const date = new Date(order.ordered_at).toISOString().split('T')[0];

    if (!metricsMap.has(date)) {
      metricsMap.set(date, {
        revenue: 0,
        orders: 0,
        itemsSold: 0,
        fulfilledOrders: 0,
      });
    }

    const bucket = metricsMap.get(date)!;

    bucket.orders += 1;
    bucket.revenue += Number(order.totalDashboard ?? order.total ?? 0);

    // Items sold
    for (const item of orderItems) {
      if (item.order_id === order.id) {
        bucket.itemsSold += item.quantity ?? 0;
      }
    }

    // Fulfillment check
    let hasFulfillment = false;
    let fullyFulfilled = true;

    for (const f of fulfillments) {
      if (f.order_id === order.id) {
        hasFulfillment = true;

        if (f.status !== 'fulfilled' && f.status !== 'delivered') {
          fullyFulfilled = false;
        }
      }
    }

    if (hasFulfillment && fullyFulfilled) {
      bucket.fulfilledOrders += 1;
    }
  }

  const metricsSummary: TablesInsert<'metrics_summary'>[] = [];

  for (const [date, data] of metricsMap.entries()) {
    metricsSummary.push(
      createMetricRow(date, 'revenue', data.revenue, platform, storeId),
      createMetricRow(date, 'orders', data.orders, platform, storeId),
      createMetricRow(date, 'items_sold', data.itemsSold, platform, storeId),
      createMetricRow(
        date,
        'fulfilled_orders',
        data.fulfilledOrders,
        platform,
        storeId,
      ),
    );
  }

  return metricsSummary;
}

function createMetricRow(
  date: string,
  metricType: string,
  value: number,
  platform: string,
  storeId: string,
): TablesInsert<'metrics_summary'> {
  return {
    date,
    metric_type: metricType,
    value,
    platform,
    store_id: storeId,
  };
}
