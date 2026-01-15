export interface Order {
  id?: number;
  created_at?: string;
  updated_at?: string;
  api_id?: string;
  hold_until_date?: string;
  total_amount?: number;
  shipping_amount?: number;
  tax_amount?: number;
  discount_amount?: number;
  subtotal_amount?: number;
  status?: string;
  fulfillment_status?: string;
  order_number?: string;
  cancelled?: boolean;
  order_date?: string;
  order_items?: OrderItem[]; // Made optional
  store?: BaseEntity;
  client?: BaseEntity;
  warehouse?: BaseEntity;
}

export interface OrderItem {
  // Changed these to optional to resolve the "Type 'undefined' is not assignable to type 'number'" error
  id?: number;
  sku?: string;
  name?: string;
  quantity?: number;
  quantity_shipped?: number;
  cancelled?: boolean;
}

export interface BaseEntity {
  // Changed these to optional to prevent similar errors with store/client/warehouse
  id?: number;
  name?: string;
}
