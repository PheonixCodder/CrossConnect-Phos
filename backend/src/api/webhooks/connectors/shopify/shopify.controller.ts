import {
  Controller,
  Post,
  Body,
  Param,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ShopifyWebhooksService } from './shopify.service';
import { ShopifyMultiTenantGuard } from '../../guards/shopify-webhook.guard';

@Controller('webhooks/shopify')
export class ShopifyWebhookController {
  constructor(private readonly shopifyService: ShopifyWebhooksService) {}

  @Post(':orgId/:userId')
  @UseGuards(ShopifyMultiTenantGuard)
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Headers('x-shopify-topic') topic: string,
    @Body() body: any,
  ) {
    // Process event synchronously before acknowledging
    await this.shopifyService.processEvent(userId, orgId, topic, body);
    return { status: 'ACKNOWLEDGED' };
  }
}
