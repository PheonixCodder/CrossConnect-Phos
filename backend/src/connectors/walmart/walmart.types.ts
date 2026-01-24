// Base response interfaces
export interface BaseResponse {
  meta?: {
    totalCount: number;
    limit: number;
    nextCursor?: string;
  };
}

// Get All Items Response
export interface GetAllItemsResponse {
  ItemResponse: WalmartItem[];
  totalItems: number;
  nextCursor?: string;
}

// The SDK returns arrays directly when autoPagination=true
export type WalmartItemsResponse = WalmartItem[] | GetAllItemsResponse;

export interface WalmartItem {
  mart: string;
  sku: string;
  wpid: string;
  gtin: string;
  productName: string;
  shelf: string[];
  productType: string;
  price: {
    currency: string;
    amount: number;
  };
  publishedStatus: string;
  lifecycleStatus: string;
  variantGroupId: string;
  variantGroupInfo: {
    isPrimary: boolean;
    groupingAttributes: {
      name: string;
      value: string;
    }[];
  };
  // Additional fields from console output
  condition?: string;
  availability?: string;
  upc?: string;
  unpublishedReasons?: {
    reason: any[];
  };
  isDuplicate?: boolean;
}

// Get All Orders Response
export interface GetAllOrdersResponse extends BaseResponse {
  list: {
    meta: {
      totalCount: number;
      limit: number;
      nextCursor?: string;
    };
    elements: {
      order: Order[];
    };
  };
}

export type WalmartOrdersResponse = Order[] | GetAllOrdersResponse;

export interface Order {
  purchaseOrderId: string;
  customerOrderId: string;
  customerEmailId: string;
  customerRfc: string;
  orderDate: number;
  orderSummary: OrderSummary;
  shippingInfo: ShippingInfo;
  orderLines: {
    orderLine: OrderLine[];
  };
}

export interface OrderSummary {
  totalAmount: Money;
  orderSubTotals: {
    subTotalType: string;
    totalAmount: Money;
  }[];
}

export interface Money {
  amount: number;
  currency: string;
}

export interface ShippingInfo {
  phone: string;
  estimatedDeliveryDate: number;
  estimatedShipDate: number;
  methodCode: string;
  postalAddress: PostalAddress;
}

export interface PostalAddress {
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderLine {
  lineNumber: string;
  item: {
    productName: string;
    sku: string;
  };
  charges: {
    charge: {
      chargeType: string;
      chargeName: string;
      chargeAmount: Money;
      tax: {
        taxAmount: Money;
      };
    }[];
  };
  orderLineQuantity: {
    unitOfMeasurement: string;
    amount: number;
  };
  orderLineStatuses: {
    orderLineStatus: {
      status: string;
      statusQuantity: {
        unitOfMeasurement: string;
        amount: number;
      };
      trackingInfo: {
        carrierName: {
          otherCarrier: string;
        };
        methodCode: string;
        shipmentNo: string;
      };
      cancellationReason: string;
    }[];
  };
  fulfillment: {
    fulfillmentOption: string;
    shipMethod: string;
    storeId: string;
    offerId: string;
    predictedShipNodeId: string;
    predictedShipNodeName: string;
  };
  statusDate: number;
}

// Inventory
export interface GetInventoryResponse {
  sku: string;
  quantity: {
    unit: string;
    amount: number;
  };
}

// Returns
export interface WalmartReturnsResponse extends BaseResponse {
  returnOrders: ReturnOrder[];
}

export interface ReturnOrder {
  returnOrderId: string;
  customerEmailId: string;
  customerName: {
    firstName: string;
    lastName: string;
  };
  customerOrderId: string;
  returnByDate: string;
  refundMode: string;
  totalRefundAmount: {
    currencyAmount: number;
    currencyUnit: string;
  };
  returnLineGroups: ReturnLineGroup[];
  returnOrderLines: ReturnOrderLine[];
  returnOrderShipments: {
    shipmentNo: string;
    trackingNumber: string;
  }[];
  returnChannel: {
    channelName: string;
  };
}

export interface ReturnLineGroup {
  groupNo: number;
  returnLines: {
    returnOrderLineNumber: number;
  }[];
  labels: {
    labelImageURL: string;
    carrierInfoList: {
      carrierId: string;
      carrierName: string;
      serviceType: string;
      trackingNo: string;
    }[];
  }[];
  returnExpectedFlag: boolean;
}

export interface ReturnOrderLine {
  returnOrderLineNumber: number;
  primeLineNumber: string;
  salesOrderLineNumber: number;
  returnReason: string;
  returnDescription: string;
  purchaseOrderId: string;
  purchaseOrderLineNumber: number;
  isReturnForException: boolean;
  item: {
    condition: string;
    productName: string;
    itemWeight: {
      unitOfMeasure: string;
      measurementValue: number;
    };
  };
  charges: {
    chargeCategory: string;
    chargeName: string;
    chargePerUnit: {
      currencyAmount: number;
      currencyUnit: string;
    };
    isDiscount: boolean;
    isBillable: boolean;
    tax: {
      taxName: string;
      excessTax: {
        currencyAmount: number;
        currencyUnit: string;
      };
      taxPerUnit: {
        currencyAmount: number;
        currencyUnit: string;
      };
    }[];
    references: {
      name: string;
      value: string;
    }[];
  }[];
}

// SDK Response Types
export interface SdkResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Helper type guards
export function isGetAllItemsResponse(
  response: any,
): response is GetAllItemsResponse {
  return response && Array.isArray(response.ItemResponse);
}

export function isGetAllOrdersResponse(
  response: any,
): response is GetAllOrdersResponse {
  return (
    response && response.list && Array.isArray(response.list.elements?.order)
  );
}

export function isWalmartItemArray(response: any): response is WalmartItem[] {
  return Array.isArray(response) && response.length > 0 && 'sku' in response[0];
}
