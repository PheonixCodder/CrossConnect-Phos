/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
import * as qs from 'qs';
import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { StoresRepository } from 'src/supabase/repositories/stores.repository';
import { WalmartWebhookBody } from 'src/api/webhooks/connectors/walmart/walmart.types';

@Injectable()
export class WalmartWebhooksService {
  private readonly logger = new Logger(WalmartWebhooksService.name);
  private get baseUrl() {
    return (
      this.config.get<string>('WALMART_API_URL') ||
      'https://marketplace.walmartapis.com'
    );
  }
  constructor(
    private readonly config: ConfigService,
    private credentialsRepo: StoresRepository,
    private httpService: HttpService,
  ) {}
  async setupWebhookForUser(
    userId: string,
    orgId: string,
    config: { eventType: string; eventVersion: string; resourceName: string },
  ) {
    const store = await this.credentialsRepo.getCredentials(userId, orgId);
    if (!store?.credentials) throw new Error('Walmart credentials not found');
    let creds: { clientId: string; clientSecret: string };
    try {
      creds =
        typeof store.credentials === 'string'
          ? JSON.parse(store.credentials)
          : store.credentials;
    } catch (err) {
      this.logger.error('Invalid Walmart credentials payload', err);
      throw new InternalServerErrorException('Invalid Walmart credentials');
    }

    const token = await this.getAccessToken(
      creds as { clientId: string; clientSecret: string },
    );

    const appUrl = this.config.get<string>('APP_URL');
    if (!appUrl) {
      throw new InternalServerErrorException('APP_URL is not configured');
    }
    const eventUrl = `${appUrl}/api/webhooks/walmart/${userId}`;
    const payload = {
      eventType: config.eventType,
      eventVersion: config.eventVersion,
      resourceName: config.resourceName,
      eventUrl: eventUrl,
      status: 'ACTIVE',
      authDetails: {
        authMethod: 'OAUTH',
      },
    };

    const headers = this.getHeaders(token);

    // FIX: Correct Versioned Endpoints
    try {
      // Step 1: Test (Mandatory)
      await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/v3/webhooks/test`, payload, {
          headers,
          timeout: 10_000,
        }),
      );
      // Step 2: Create
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/v3/webhooks/subscriptions`,
          payload,
          { headers, timeout: 10_000 },
        ),
      );
      return response.data;
    } catch (error) {
      this.handleError('setupWebhook', error);
    }
  }

  async getAccessToken(credentials: {
    clientId: string;
    clientSecret: string;
  }): Promise<string> {
    // FIX: Correct path for token
    const url = `${this.baseUrl}/v3/token`;

    const data = qs.stringify({ grant_type: 'client_credentials' });
    const authHeader = Buffer.from(
      `${credentials.clientId}:${credentials.clientSecret}`,
    ).toString('base64');

    const headers = {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'WM_SVC.NAME': 'Walmart Marketplace',
      'WM_QOS.CORRELATION_ID': Date.now().toString(),
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, data, { headers }),
      );
      const accessToken = response.data?.access_token;
      if (!accessToken) {
        throw new InternalServerErrorException(
          'Walmart token response missing access_token',
        );
      }
      return accessToken;
    } catch (error) {
      this.logger.error(
        'Walmart Auth Failed',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('Walmart Authentication Failed');
    }
  }

  private getHeaders(token: string) {
    return {
      Authorization: `Bearer ${token}`,
      'WM_SVC.NAME': 'Walmart Marketplace',
      'WM_QOS.CORRELATION_ID': Date.now().toString(),
      Accept: 'application/json',
    };
  }

  async processEvent(userId: string, body: WalmartWebhookBody) {
    const { eventType } = body.source;
    const { payload } = body;

    this.logger.log(`Processing ${eventType} for user ${userId}`);

    try {
      switch (eventType) {
        case 'INVENTORY_OOS':
          await this.handleInventoryOOS(userId, payload);
          break;

        case 'PO_CREATED':
          await this.handleOrderCreated(userId, payload);
          break;

        case 'PO_LINE_AUTOCANCELLED':
          await this.handleOrderCancelled(userId, payload);
          break;

        case 'RETURN_CREATED':
          await this.handleReturnCreated(userId, payload);
          break;

        default:
          this.logger.warn(`Unhandled event type: ${eventType}`);
      }
    } catch (error) {
      this.logger.error(
        `Error processing ${eventType} for ${userId}`,
        error.stack,
      );
      // Do not throw here if you want to ensure the controller still returns 200 to Walmart
    }
  }

  private async handleInventoryOOS(userId: string, payload: any) {
    const { sku, shipNodes } = payload;
    this.logger.warn(`SKU ${sku} is Out of Stock for user ${userId}`);

    // Logic: Mark product as inactive or trigger restock alert in your DB
    // await this.productsRepo.updateStatus(userId, sku, 'OUT_OF_STOCK');
  }

  private async handleOrderCreated(userId: string, payload: any) {
    const { purchaseOrderId, customerOrderId, orderLines, shipNodeType } =
      payload;

    this.logger.log(`New Order ${purchaseOrderId} received for user ${userId}`);

    // Logic: Sync new order to your local database
    // await this.ordersRepo.createOrder({
    //   userId,
    //   externalOrderId: purchaseOrderId,
    //   items: orderLines.map(line => ({ sku: line.sku, qty: line.quantity.measurementValue })),
    //   status: 'CREATED'
    // });
  }

  private async handleOrderCancelled(userId: string, payload: any) {
    const { purchaseOrderId, orderLines } = payload;

    for (const line of orderLines) {
      this.logger.error(
        `Line ${line.lineNumber} in Order ${purchaseOrderId} was auto-cancelled. Reason: ${line.cancellationReason}`,
      );
      // Logic: Update local order status and notify user
    }
  }

  private async handleReturnCreated(userId: string, payload: any) {
    // Note: RETURN_CREATED payload structure is slightly different (returnOrders list)
    const { returnOrders } = payload;

    for (const ret of returnOrders) {
      this.logger.log(
        `Return created for PO ${ret.purchaseOrderId}. Reason: ${ret.returnReason}`,
      );
      // Logic: Create return record in your system
      // await this.returnsRepo.create({
      //   userId,
      //   rma: ret.returnOrderId,
      //   reason: ret.returnReason
      // });
    }
  }

  private handleError(method: string, error: any) {
    this.logger.error(
      `Walmart API error in ${method}`,
      error?.response?.data || error.message,
    );
    throw new InternalServerErrorException(
      `Failed to communicate with Walmart API: ${method}`,
    );
  }
}
