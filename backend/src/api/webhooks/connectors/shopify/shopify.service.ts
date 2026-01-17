import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { StoresRepository } from 'src/supabase/repositories/stores.repository';
import axios from 'axios';

@Injectable()
export class ShopifyWebhooksService {
  private readonly logger = new Logger(ShopifyWebhooksService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly storesRepo: StoresRepository,
    private readonly httpService: HttpService,
  ) {}

  async setupWebhookForUser(userId: string, orgId: string, topic: string) {
    const store = await this.storesRepo.getCredentials(
      userId,
      orgId,
      'shopify',
    );
    const creds =
      typeof store.credentials === 'string'
        ? JSON.parse(store.credentials)
        : store.credentials;

    if (!creds.accessToken || !creds.shopDomain) {
      throw new Error('Shopify credentials not found for this user/org');
    }

    const appUrl = this.config.get<string>('APP_URL');
    // Callback URL includes both userId and orgId
    const eventUrl = `${appUrl}/api/webhooks/shopify/${orgId}/${userId}`;

    const payload = {
      webhook: {
        topic: topic, // e.g., 'orders/create'
        address: eventUrl,
        format: 'json',
      },
    };

    try {
      const shopDomain = creds.shopDomain;
      const response = await firstValueFrom(
        this.httpService.post(
          `https://${shopDomain}/admin/api/2026-01/webhooks.json`,
          payload,
          {
            headers: {
              'X-Shopify-Access-Token': creds.accessToken,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `Shopify Setup Error for Org: ${orgId}`,
          error.response?.data || error.message,
        );
      } else {
        this.logger.error(`Shopify Setup Error for Org: ${orgId}`, error);
      }
      throw error;
    }
  }

  async processEvent(
    userId: string,
    orgId: string,
    topic: string,
    payload: any,
  ) {
    this.logger.log(`Processing ${topic} for Org: ${orgId}, User: ${userId}`);

    switch (topic) {
      case 'orders/create':
        // await this.handleOrder(userId, orgId, payload);
        break;
      case 'products/update':
        // await this.handleProduct(userId, orgId, payload);
        break;
    }
  }
}
