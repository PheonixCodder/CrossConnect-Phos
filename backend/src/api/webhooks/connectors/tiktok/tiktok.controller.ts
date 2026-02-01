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
import { TikTokWebhooksService } from './tiktok.service';

@Controller('webhooks/tiktok')
export class TikTokWebhookController {
  constructor(private readonly service: TikTokWebhooksService) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Req() req: any,
    @Body() body: any,
    @Headers('authorization') signature: string,
  ) {
    const tiktokShopId: string = body.shop_id;

    this.service.verifySignature(
      req.rawBody as Buffer<ArrayBufferLike>,
      signature,
    );

    await this.service.verifyAndProcess(body, tiktokShopId);

    return { status: 'ACK' };
  }

  @Get()
  @HttpCode(200)
  handleGet(@Req() req: any) {
    return { status: 'ACK' };
  }
}
