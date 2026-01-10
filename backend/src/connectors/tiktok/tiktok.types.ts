export type OrderData = {
  order_id: string;
  order_status:
    | 'UNPAID'
    | 'COMPLETED'
    | 'CANCEL'
    | 'IN_TRANSIT'
    | 'DELIVERED'
    | 'ON_HOLD'
    | 'AWAITING_SHIPMENT'
    | 'AWAITING_COLLECTION';
  is_on_hold_order: boolean;
  update_time: number;
};
