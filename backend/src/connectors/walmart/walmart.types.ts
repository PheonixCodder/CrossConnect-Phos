// Get All Orders
export interface GetAllOrdersResponse {
  list: {
    meta: {
      totalCount: number;
      limit: number;
      nextCursor: string;
    };
    elements: {
      order: Order[];
    };
  };
}

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

// get All Items
export interface GetAllItemsResponse {
  ItemResponse: WalmartItem[];
  totalItems: number;
  nextCursor: string;
}

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
}
//getInventory
export interface GetInventoryResponse {
  sku: string;
  quantity: {
    unit: string;
    amount: number;
  };
}
//getReturns
export interface WalmartReturnsResponse {
  meta: {
    totalCount: number;
    limit: number;
    nextCursor: string;
  };
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
