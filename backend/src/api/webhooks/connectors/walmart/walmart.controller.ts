import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WalmartWebhooksService } from './walmart.service';
import { WalmartWebhookGuard } from '../../guards/walmart-webhook.guard';

@Controller('webhooks/walmart')
export class WalmartWebhookController {
  constructor(private walmartService: WalmartWebhooksService) {}

  @Post(':userId')
  @UseGuards(WalmartWebhookGuard)
  @HttpCode(200)
  async handleWebhook(@Param('userId') userId: string, @Body() body: any) {
    console.log(`Received notification for internal user: ${userId}`);

    // Now you can query your DB or perform actions specifically for this user
    await this.walmartService.processEvent(userId, body);

    return { status: 'ACKNOWLEDGED' };
  }
}
