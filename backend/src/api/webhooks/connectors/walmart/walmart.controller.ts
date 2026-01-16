import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { WalmartWebhooksService } from './walmart.service';

@Controller('webhooks/walmart')
export class WalmartWebhookController {
  constructor(private walmartService: WalmartWebhooksService) {}

  @Post(':userId')
  @HttpCode(200)
  async handleWebhook(@Param('userId') userId: string, @Body() body: any) {
    console.log(`Received notification for internal user: ${userId}`);

    // Now you can query your DB or perform actions specifically for this user
    await this.walmartService.processEvent(userId, body);

    return { status: 'ACKNOWLEDGED' };
  }
}
