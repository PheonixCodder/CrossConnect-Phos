import {
  Controller,
  Post,
  Param,
  Headers,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { WalmartWebhookProcessor } from './walmart-webhook.processor';
import { WalmartWebhookGuard } from '../../guards/walmart-webhook.guard';

@Controller('webhooks/walmart')
export class WalmartWebhookController {
  constructor(private readonly processor: WalmartWebhookProcessor) {}

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
