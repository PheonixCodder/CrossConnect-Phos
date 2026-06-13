import { ReturnsRepository } from './returns.repository';

describe('ReturnsRepository', () => {
  it('upserts returns in batches', async () => {
    const upsertMock = jest
      .fn()
      .mockResolvedValueOnce({
        data: [{ id: 'return-db-1' }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ id: 'return-db-301' }],
        error: null,
      });
    const fromMock = jest.fn(() => ({ upsert: upsertMock }));
    const repo = new ReturnsRepository({ from: fromMock } as never);

    const returns = Array.from({ length: 301 }, (_, index) => ({
      external_return_id: `return-${index + 1}`,
    }));

    const result = await repo.insertReturns(returns as never);

    expect(fromMock).toHaveBeenCalledTimes(2);
    expect(upsertMock).toHaveBeenNthCalledWith(
      1,
      expect.arrayContaining([
        expect.objectContaining({ external_return_id: 'return-1' }),
        expect.objectContaining({ external_return_id: 'return-300' }),
      ]),
      { onConflict: 'external_return_id' },
    );
    expect(upsertMock.mock.calls[0][0]).toHaveLength(300);
    expect(upsertMock).toHaveBeenNthCalledWith(
      2,
      [{ external_return_id: 'return-301' }],
      { onConflict: 'external_return_id' },
    );
    expect(result).toEqual({
      data: [{ id: 'return-db-1' }, { id: 'return-db-301' }],
      error: null,
    });
  });

  it('does not query when no returns are provided', async () => {
    const fromMock = jest.fn();
    const repo = new ReturnsRepository({ from: fromMock } as never);

    await expect(repo.insertReturns([])).resolves.toEqual({
      data: [],
      error: null,
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('returns the first batch error without continuing', async () => {
    const error = { message: 'failed' };
    const upsertMock = jest.fn().mockResolvedValueOnce({ data: null, error });
    const fromMock = jest.fn(() => ({ upsert: upsertMock }));
    const repo = new ReturnsRepository({ from: fromMock } as never);

    const returns = Array.from({ length: 301 }, (_, index) => ({
      external_return_id: `return-${index + 1}`,
    }));

    await expect(repo.insertReturns(returns as never)).resolves.toEqual({
      data: null,
      error,
    });
    expect(fromMock).toHaveBeenCalledTimes(1);
    expect(upsertMock).toHaveBeenCalledTimes(1);
  });
});
