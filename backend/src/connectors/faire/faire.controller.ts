import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FaireOAuthService } from '../oauth/faire-oauth.service';

@Controller('auth/faire')
export class FaireAuthController {
  constructor(private readonly faireOAuth: FaireOAuthService) {}

  @Get()
  redirect(@Query('storeId') storeId: string, @Res() res: Response) {
    if (!storeId) {
      throw new BadRequestException('Missing storeId');
    }

    return res.redirect(this.faireOAuth.getAuthUrl(storeId));
  }

  @Get('callback')
  async callback(
    @Query('authorizationCode') code: string,
    @Query('state') storeId: string,
    @Res() res: Response,
  ) {
    if (!code) {
      throw new BadRequestException('Missing authorization code');
    }

    await this.faireOAuth.handleCallback(code, storeId);

    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations?platform=faire`,
    );
  }
}
