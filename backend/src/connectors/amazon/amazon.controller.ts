import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AmazonOAuthService } from '../oauth/amazon-oauth.service';

@Controller('auth/amazon')
export class AmazonController {
  constructor(private readonly amazonOAuth: AmazonOAuthService) {}

  @Get()
  redirect(
    @Query('storeId') storeId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!storeId) {
      throw new BadRequestException('Missing storeId');
    }

    return res.redirect(this.amazonOAuth.getAuthUrl(storeId));
  }

  @Get('callback')
  async callback(
    @Query('spapi_oauth_code') code: string,
    @Query('state') storeId: string,
    @Res() res: Response,
  ) {
    if (!code) {
      throw new BadRequestException('Missing SP-API authorization code');
    }

    await this.amazonOAuth.handleCallback(code, storeId);

    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations?platform=amazon`,
    );
  }
}
