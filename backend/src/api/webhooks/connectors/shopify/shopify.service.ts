import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { StoresRepository } from '../../../../supabase/repositories/stores.repository';
import axios from 'axios';

@Injectable()
export class ShopifyWebhooksService {
  private readonly logger = new Logger(ShopifyWebhooksService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly storesRepo: StoresRepository,
    private readonly httpService: HttpService,
  ) {}

  async setupWebhookForUser(userId: string, storeId: string, topic: string) {
    const store = await this.storesRepo.getCredentials(storeId);
    const creds =
      typeof store.credentials === 'string'
        ? JSON.parse(store.credentials)
        : store.credentials;

    if (!creds.accessToken || !creds.shopDomain) {
      throw new Error('Shopify credentials not found for this user/org');
    }

    const appUrl = this.config.get<string>('APP_URL');
    // Callback URL includes both userId and Store
    const eventUrl = `${appUrl}/api/webhooks/shopify/${storeId}/${userId}`;

    const payload = {
      webhook: {
        topic: topic,
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
          `Shopify Setup Error for Store: ${storeId}`,
          error.response?.data || error.message,
        );
      } else {
        this.logger.error(`Shopify Setup Error for Store: ${storeId}`, error);
      }
      throw error;
    }
  }

  async processEvent(
    userId: string,
    storeId: string,
    topic: string,
    payload: any,
  ) {
    this.logger.log(
      `Processing ${topic} for Store: ${storeId}, User: ${userId}`,
    );

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
