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
    console.log('FAIRE CALLBACK HIT', { code, storeId });

    // respond immediately
    res.redirect(`${process.env.FRONTEND_URL}/integrations?platform=faire`);

    // continue async (do NOT await)
    this.faireOAuth
      .handleCallback(code, storeId)
      .catch((err) => console.error('FAIRE OAUTH ERROR', err));
  }
}
