export interface WalmartWebhookBody {
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
