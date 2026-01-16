export const FETCH_FULFILLMENTS = `#graphql
  query FetchFulfillments {
    orders(first: 250, query: "fulfillment_status:any") {
      nodes {
        id
        displayFulfillmentStatus
        lineItems(first: 250) {
          nodes {
            id
            product {
              id
            }
          }
        }
        fulfillments {
          id
          status
          trackingInfo {
            company
            number
            url
          }
        }
      }
    }
  }
`;

export const FETCH_INVENTORY_LEVELS = `#graphql
  query FetchInventoryLevels {
    # Fix: Use inventoryItems to fetch a list of items and their levels
    inventoryItems(first: 250) {
      nodes {
        id
        sku
        inventoryLevels(first: 50) {
          nodes {
            id
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
    }
  }
`;

export const FETCH_ORDERS = `#graphql
  query FetchOrders {
    orders(first: 250, query: "status:any") {
      nodes {
        id
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
            id
            sku
            quantity
            product {
              id
            }
          }
        }
        fulfillments {
          id
          status
          trackingInfo {
            company
            number
            url
          }
        }
      }
    }
  }
`;

export const FETCH_PRODUCTS = `#graphql
  query FetchProducts {
    products(first: 250) {
      nodes {
        id
        title
        status
        descriptionPlainSummary
        variants(first: 100) {
          nodes {
            id
            sku
            price
            inventoryItem {
              id
            }
          }
        }
      }
    }
  }
`;

export const FETCH_RETURNS = `#graphql
  query FetchReturns {
    orders(first: 250, query: "return_status:*") {
      edges {
        node {
          id
          currencyCode
          # Logistical Return Data
          returns(first: 10) {
            nodes {
              id
              status
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
    }
  }
`;
