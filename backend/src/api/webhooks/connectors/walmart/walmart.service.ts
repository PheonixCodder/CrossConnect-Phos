import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import crypto from 'crypto';

@Injectable()
export class WalmartWebhookService {
  private readonly logger = new Logger(WalmartWebhookService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async createWebhook(token: string, storeId: string, userId: string) {
    const callbackUrl = `${this.config.get(
      'APP_URL',
    )}/api/webhooks/walmart/${storeId}/${userId}`;

    const subscriptionPayload = {
      events: [
        {
          eventType: 'INVENTORY_OOS',
          eventVersion: 'V1',
          resourceName: 'INVENTORY',
          eventUrl: callbackUrl,
          status: 'ACTIVE',
          headers: { 'content-type': 'application/json' },
        },
        {
          eventType: 'PO_CREATED',
          eventVersion: 'V1',
          resourceName: 'ORDER',
          eventUrl: callbackUrl,
          status: 'ACTIVE',
          headers: { 'content-type': 'application/json' },
        },
        {
          eventType: 'PO_LINE_AUTOCANCELLED',
          eventVersion: 'V1',
          resourceName: 'ORDER',
          eventUrl: callbackUrl,
          status: 'ACTIVE',
          headers: { 'content-type': 'application/json' },
        },
        {
          eventType: 'RETURN_CREATED',
          eventVersion: 'V1',
          resourceName: 'ReturnsAndRefunds', // ✅ as per their API
          eventUrl: callbackUrl,
          status: 'ACTIVE',
          headers: { 'content-type': 'application/json' },
        },
      ],
    };

    try {
      const response = await firstValueFrom(
        this.http.post(
          `${this.config.get('WALMART_API_URL')}/v3/webhooks/subscriptions`,
          subscriptionPayload,
          { headers: this.headers(token) },
        ),
      );
      this.logger.log('Webhook registered successfully', response.data);
    } catch (err) {
      // AxiosError includes config, response, and request
      if (err.response) {
        // Received response but status != 2xx
        this.logger.warn('Walmart responded with non-2xx', err.response.data);
      } else if (err.request) {
        // Request was made but no response
        this.logger.warn('No response from Walmart', err.request);
      } else {
        // Something else
        this.logger.error('Unexpected error', err.message);
      }
    }

    this.logger.log(`Webhooks registered`);
  }

  private headers(token: string) {
    console.log(token);
    return {
      'WM_SEC.ACCESS_TOKEN': token,
      'WM_SVC.NAME': 'Webhooks', // ✅ FIXED
      'WM_QOS.CORRELATION_ID': crypto.randomUUID(),
      'WM_CONSUMER.CHANNEL.TYPE': this.config.get(
        'WALMART_CONSUMER_CHANNEL_TYPE',
      ),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  }
}
