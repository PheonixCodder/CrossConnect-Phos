export function getTikTokEventTopic(type: unknown): string {
  switch (type) {
    case 1:
      return 'order_status_updated';
    case 27:
      return 'inventory_status_updated';
    case 12:
      return 'return_status_updated';
    case 6:
      return 'store_deauthorized';
    default:
      return `unknown_${String(type)}`;
  }
}

export function getTikTokEventId(body: Record<string, unknown>): string {
  const data = body.data as Record<string, unknown> | undefined;

  return (
    (body.tts_notification_id as string) ||
    (data?.order_id as string) ||
    (data?.return_id as string) ||
    (data?.sku_id as string) ||
    `${String(body.type ?? 'unknown')}:${String(body.shop_id ?? 'unknown')}:${String(body.timestamp ?? 'unknown')}`
  );
}

export function toTikTokReceivedAt(timestamp: unknown): string | undefined {
  if (typeof timestamp !== 'number') {
    return undefined;
  }

  return new Date(timestamp * 1000).toISOString();
}
