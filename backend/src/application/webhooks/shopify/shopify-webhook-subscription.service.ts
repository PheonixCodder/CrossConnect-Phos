import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CREATE_WEBHOOK, LIST_WEBHOOKS } from './graphql/shopify-webhooks';
import { ShopifyService } from '../../../infrastructure/external/connectors/shopify/shopify.service';
import {
  ListWebhooksQuery,
  WebhookCreateMutation,
} from '../../../infrastructure/external/connectors/shopify/graphql/generated/admin.generated';
import { WebhookSubscriptionTopic } from '../../../infrastructure/external/connectors/shopify/graphql/generated/admin.types';

@Injectable()
export class ShopifyWebhookService {
  private readonly logger = new Logger(ShopifyWebhookService.name);

  constructor(
    private readonly shopify: ShopifyService,
    private readonly config: ConfigService,
  ) {}

  async reconcileWebhooks(
    credentials: any,
    storeId: string,
    userId: string,
    topics: string[],
  ) {
    this.shopify.initialize(credentials);

    const baseUrl = `${this.config.get('APP_URL')}/api/webhooks/shopify/${storeId}/${userId}`;

    const existing =
      await this.shopify.execute<ListWebhooksQuery>(LIST_WEBHOOKS);
    const existingTopics = new Set(
      existing.webhookSubscriptions.nodes.map((w) => w.topic),
    );

    for (const topic of topics) {
      if (existingTopics.has(topic as WebhookSubscriptionTopic)) continue;

      const res = await this.shopify.execute<WebhookCreateMutation>(
        CREATE_WEBHOOK,
        {
          topic,
          callbackUrl: baseUrl,
        },
      );

      if (res.webhookSubscriptionCreate?.userErrors.length) {
        throw new Error(
          JSON.stringify(res.webhookSubscriptionCreate.userErrors),
        );
      }

      this.logger.log(`Created webhook: ${topic}`);
    }
  }
}
