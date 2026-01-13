/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
export interface Money {
  currency: string;
  amount: number;
}

export interface Tax {
  taxName: string;
  taxAmount: Money;
}

export interface Charges {
  charge: Charge[];
}

export interface Item {
  productName: string;
  sku: string;
}

export interface Quantity {
  unitOfMeasurement: string;
  amount: string;
}

export interface OrderLineStatus {
  status: string;
  statusQuantity: Quantity;
}

export interface OrderLineStatuses {
  orderLineStatus: OrderLineStatus[];
}

export interface Fulfillment {
  fulfillmentOption: string;
  shipMethod: string;
  pickUpDateTime: number;
}
export interface OrderLine {
  lineNumber: string;
  item: Item;
  charges: Charges;
  orderLineQuantity: Quantity;
  statusDate: number;
  orderLineStatuses: OrderLineStatuses;
  fulfillment: Fulfillment;
}

export interface PostalAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: string;
}

export interface ShippingInfo {
  phone: string;
  estimatedDeliveryDate: number;
  estimatedShipDate: number;
  methodCode: string;
  postalAddress: PostalAddress;
}
export interface Order {
  purchaseOrderId: string;
  customerOrderId: string;
  customerEmailId: string;
  orderType: string;
  originalCustomerOrderID?: string;
  orderDate: number;
  shippingInfo: ShippingInfo;
  orderLines: {
    orderLine: OrderLine[];
  };
}

export interface VariantGroupingAttribute {
  name: string;
  value: string;
}

export interface VariantGroupInfo {
  isPrimary: boolean;
  groupingAttributes: VariantGroupingAttribute[];
}

export interface DestinationItem {
  mart: string;
  wpid: string;
  upc?: string;
  itemId?: string;
  productName: string;
  productType: string;
}

export interface DuplicateItemInfo {
  status: 'IN_REVIEW' | 'RESOLVED' | string;
  lastUpdatedDate: string;
  identifiedDate: string;
  destinationItem: DestinationItem;
}

export interface UnpublishedReasons {
  reason: string[];
}

export interface WalmartItem {
  mart: 'WALMART_US' | string;
  sku: string;
  availability: 'In_stock' | 'Preorder' | string;

  wpid?: string;
  upc?: string;
  gtin?: string;

  productName?: string;
  shelf?: string[];
  productType?: string;

  price?: Money;

  publishedStatus: 'PUBLISHED' | 'UNPUBLISHED';
  unpublishedReasons?: UnpublishedReasons;

  lifecycleStatus: 'ACTIVE' | 'ARCHIVED' | 'RETIRED' | string;

  isDuplicate: boolean;

  variantGroupId?: string;
  variantGroupInfo?: VariantGroupInfo;

  duplicateItemInfo?: DuplicateItemInfo;
}
export interface WalmartItemsResponse {
  ItemResponse: WalmartItem[];
  totalItems: number;
  nextCursor?: string;
}

export interface InventoryQuantity {
  unit: 'EACH' | string;
  amount: number;
}

export interface Inventory {
  sku: string;
  quantity: InventoryQuantity;
  inventoryAvailableDate?: string;
}

export interface CurrencyAmount {
  currencyAmount: number;
  currencyUnit: 'USD' | string;
}

export interface Quantity {
  unitOfMeasure?: string;
  measurementValue: number;
}

export interface CustomerName {
  firstName: string;
  lastName: string;
}

export interface ReturnChannel {
  channelName: string;
}
export interface ItemWeight {
  unitOfMeasure: string;
  measurementValue: number;
}

export interface ReturnItem {
  sku?: string;
  condition: string;
  productName: string;
  itemWeight?: ItemWeight;
}

export interface TaxDetail {
  taxName: string;
  excessTax?: CurrencyAmount;
  taxPerUnit: CurrencyAmount;
}

export interface ChargeReference {
  name: string;
  value: string;
}

export interface Charge {
  chargeCategory: string;
  chargeName: string;
  chargePerUnit: CurrencyAmount;
  isDiscount: boolean;
  isBillable: boolean;
  tax?: TaxDetail[];
  excessCharge?: CurrencyAmount;
  references?: ChargeReference[];
}

export interface TrackingReference {
  name: string;
  value: string;
}

export interface ReturnTrackingDetail {
  sequenceNo: number;
  eventTag: string;
  eventDescription: string;
  eventTime: string;
  references?: TrackingReference[];
}
export interface RefundChannel {
  refundChannelName: string;
  quantity: {
    measurementValue: number;
  };
}
export interface ReturnOrderLine {
  returnOrderLineNumber: number;
  salesOrderLineNumber: number;
  returnReason: string;
  returnDescription?: string;

  purchaseOrderId: string;
  purchaseOrderLineNumber: number;

  sellerOrderId?: string;

  isReturnForException: boolean;
  exceptionItemType?: string;

  item: ReturnItem;
  charges: Charge[];

  unitPrice: CurrencyAmount;
  chargeTotals: {
    name: string;
    value: CurrencyAmount;
  }[];

  quantity: Quantity;

  cancellableQty: number;
  refundedQty: number;
  rechargeableQty: number;

  refundCoveredBy: string;

  returnExpectedFlag: boolean;
  isFastReplacement: boolean;
  isKeepIt: boolean;
  lastItem: boolean;

  status: string;
  statusTime: string;

  currentDeliveryStatus?: string;
  currentRefundStatus?: string;

  currentTrackingStatuses?: {
    status: string;
    statusTime: string;
    currentRefundStatus: string;
    quantity: Quantity;
  }[];

  refundChannels?: RefundChannel[];
  returnTrackingDetail?: ReturnTrackingDetail[];
}
export interface CarrierInfo {
  carrierId: string;
  carrierName: string;
  serviceType: string;
  trackingNo: string;
}

export interface ReturnLabel {
  labelImageURL: string;
  carrierInfoList: CarrierInfo[];
}

export interface ReturnLineGroup {
  groupNo: number;
  returnLines: {
    returnOrderLineNumber: number;
  }[];
  labels?: ReturnLabel[];
  returnExpectedFlag: boolean;
}
export interface ReturnOrder {
  returnOrderId: string;
  customerEmailId: string;

  customerName?: CustomerName;
  customerOrderId: string;

  refundMode: string;
  returnType?: string;

  replacementCustomerOrderId?: string;

  returnOrderDate: string;
  returnByDate?: string;

  totalRefundAmount: CurrencyAmount;

  returnLineGroups: ReturnLineGroup[];
  returnOrderLines: ReturnOrderLine[];

  returnChannel: ReturnChannel;
}

export interface WalmartReturnsResponse {
  meta: {
    totalCount: number;
    limit: number;
    nextCursor?: string;
  };
  returnOrders: ReturnOrder[];
}
