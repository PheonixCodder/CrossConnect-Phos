interface OrderLike {
  id?: string | null;
  ordered_at?: string | null;
  total?: number | string | null;
  totalDashboard?: number | string | null;
}

interface OrderItemLike {
  order_id?: string | null;
  quantity?: number | null;
}

interface FulfillmentLike {
  order_id?: string | null;
  status?: string | null;
}

interface MetricsInput {
  orders: OrderLike[];
  orderItems: OrderItemLike[];
  fulfillments: FulfillmentLike[];
  platform: string;
  storeId: string;
}

export interface MetricSummaryInsert {
  date: string;
  metric_type: string;
  value: number;
  platform: string;
  store_id: string;
}

export function deriveMetricsFromOrders({
  orders,
  orderItems,
  fulfillments,
  platform,
  storeId,
}: MetricsInput): MetricSummaryInsert[] {
  const itemsByOrderId = groupByOrderId(orderItems);
  const fulfillmentsByOrderId = groupByOrderId(fulfillments);
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

    const items = itemsByOrderId.get(order.id) ?? [];
    const orderFulfillments = fulfillmentsByOrderId.get(order.id) ?? [];

    bucket.itemsSold += items.reduce(
      (total, item) => total + (item.quantity ?? 0),
      0,
    );

    if (
      orderFulfillments.length &&
      orderFulfillments.every(isFulfilledStatus)
    ) {
      bucket.fulfilledOrders += 1;
    }
  }

  const metricsSummary: MetricSummaryInsert[] = [];

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

function groupByOrderId<T extends { order_id?: string | null }>(
  rows: T[],
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const row of rows) {
    if (!row.order_id) continue;

    const current = grouped.get(row.order_id);
    if (current) {
      current.push(row);
    } else {
      grouped.set(row.order_id, [row]);
    }
  }

  return grouped;
}

function isFulfilledStatus(fulfillment: FulfillmentLike): boolean {
  return (
    fulfillment.status === 'fulfilled' || fulfillment.status === 'delivered'
  );
}

function createMetricRow(
  date: string,
  metricType: string,
  value: number,
  platform: string,
  storeId: string,
): MetricSummaryInsert {
  return {
    date,
    metric_type: metricType,
    value,
    platform,
    store_id: storeId,
  };
}
