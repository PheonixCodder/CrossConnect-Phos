import { Controller, Post, Body } from '@nestjs/common';
import { AmazonService } from '../connectors/amazon/amazon.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly amazon: AmazonService) {}

  @Post('amazon')
  async handleAmazonWebhook(@Body() body: any) {}

  @Post('shopify')
  async handleShopifyWebhook(@Body() body: any) {}

  @Post('walmart')
  async handleWalmartWebhook(@Body() body: any) {}

  @Post('tiktok')
  async handleTiktokWebhook(@Body() body: any) {}
}
