import { SyncOutcomeService } from './sync-outcome.service';
import { StoreRow } from '../sync.types';

const store = {
  id: 'store-1',
  platform: 'shopify',
} as StoreRow;

describe('SyncOutcomeService', () => {
  it('marks success with the domain cursor', async () => {
    const storesRepository = {
      updateStoreHealth: jest.fn(),
      updateSyncTimestamps: jest.fn(),
    };
    const alertsRepository = { createAlert: jest.fn() };
    const service = new SyncOutcomeService(
      storesRepository as any,
      alertsRepository as any,
    );

    await service.markSuccess(store, 'orders');

    expect(storesRepository.updateStoreHealth).toHaveBeenCalledWith(
      'store-1',
      'healthy',
    );
    expect(storesRepository.updateSyncTimestamps).toHaveBeenCalledWith(
      'store-1',
      'orders',
      expect.any(String),
    );
  });

  it('marks failure with store health and domain alert', async () => {
    const storesRepository = { updateStoreHealth: jest.fn() };
    const alertsRepository = { createAlert: jest.fn() };
    const service = new SyncOutcomeService(
      storesRepository as any,
      alertsRepository as any,
    );

    await service.markFailure(store, 'products', 'shopify', 'boom');

    expect(storesRepository.updateStoreHealth).toHaveBeenCalledWith(
      'store-1',
      'unhealthy',
      'Products sync failed: boom',
    );
    expect(alertsRepository.createAlert).toHaveBeenCalledWith({
      store_id: 'store-1',
      alert_type: 'products_sync_failure',
      message: 'SHOPIFY products sync failed: boom',
      severity: 'high',
      platform: 'shopify',
    });
  });
});
