import { OrdersRepository } from './orders.repository';

describe('OrdersRepository', () => {
  it('deduplicates and batches external order lookups', async () => {
    const inMock = jest
      .fn()
      .mockResolvedValueOnce({
        data: [{ id: 'order-db-1', external_order_id: 'order-1' }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ id: 'order-db-501', external_order_id: 'order-501' }],
        error: null,
      });
    const eqMock = jest.fn(() => ({ in: inMock }));
    const selectMock = jest.fn(() => ({ eq: eqMock }));
    const fromMock = jest.fn(() => ({ select: selectMock }));

    const repo = new OrdersRepository({ from: fromMock } as never);
    const ids = [
      ...Array.from({ length: 501 }, (_, index) => `order-${index + 1}`),
      'order-1',
      '',
    ];

    const result = await repo.getByExternalOrderIds('store-1', ids);

    expect(fromMock).toHaveBeenCalledTimes(2);
    expect(inMock).toHaveBeenNthCalledWith(
      1,
      'external_order_id',
      expect.arrayContaining(['order-1', 'order-500']),
    );
    expect(inMock.mock.calls[0][1]).toHaveLength(500);
    expect(inMock).toHaveBeenNthCalledWith(2, 'external_order_id', [
      'order-501',
    ]);
    expect(result).toEqual([
      { id: 'order-db-1', external_order_id: 'order-1' },
      { id: 'order-db-501', external_order_id: 'order-501' },
    ]);
  });

  it('does not query when no usable external IDs are provided', async () => {
    const fromMock = jest.fn();
    const repo = new OrdersRepository({ from: fromMock } as never);

    await expect(
      repo.getByExternalOrderIds('store-1', ['', '']),
    ).resolves.toEqual([]);
    expect(fromMock).not.toHaveBeenCalled();
  });
});
