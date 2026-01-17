import { Controller, Post, Body } from '@nestjs/common';

@Controller('webhooks')
export class WebhooksController {
  @Post('amazon')
  async handleAmazonWebhook(@Body() body: any) {}

  @Post('shopify')
  async handleShopifyWebhook(@Body() body: any) {}

  @Post('walmart')
  async handleWalmartWebhook(@Body() body: any) {}

  @Post('tiktok')
  async handleTiktokWebhook(@Body() body: any) {}
}
