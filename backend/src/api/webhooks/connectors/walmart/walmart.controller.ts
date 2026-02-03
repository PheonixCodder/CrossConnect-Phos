import {
  Controller,
  Post,
  Param,
  Headers,
  Body,
  UseGuards,
  HttpCode,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { WalmartWebhookProcessor } from './walmart-webhook.processor';
import { WalmartWebhookGuard } from '../../guards/walmart-webhook.guard';
import { WalmartOAuthHook } from './walmart-oauth.hook';
import { CryptoService } from '../../../../common/crypto.service';
import { StoresRepository } from '../../../../supabase/repositories/stores.repository';
import WalmartMarketplace from '@mediocre/walmart-marketplace';
import { isWalmartCredentials } from './walmart.types';

@Controller('webhooks/walmart')
export class WalmartWebhookController {
  constructor(
    private readonly processor: WalmartWebhookProcessor,
    private readonly storeRepo: StoresRepository,
    private readonly walmartOAuthHook: WalmartOAuthHook,
    private readonly crypto: CryptoService,
  ) {}

  // ────────────────────────────────────────────────
  // CONNECT WALMART (ONE-TIME)
  // ────────────────────────────────────────────────
  @Post('connect/:storeId')
  async connectWalmart(@Param('storeId') storeId: string) {
    const store = await this.storeRepo.getStoreById(storeId);
    if (!store) {
      throw new BadRequestException('Invalid storeId');
    }

    const credsResult = await this.storeRepo.getCredentials(storeId);
    const credentials = credsResult?.credentials;

    const { WALMART_CLIENT_ID, WALMART_CLIENT_SECRET } = credentials as any;

    if (!WALMART_CLIENT_SECRET || !WALMART_CLIENT_ID) {
      throw new BadRequestException(
        'Walmart clientId and clientSecret are required',
      );
    }
    // Idempotency
    if (store.webhook_status) {
      return { status: 'already_connected' };
    }

    console.log(
      this.crypto.decrypt(WALMART_CLIENT_ID),
      this.crypto.decrypt(WALMART_CLIENT_SECRET),
    );

    const walmart = new WalmartMarketplace({
      clientId: this.crypto.decrypt(WALMART_CLIENT_ID),
      clientSecret: this.crypto.decrypt(WALMART_CLIENT_SECRET),
      url: 'https://marketplace.walmartapis.com',
    });

    const { access_token } = await walmart.authentication.getAccessToken();

    if (!access_token) {
      throw new InternalServerErrorException(
        'Failed to obtain Walmart access token',
      );
    }

    const { created_by } = await this.storeRepo.getOrgById(store.org_id);

    await this.walmartOAuthHook.afterOAuth(access_token, store.id, created_by);

    await this.storeRepo.updateWebhookStatus(store.id, true);

    return { status: 'connected' };
  }

  @Post(':storeId/:userId')
  @UseGuards(WalmartWebhookGuard)
  @HttpCode(200)
  async handle(
    @Param('storeId') storeId: string,
    @Param('userId') userId: string,
    @Headers('wm_event_id') eventId: string,
    @Body() body: any,
  ) {
    await this.processor.enqueue({
      eventId,
      storeId,
      userId,
      payload: body,
    });
  }
}
