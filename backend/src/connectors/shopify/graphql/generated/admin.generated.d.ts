/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as AdminTypes from './admin.types.d.ts';

export type WebhookCreateMutationVariables = AdminTypes.Exact<{
  topic: AdminTypes.WebhookSubscriptionTopic;
  uri: AdminTypes.Scalars['String']['input'];
}>;


export type WebhookCreateMutation = { webhookSubscriptionCreate?: AdminTypes.Maybe<{ webhookSubscription?: AdminTypes.Maybe<(
      Pick<AdminTypes.WebhookSubscription, 'id' | 'topic'>
      & { endpoint: { __typename: 'WebhookEventBridgeEndpoint' | 'WebhookPubSubEndpoint' } | (
        { __typename: 'WebhookHttpEndpoint' }
        & Pick<AdminTypes.WebhookHttpEndpoint, 'callbackUrl'>
      ) }
    )>, userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }> };

export type ListWebhooksQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type ListWebhooksQuery = { webhookSubscriptions: { nodes: Array<(
      Pick<AdminTypes.WebhookSubscription, 'id' | 'topic'>
      & { endpoint: { __typename: 'WebhookEventBridgeEndpoint' | 'WebhookPubSubEndpoint' } | (
        { __typename: 'WebhookHttpEndpoint' }
        & Pick<AdminTypes.WebhookHttpEndpoint, 'callbackUrl'>
      ) }
    )> } };

export type DeleteWebhookMutationVariables = AdminTypes.Exact<{
  id: AdminTypes.Scalars['ID']['input'];
}>;


export type DeleteWebhookMutation = { webhookSubscriptionDelete?: AdminTypes.Maybe<(
    Pick<AdminTypes.WebhookSubscriptionDeletePayload, 'deletedWebhookSubscriptionId'>
    & { userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }
  )> };

export type FetchFulfillmentsQueryVariables = AdminTypes.Exact<{
  after?: AdminTypes.InputMaybe<AdminTypes.Scalars['String']['input']>;
  since?: AdminTypes.InputMaybe<AdminTypes.Scalars['String']['input']>;
}>;


export type FetchFulfillmentsQuery = { orders: { nodes: Array<(
      Pick<AdminTypes.Order, 'id' | 'updatedAt'>
      & { fulfillments: Array<(
        Pick<AdminTypes.Fulfillment, 'id' | 'status' | 'updatedAt'>
        & { trackingInfo: Array<Pick<AdminTypes.FulfillmentTrackingInfo, 'company' | 'number' | 'url'>>, fulfillmentLineItems: { nodes: Array<(
            Pick<AdminTypes.FulfillmentLineItem, 'id' | 'quantity'>
            & { lineItem: (
              Pick<AdminTypes.LineItem, 'id' | 'sku'>
              & { product?: AdminTypes.Maybe<Pick<AdminTypes.Product, 'id'>> }
            ) }
          )> } }
      )> }
    )>, pageInfo: Pick<AdminTypes.PageInfo, 'hasNextPage' | 'endCursor'> } };

export type FetchInventoryLevelsQueryVariables = AdminTypes.Exact<{
  after?: AdminTypes.InputMaybe<AdminTypes.Scalars['String']['input']>;
  since?: AdminTypes.InputMaybe<AdminTypes.Scalars['String']['input']>;
}>;


export type FetchInventoryLevelsQuery = { inventoryItems: { nodes: Array<(
      Pick<AdminTypes.InventoryItem, 'id' | 'sku' | 'updatedAt'>
      & { variant: { product: Pick<AdminTypes.Product, 'id'> }, inventoryLevels: { nodes: Array<(
          Pick<AdminTypes.InventoryLevel, 'id' | 'updatedAt'>
          & { quantities: Array<Pick<AdminTypes.InventoryQuantity, 'name' | 'quantity'>>, location: Pick<AdminTypes.Location, 'id' | 'name'> }
        )> } }
    )>, pageInfo: Pick<AdminTypes.PageInfo, 'hasNextPage' | 'endCursor'> } };

export type FetchOrdersQueryVariables = AdminTypes.Exact<{
  after?: AdminTypes.InputMaybe<AdminTypes.Scalars['String']['input']>;
  since?: AdminTypes.InputMaybe<AdminTypes.Scalars['String']['input']>;
}>;


export type FetchOrdersQuery = { orders: { nodes: Array<(
      Pick<AdminTypes.Order, 'id' | 'updatedAt' | 'createdAt' | 'currencyCode' | 'canMarkAsPaid' | 'cancelReason'>
      & { subtotalPriceSet?: AdminTypes.Maybe<{ shopMoney: Pick<AdminTypes.MoneyV2, 'amount' | 'currencyCode'> }>, totalTaxSet?: AdminTypes.Maybe<{ shopMoney: Pick<AdminTypes.MoneyV2, 'amount' | 'currencyCode'> }>, totalPriceSet: { shopMoney: Pick<AdminTypes.MoneyV2, 'amount' | 'currencyCode'> }, lineItems: { nodes: Array<(
          Pick<AdminTypes.LineItem, 'id' | 'sku' | 'quantity' | 'originalUnitPrice' | 'discountedUnitPrice'>
          & { originalUnitPriceSet: { shopMoney: Pick<AdminTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountedTotalSet: { shopMoney: Pick<AdminTypes.MoneyV2, 'amount' | 'currencyCode'> }, product?: AdminTypes.Maybe<(
            Pick<AdminTypes.Product, 'id'>
            & { priceRange: { maxVariantPrice: Pick<AdminTypes.MoneyV2, 'amount'> } }
          )> }
        )> } }
    )> } };

export type FetchProductsQueryVariables = AdminTypes.Exact<{
  after?: AdminTypes.InputMaybe<AdminTypes.Scalars['String']['input']>;
}>;


export type FetchProductsQuery = { products: { nodes: Array<(
      Pick<AdminTypes.Product, 'id' | 'title' | 'status' | 'descriptionPlainSummary' | 'updatedAt' | 'createdAt'>
      & { variants: { nodes: Array<(
          Pick<AdminTypes.ProductVariant, 'id' | 'sku' | 'price' | 'updatedAt'>
          & { inventoryItem: Pick<AdminTypes.InventoryItem, 'id'> }
        )> } }
    )>, pageInfo: Pick<AdminTypes.PageInfo, 'hasNextPage' | 'endCursor'> } };

export type FetchReturnsQueryVariables = AdminTypes.Exact<{
  after?: AdminTypes.InputMaybe<AdminTypes.Scalars['String']['input']>;
  since?: AdminTypes.InputMaybe<AdminTypes.Scalars['String']['input']>;
}>;


export type FetchReturnsQuery = { orders: { edges: Array<{ node: (
        Pick<AdminTypes.Order, 'id' | 'currencyCode' | 'updatedAt'>
        & { returns: { nodes: Array<Pick<AdminTypes.Return, 'id' | 'status' | 'createdAt'>> }, refunds: Array<{ totalRefundedSet: { shopMoney: Pick<AdminTypes.MoneyV2, 'amount'> } }> }
      ) }>, pageInfo: Pick<AdminTypes.PageInfo, 'hasNextPage' | 'endCursor'> } };

export type ShopifyDailySalesMetricsQueryVariables = AdminTypes.Exact<{
  shopifyql: AdminTypes.Scalars['String']['input'];
}>;


export type ShopifyDailySalesMetricsQuery = { shopifyqlQuery?: AdminTypes.Maybe<(
    Pick<AdminTypes.ShopifyqlQueryResponse, 'parseErrors'>
    & { tableData?: AdminTypes.Maybe<(
      Pick<AdminTypes.ShopifyqlTableData, 'rows'>
      & { columns: Array<Pick<AdminTypes.ShopifyqlTableDataColumn, 'name' | 'dataType' | 'displayName'>> }
    )> }
  )> };

interface GeneratedQueryTypes {
  "\n  query listWebhooks {\n    webhookSubscriptions(first: 50) {\n      nodes {\n        id\n        topic\n        endpoint {\n          __typename\n          ... on WebhookHttpEndpoint {\n            callbackUrl\n          }\n        }\n      }\n    }\n  }\n": {return: ListWebhooksQuery, variables: ListWebhooksQueryVariables},
  "#graphql\n  query FetchFulfillments($after: String, $since: String) {\n  orders(first: 250, after: $after, query: $since) {\n    nodes {\n      id\n      updatedAt\n      fulfillments {\n        id\n        status\n        updatedAt\n        trackingInfo {\n          company\n          number\n          url\n        }\n        # ADD THIS BLOCK\n        fulfillmentLineItems(first: 100) {\n          nodes {\n            id\n            quantity\n            lineItem {\n              id\n              sku\n              product { id }\n            }\n          }\n        }\n      }\n    }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n  }\n}\n": {return: FetchFulfillmentsQuery, variables: FetchFulfillmentsQueryVariables},
  "#graphql\n  query FetchInventoryLevels($after: String, $since: String) {\n    # Fix: Use inventoryItems to fetch a list of items and their levels\n    inventoryItems(    first: 250\n    after: $after\n    query: $since\n) {\n      nodes {\n        id\n        sku\n        updatedAt\n        variant {\n          product {\n            id\n          }\n        }\n        inventoryLevels(first: 50) {\n          nodes {\n            id\n            updatedAt\n            quantities(names: [\"available\", \"on_hand\"]) {\n              name\n              quantity\n            }\n            location {\n              id\n              name\n            }\n          }\n        }\n      }\n        pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": {return: FetchInventoryLevelsQuery, variables: FetchInventoryLevelsQueryVariables},
  "#graphql\n  query FetchOrders($after: String, $since: String) {\n    orders(first: 250, after: $after, query: $since) {\n      nodes {\n        id\n        updatedAt\n        createdAt\n        createdAt\n        currencyCode\n        canMarkAsPaid\n        cancelReason\n        subtotalPriceSet {\n          shopMoney {\n            amount\n            currencyCode\n          }\n        }\n        totalTaxSet {\n          shopMoney {\n            amount\n            currencyCode\n          }\n        }\n        totalPriceSet {\n          shopMoney {\n            amount\n            currencyCode\n          }\n        }\n        lineItems(first: 250) {\n          nodes {\n            id\n            sku\n            quantity\n            originalUnitPrice\n            discountedUnitPrice\n            originalUnitPriceSet {\n              shopMoney {\n                amount\n                currencyCode\n              }\n            }\n            discountedTotalSet {\n              shopMoney {\n                amount\n                currencyCode\n              }\n            }\n            product {\n              id\n              priceRange {\n                maxVariantPrice {\n                  amount\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n": {return: FetchOrdersQuery, variables: FetchOrdersQueryVariables},
  "#graphql\n  query FetchProducts($after: String) {\n    products(first: 250, after: $after) {\n      nodes {\n        id\n        title\n        status\n        descriptionPlainSummary\n        updatedAt\n        createdAt\n        variants(first: 100) {\n          nodes {\n            id\n            sku\n            price\n            updatedAt\n            inventoryItem {\n              id\n            }\n          }\n        }\n      }\n        pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": {return: FetchProductsQuery, variables: FetchProductsQueryVariables},
  "#graphql\n  query FetchReturns($after: String, $since: String) {\n    orders(first: 250, after: $after, query: $since) {\n      edges {\n        node {\n          id\n          currencyCode\n          updatedAt\n          # Logistical Return Data\n          returns(first: 10) {\n            nodes {\n              id\n              status\n              createdAt\n              # Optional: You can add more return-specific fields here if your schema grows\n            }\n          }\n          # Financial data linked to the order to populate refund_amount\n          refunds(first: 10) {\n              totalRefundedSet {\n                shopMoney {\n                  amount\n                }\n            }\n          }\n        }\n      }\n        pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": {return: FetchReturnsQuery, variables: FetchReturnsQueryVariables},
  "#graphql\n  query ShopifyDailySalesMetrics($shopifyql: String!) {\n    shopifyqlQuery(query: $shopifyql) {\n      tableData {\n        columns {\n          name\n          dataType\n          displayName\n        }\n        rows\n      }\n      parseErrors\n    }\n  }\n": {return: ShopifyDailySalesMetricsQuery, variables: ShopifyDailySalesMetricsQueryVariables},
}

interface GeneratedMutationTypes {
  "\n  mutation webhookCreate($topic: WebhookSubscriptionTopic!, $uri: String!) {\n    webhookSubscriptionCreate(\n      topic: $topic\n      webhookSubscription: { uri: $uri, format: JSON }\n    ) {\n      webhookSubscription {\n        id\n        topic\n        endpoint {\n          __typename\n          ... on WebhookHttpEndpoint {\n            callbackUrl\n          }\n        }\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: WebhookCreateMutation, variables: WebhookCreateMutationVariables},
  "\n  mutation deleteWebhook($id: ID!) {\n    webhookSubscriptionDelete(id: $id) {\n      deletedWebhookSubscriptionId\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: DeleteWebhookMutation, variables: DeleteWebhookMutationVariables},
}
declare module '@shopify/admin-api-client' {
  type InputMaybe<T> = AdminTypes.InputMaybe<T>;
  interface AdminQueries extends GeneratedQueryTypes {}
  interface AdminMutations extends GeneratedMutationTypes {}
}
