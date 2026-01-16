/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as AdminTypes from './admin.types.d.ts';

export type FetchFulfillmentsQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type FetchFulfillmentsQuery = { orders: { nodes: Array<(
      Pick<AdminTypes.Order, 'id' | 'displayFulfillmentStatus'>
      & { lineItems: { nodes: Array<(
          Pick<AdminTypes.LineItem, 'id'>
          & { product?: AdminTypes.Maybe<Pick<AdminTypes.Product, 'id'>> }
        )> }, fulfillments: Array<(
        Pick<AdminTypes.Fulfillment, 'id' | 'status'>
        & { trackingInfo: Array<Pick<AdminTypes.FulfillmentTrackingInfo, 'company' | 'number' | 'url'>> }
      )> }
    )> } };

export type FetchInventoryLevelsQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type FetchInventoryLevelsQuery = { inventoryItems: { nodes: Array<(
      Pick<AdminTypes.InventoryItem, 'id' | 'sku'>
      & { inventoryLevels: { nodes: Array<(
          Pick<AdminTypes.InventoryLevel, 'id'>
          & { quantities: Array<Pick<AdminTypes.InventoryQuantity, 'name' | 'quantity'>>, location: Pick<AdminTypes.Location, 'id' | 'name'> }
        )> } }
    )> } };

export type FetchOrdersQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type FetchOrdersQuery = { orders: { nodes: Array<(
      Pick<AdminTypes.Order, 'id' | 'createdAt' | 'currencyCode' | 'canMarkAsPaid' | 'cancelReason'>
      & { subtotalPriceSet?: AdminTypes.Maybe<{ shopMoney: Pick<AdminTypes.MoneyV2, 'amount' | 'currencyCode'> }>, totalTaxSet?: AdminTypes.Maybe<{ shopMoney: Pick<AdminTypes.MoneyV2, 'amount' | 'currencyCode'> }>, totalPriceSet: { shopMoney: Pick<AdminTypes.MoneyV2, 'amount' | 'currencyCode'> }, lineItems: { nodes: Array<(
          Pick<AdminTypes.LineItem, 'id' | 'sku' | 'quantity'>
          & { product?: AdminTypes.Maybe<Pick<AdminTypes.Product, 'id'>> }
        )> }, fulfillments: Array<(
        Pick<AdminTypes.Fulfillment, 'id' | 'status'>
        & { trackingInfo: Array<Pick<AdminTypes.FulfillmentTrackingInfo, 'company' | 'number' | 'url'>> }
      )> }
    )> } };

export type FetchProductsQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type FetchProductsQuery = { products: { nodes: Array<(
      Pick<AdminTypes.Product, 'id' | 'title' | 'status' | 'descriptionPlainSummary'>
      & { variants: { nodes: Array<(
          Pick<AdminTypes.ProductVariant, 'id' | 'sku' | 'price'>
          & { inventoryItem: Pick<AdminTypes.InventoryItem, 'id'> }
        )> } }
    )> } };

export type FetchReturnsQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type FetchReturnsQuery = { orders: { edges: Array<{ node: (
        Pick<AdminTypes.Order, 'id' | 'currencyCode'>
        & { returns: { nodes: Array<Pick<AdminTypes.Return, 'id' | 'status'>> }, refunds: Array<{ totalRefundedSet: { shopMoney: Pick<AdminTypes.MoneyV2, 'amount'> } }> }
      ) }> } };

interface GeneratedQueryTypes {
  "#graphql\n  query FetchFulfillments {\n    orders(first: 250, query: \"fulfillment_status:any\") {\n      nodes {\n        id\n        displayFulfillmentStatus\n        lineItems(first: 250) {\n          nodes {\n            id\n            product {\n              id\n            }\n          }\n        }\n        fulfillments {\n          id\n          status\n          trackingInfo {\n            company\n            number\n            url\n          }\n        }\n      }\n    }\n  }\n": {return: FetchFulfillmentsQuery, variables: FetchFulfillmentsQueryVariables},
  "#graphql\n  query FetchInventoryLevels {\n    # Fix: Use inventoryItems to fetch a list of items and their levels\n    inventoryItems(first: 250) {\n      nodes {\n        id\n        sku\n        inventoryLevels(first: 50) {\n          nodes {\n            id\n            quantities(names: [\"available\", \"on_hand\"]) {\n              name\n              quantity\n            }\n            location {\n              id\n              name\n            }\n          }\n        }\n      }\n    }\n  }\n": {return: FetchInventoryLevelsQuery, variables: FetchInventoryLevelsQueryVariables},
  "#graphql\n  query FetchOrders {\n    orders(first: 250, query: \"status:any\") {\n      nodes {\n        id\n        createdAt\n        currencyCode\n        canMarkAsPaid\n        cancelReason\n        subtotalPriceSet { \n          shopMoney { \n            amount \n            currencyCode \n          } \n        }\n        totalTaxSet { \n          shopMoney { \n            amount \n            currencyCode \n          } \n        }\n        totalPriceSet { \n          shopMoney { \n            amount \n            currencyCode \n          } \n        }\n        lineItems(first: 250) {\n          nodes {\n            id\n            sku\n            quantity\n            product {\n              id\n            }\n          }\n        }\n        fulfillments {\n          id\n          status\n          trackingInfo {\n            company\n            number\n            url\n          }\n        }\n      }\n    }\n  }\n": {return: FetchOrdersQuery, variables: FetchOrdersQueryVariables},
  "#graphql\n  query FetchProducts {\n    products(first: 250) {\n      nodes {\n        id\n        title\n        status\n        descriptionPlainSummary\n        variants(first: 100) {\n          nodes {\n            id\n            sku\n            price\n            inventoryItem {\n              id\n            }\n          }\n        }\n      }\n    }\n  }\n": {return: FetchProductsQuery, variables: FetchProductsQueryVariables},
  "#graphql\n  query FetchReturns {\n    orders(first: 250, query: \"return_status:*\") {\n      edges {\n        node {\n          id\n          currencyCode\n          # Logistical Return Data\n          returns(first: 10) {\n            nodes {\n              id\n              status\n              # Optional: You can add more return-specific fields here if your schema grows\n            }\n          }\n          # Financial data linked to the order to populate refund_amount\n          refunds(first: 10) {\n              totalRefundedSet {\n                shopMoney {\n                  amount\n                }\n            }\n          }\n        }\n      }\n    }\n  }\n": {return: FetchReturnsQuery, variables: FetchReturnsQueryVariables},
}

interface GeneratedMutationTypes {
}
declare module '@shopify/admin-api-client' {
  type InputMaybe<T> = AdminTypes.InputMaybe<T>;
  interface AdminQueries extends GeneratedQueryTypes {}
  interface AdminMutations extends GeneratedMutationTypes {}
}
