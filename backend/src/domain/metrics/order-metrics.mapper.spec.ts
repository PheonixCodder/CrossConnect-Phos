import { deriveMetricsFromOrders } from './order-metrics.mapper';

describe('deriveMetricsFromOrders', () => {
  it('aggregates revenue, order count, item count, and fully fulfilled orders by day', () => {
    const metrics = deriveMetricsFromOrders({
      platform: 'shopify',
      storeId: 'store-1',
      orders: [
        {
          id: 'order-1',
          ordered_at: '2026-06-10T10:00:00.000Z',
          total: 10,
        },
        {
          id: 'order-2',
          ordered_at: '2026-06-10T11:00:00.000Z',
          totalDashboard: 20,
        },
        {
          id: 'order-3',
          ordered_at: '2026-06-11T10:00:00.000Z',
          total: 5,
        },
      ],
      orderItems: [
        { order_id: 'order-1', quantity: 2 },
        { order_id: 'order-1', quantity: 3 },
        { order_id: 'order-2', quantity: 1 },
        { order_id: 'order-3', quantity: 4 },
      ],
      fulfillments: [
        { order_id: 'order-1', status: 'fulfilled' },
        { order_id: 'order-2', status: 'shipped' },
        { order_id: 'order-3', status: 'delivered' },
      ],
    });

    expect(metrics).toEqual(
      expect.arrayContaining([
        metric('2026-06-10', 'revenue', 30),
        metric('2026-06-10', 'orders', 2),
        metric('2026-06-10', 'items_sold', 6),
        metric('2026-06-10', 'fulfilled_orders', 1),
        metric('2026-06-11', 'revenue', 5),
        metric('2026-06-11', 'orders', 1),
        metric('2026-06-11', 'items_sold', 4),
        metric('2026-06-11', 'fulfilled_orders', 1),
      ]),
    );
  });

  it('ignores rows that cannot be associated to an order', () => {
    const metrics = deriveMetricsFromOrders({
      platform: 'shopify',
      storeId: 'store-1',
      orders: [
        {
          id: 'order-1',
          ordered_at: '2026-06-10T10:00:00.000Z',
          total: 10,
        },
      ],
      orderItems: [
        { order_id: null, quantity: 100 },
        { order_id: 'missing-order', quantity: 100 },
      ],
      fulfillments: [
        { order_id: null, status: 'fulfilled' },
        { order_id: 'missing-order', status: 'fulfilled' },
      ],
    });

    expect(metrics).toEqual(
      expect.arrayContaining([
        metric('2026-06-10', 'items_sold', 0),
        metric('2026-06-10', 'fulfilled_orders', 0),
      ]),
    );
  });
});

function metric(date: string, metricType: string, value: number) {
  return {
    date,
    metric_type: metricType,
    value,
    platform: 'shopify',
    store_id: 'store-1',
  };
}
