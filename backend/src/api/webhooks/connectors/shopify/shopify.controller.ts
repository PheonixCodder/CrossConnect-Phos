import {
  Controller,
  Post,
  Body,
  Param,
  Headers,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ShopifyWebhookGuard } from '../../guards/shopify-webhook.guard';
import { ShopifyWebhookProcessor } from './shopify.processor';

@Controller('webhooks/shopify')
export class ShopifyWebhookController {
  constructor(private readonly processor: ShopifyWebhookProcessor) {}

  @Post(':storeId/:userId')
  @UseGuards(ShopifyWebhookGuard)
  @HttpCode(200)
  async handle(
    @Param('storeId') storeId: string,
    @Param('userId') userId: string,
    @Headers('x-shopify-topic') topic: string,
    @Headers('x-shopify-webhook-id') webhookId: string,
    @Body() body: any,
  ) {
    await this.processor.enqueue({
      webhookId,
      topic,
      storeId,
      userId,
      payload: body,
    });
  }
}
