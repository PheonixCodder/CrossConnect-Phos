import { gql } from 'graphql-request';

export const CREATE_WEBHOOK = gql`
  mutation webhookCreate($topic: WebhookSubscriptionTopic!, $uri: String!) {
    webhookSubscriptionCreate(
      topic: $topic
      webhookSubscription: { uri: $uri, format: JSON }
    ) {
      webhookSubscription {
        id
        topic
        endpoint {
          __typename
          ... on WebhookHttpEndpoint {
            callbackUrl
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const LIST_WEBHOOKS = gql`
  query listWebhooks {
    webhookSubscriptions(first: 50) {
      nodes {
        id
        topic
        endpoint {
          __typename
          ... on WebhookHttpEndpoint {
            callbackUrl
          }
        }
      }
    }
  }
`;

export const DELETE_WEBHOOK = gql`
  mutation deleteWebhook($id: ID!) {
    webhookSubscriptionDelete(id: $id) {
      deletedWebhookSubscriptionId
      userErrors {
        field
        message
      }
    }
  }
`;
