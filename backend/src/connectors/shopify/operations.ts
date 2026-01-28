export const FETCH_FULFILLMENTS = `#graphql
  query FetchFulfillments($after: String) {
  orders(first: 250, after: $after, query: "updated_at:>=$since") {
    nodes {
      id
      updatedAt
      fulfillments {
        id
        status
        updatedAt
        trackingInfo {
          company
          number
          url
        }
        # ADD THIS BLOCK
        fulfillmentLineItems(first: 100) {
          nodes {
            id
            quantity
            lineItem {
              id
            }
          }
        }
      }
    }
      pageInfo {
        hasNextPage
        endCursor
      }
  }
}

`;

export const FETCH_INVENTORY_LEVELS = `#graphql
  query FetchInventoryLevels($after: String) {
    # Fix: Use inventoryItems to fetch a list of items and their levels
    inventoryItems(    first: 250
    after: $after
    query: "updated_at:>=$since"
) {
      nodes {
        id
        sku
        updatedAt
        inventoryLevels(first: 50) {
          nodes {
            id
            updatedAt
            quantities(names: ["available", "on_hand"]) {
              name
              quantity
            }
            location {
              id
              name
            }
          }
        }
      }
        pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const FETCH_ORDERS = `#graphql
  query FetchOrders($after: String) {
    orders(first: 250, after: $after, query: "updated_at:>=$since") {
      nodes {
        id
        updatedAt
        createdAt
        createdAt
        currencyCode
        canMarkAsPaid
        cancelReason
        subtotalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        totalTaxSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        lineItems(first: 250) {
          nodes {
            sku
            quantity
            originalUnitPrice
            discountedUnitPrice
            originalUnitPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            discountedTotalSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            product {
              id
              priceRange {
                maxVariantPrice {
                  amount
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const FETCH_PRODUCTS = `#graphql
  query FetchProducts($after: String) {
    products(first: 250, after: $after) {
      nodes {
        id
        title
        status
        descriptionPlainSummary
        updatedAt
        createdAt
        variants(first: 100) {
          nodes {
            id
            sku
            price
            updatedAt
            inventoryItem {
              id
            }
          }
        }
      }
        pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const FETCH_RETURNS = `#graphql
  query FetchReturns($after: String) {
    orders(first: 250, after: $after, query: "updated_at:>=$since") {
      edges {
        node {
          id
          currencyCode
          updatedAt
          # Logistical Return Data
          returns(first: 10) {
            nodes {
              id
              status
              createdAt
              # Optional: You can add more return-specific fields here if your schema grows
            }
          }
          # Financial data linked to the order to populate refund_amount
          refunds(first: 10) {
              totalRefundedSet {
                shopMoney {
                  amount
                }
            }
          }
        }
      }
        pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
