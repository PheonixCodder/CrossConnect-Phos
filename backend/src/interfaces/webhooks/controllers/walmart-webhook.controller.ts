import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Inject,
  InternalServerErrorException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import WalmartMarketplace from '@mediocre/walmart-marketplace';
import { WalmartOAuthHook } from '../../../application/webhooks/walmart/walmart-oauth.hook';
import { isWalmartCredentials } from '../../../application/webhooks/walmart/walmart.types';
import {
  STORE_CREDENTIALS_REPOSITORY,
  StoreCredentialsRepositoryPort,
  STORES_REPOSITORY,
  StoresRepositoryPort,
} from '../../../domain/repositories/repository-ports';
import { WalmartWebhookProcessor } from '../../../infrastructure/queues/bullmq/webhooks/walmart-webhook.processor';
import { CryptoService } from '../../../shared/crypto/crypto.service';
import { WalmartWebhookGuard } from '../guards/walmart-webhook.guard';

@Controller('webhooks/walmart')
export class WalmartWebhookController {
  constructor(
    private readonly processor: WalmartWebhookProcessor,
    @Inject(STORES_REPOSITORY)
    private readonly storeRepo: StoresRepositoryPort,
    @Inject(STORE_CREDENTIALS_REPOSITORY)
    private readonly storeCredentialsRepo: StoreCredentialsRepositoryPort,
    private readonly walmartOAuthHook: WalmartOAuthHook,
    private readonly crypto: CryptoService,
  ) {}

  @Post('connect/:storeId')
  async connectWalmart(@Param('storeId') storeId: string) {
    const store = await this.storeRepo.getStoreById(storeId);
    if (!store) {
      throw new BadRequestException('Invalid storeId');
    }

    const credentials = await this.storeCredentialsRepo.getCredentialsByStoreId(
      storeId,
    );

    const { WALMART_CLIENT_ID, WALMART_CLIENT_SECRET } = credentials as any;

    if (!WALMART_CLIENT_SECRET || !WALMART_CLIENT_ID) {
      throw new BadRequestException(
        'Walmart clientId and clientSecret are required',
      );
    }

    if (store.webhook_status) {
      return { status: 'already_connected' };
    }

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

    if (!store.org_id) {
      throw new BadRequestException('Store is missing organization');
    }

    const { created_by } = await this.storeRepo.getOrgById(store.org_id);

    if (!created_by) {
      throw new BadRequestException('Organization is missing owner');
    }

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
