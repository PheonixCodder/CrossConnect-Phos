import { ProductsRepository } from './products.repository';

describe('ProductsRepository', () => {
  it('deduplicates SKU lookup input and delegates batching to getIdsBySkus', async () => {
    const repo = new ProductsRepository({} as never);
    jest.spyOn(repo, 'getIdsBySkus').mockResolvedValue([
      { id: 'product-db-1', sku: 'SKU-1' },
      { id: 'product-db-2', sku: 'SKU-2' },
    ]);

    const result = await repo.getProductIdsBySkusInBatches(
      'store-1',
      ['SKU-1', 'SKU-2', 'SKU-1', ''],
      'shopify',
    );

    expect(repo.getIdsBySkus).toHaveBeenCalledWith(
      'store-1',
      ['SKU-1', 'SKU-2'],
      'shopify',
    );
    expect(result).toEqual(
      new Map([
        ['SKU-1', 'product-db-1'],
        ['SKU-2', 'product-db-2'],
      ]),
    );
  });

  it('resolves product IDs by SKU, external product ID, and ASIN identifiers', async () => {
    const inMock = jest
      .fn()
      .mockResolvedValueOnce({
        data: [
          {
            id: 'product-db-sku',
            sku: 'SKU-1',
            external_product_id: 'EXT-1',
            asin: null,
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'product-db-ext',
            sku: 'SKU-2',
            external_product_id: 'EXT-2',
            asin: null,
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'product-db-asin',
            sku: 'SKU-3',
            external_product_id: 'EXT-3',
            asin: 'ASIN-3',
          },
        ],
        error: null,
      });
    const platformEqMock = jest.fn(() => ({ in: inMock }));
    const storeEqMock = jest.fn(() => ({ eq: platformEqMock }));
    const selectMock = jest.fn(() => ({ eq: storeEqMock }));
    const fromMock = jest.fn(() => ({ select: selectMock }));
    const repo = new ProductsRepository({ from: fromMock } as never);

    const result = await repo.getProductIdsByIdentifiers('store-1', 'amazon', {
      skus: ['SKU-1', 'SKU-1', ''],
      externalProductIds: ['EXT-2'],
      asins: ['ASIN-3'],
    });

    expect(inMock).toHaveBeenNthCalledWith(1, 'sku', ['SKU-1']);
    expect(inMock).toHaveBeenNthCalledWith(2, 'external_product_id', ['EXT-2']);
    expect(inMock).toHaveBeenNthCalledWith(3, 'asin', ['ASIN-3']);
    expect(result).toEqual(
      new Map([
        ['product-db-sku', 'product-db-sku'],
        ['SKU-1', 'product-db-sku'],
        ['EXT-1', 'product-db-sku'],
        ['product-db-ext', 'product-db-ext'],
        ['SKU-2', 'product-db-ext'],
        ['EXT-2', 'product-db-ext'],
        ['product-db-asin', 'product-db-asin'],
        ['SKU-3', 'product-db-asin'],
        ['EXT-3', 'product-db-asin'],
        ['ASIN-3', 'product-db-asin'],
      ]),
    );
  });
});
