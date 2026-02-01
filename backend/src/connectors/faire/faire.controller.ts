import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
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
    @Query('authorization_code') code: string,
    @Query('state') storeId: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    console.log('FAIRE CALLBACK HIT', req.url);

    // respond immediately
    res.redirect(`${process.env.FRONTEND_URL}/integrations?platform=faire`);

    // continue async (do NOT await)
    this.faireOAuth
      .handleCallback(code, storeId)
      .catch((err) => console.error('FAIRE OAUTH ERROR', err));
  }
}
