import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WalmartWebhookService {
  private readonly logger = new Logger(WalmartWebhookService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async createWebhook(
    token: string,
    storeId: string,
    userId: string,
    config: {
      eventType: string;
      eventVersion: string;
      resourceName: string;
    },
  ) {
    const callbackUrl = `${this.config.get(
      'APP_URL',
    )}/api/webhooks/walmart/${storeId}/${userId}`;

    const payload = {
      ...config,
      eventUrl: callbackUrl,
      status: 'ACTIVE',
      authDetails: { authMethod: 'OAUTH' },
    };

    await firstValueFrom(
      this.http.post(
        `${this.config.get('WALMART_API_URL')}/v3/webhooks/test`,
        payload,
        { headers: this.headers(token) },
      ),
    );

    await firstValueFrom(
      this.http.post(
        `${this.config.get('WALMART_API_URL')}/v3/webhooks/subscriptions`,
        payload,
        { headers: this.headers(token) },
      ),
    );

    this.logger.log(`Webhook registered: ${config.eventType}`);
  }

  private headers(token: string) {
    return {
      Authorization: `Bearer ${token}`,
      'WM_SVC.NAME': 'Walmart Marketplace',
      'WM_QOS.CORRELATION_ID': Date.now().toString(),
      Accept: 'application/json',
    };
  }
}
