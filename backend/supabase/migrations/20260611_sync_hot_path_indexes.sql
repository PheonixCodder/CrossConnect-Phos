-- Supporting indexes for sync/webhook hot paths.
-- These are intentionally non-unique indexes; existing upsert conflict
-- constraints are not changed by this migration.

create index if not exists idx_stores_auth_status_active
  on public.stores (auth_status)
  where auth_status = 'active';

create index if not exists idx_stores_platform_auth_status
  on public.stores (platform, auth_status);

create index if not exists idx_stores_shop_domain
  on public.stores ("shopDomain")
  where "shopDomain" is not null;

create index if not exists idx_store_credentials_store_id
  on public.store_credentials (store_id);

create index if not exists idx_orders_store_external_order_id
  on public.orders (store_id, external_order_id);

create index if not exists idx_products_store_platform_sku
  on public.products (store_id, platform, sku);

create index if not exists idx_products_store_platform_external_product_id
  on public.products (store_id, platform, external_product_id);

create index if not exists idx_inventory_store_sku
  on public.inventory (store_id, sku);

create index if not exists idx_returns_store_external_return_id
  on public.returns (store_id, external_return_id);

create index if not exists idx_returns_order_id
  on public.returns (order_id);

create index if not exists idx_order_items_order_external_line_item_id
  on public.order_items (order_id, external_line_item_id);

create index if not exists idx_order_items_product_id
  on public.order_items (product_id)
  where product_id is not null;

create index if not exists idx_fulfillments_store_platform_external_ids
  on public.fulfillments (
    store_id,
    platform,
    external_fulfillment_id,
    external_fulfillment_line_item_id
  );

create index if not exists idx_fulfillments_order_id
  on public.fulfillments (order_id);

create index if not exists idx_metrics_summary_store_date_metric_type
  on public.metrics_summary (store_id, date, metric_type);

create index if not exists idx_raw_events_external_event_id
  on public.raw_events (external_event_id);

create index if not exists idx_raw_events_store_platform_received_at
  on public.raw_events (store_id, platform, received_at desc);
