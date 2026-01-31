import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { TikTokWebhooksService } from './tiktok.service';

@Controller('webhooks/tiktok')
export class TikTokWebhookController {
  constructor(private readonly service: TikTokWebhooksService) {}

  @Post(':storeId')
  @HttpCode(200)
  async handle(
    @Param('storeId') storeId: string,
    @Req() req: Request & { rawBody: Buffer },
    @Body() body: any,
    @Headers('x-tt-signature') signature: string,
    @Headers('x-tt-timestamp') timestamp: string,
  ) {
    await this.service.verifyAndProcess(
      storeId,
      req.rawBody,
      body,
      signature,
      timestamp,
    );

    return { status: 'ACK' };
  }
}
