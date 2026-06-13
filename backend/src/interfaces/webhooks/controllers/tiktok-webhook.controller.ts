import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { TikTokWebhookProcessor } from '../../../infrastructure/queues/bullmq/webhooks/tiktok-webhook.processor';
import { TikTokWebhookHandlerService } from '../../../application/webhooks/tiktok/tiktok-webhook-handler.service';

@Controller('webhooks/tiktok')
export class TikTokWebhookController {
  constructor(
    private readonly handler: TikTokWebhookHandlerService,
    private readonly processor: TikTokWebhookProcessor,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Req() req: any,
    @Body() body: any,
    @Headers('authorization') signature: string,
  ) {
    const tiktokShopId: string = body.shop_id;

    this.handler.verifySignature(
      req.rawBody as Buffer<ArrayBufferLike>,
      signature,
    );

    await this.processor.enqueue({
      tiktokShopId,
      payload: body,
    });

    return { status: 'ACK' };
  }

  @Get()
  @HttpCode(200)
  handleGet() {
    return { status: 'ACK' };
  }
}
