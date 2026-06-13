export interface WalmartWebhookEvent {
  source: {
    eventType:
      | 'INVENTORY_OOS'
      | 'PO_CREATED'
      | 'PO_LINE_AUTOCANCELLED'
      | 'RETURN_CREATED';
    eventTime: string;
    eventId: string;
  };
  payload: any;
}

type WalmartCredentials = {
  WALMART_CLIENT_ID: string;
  WALMART_CLIENT_SECRET: string;
  url?: string;
};

export function isWalmartCredentials(
  value: unknown,
): value is WalmartCredentials {
  if (!value || typeof value !== 'object') return false;

  const v = value as Record<string, unknown>;

  return (
    typeof v.WALMART_CLIENT_ID === 'string' &&
    typeof v.WALMART_CLIENT_SECRET === 'string'
  );
}
