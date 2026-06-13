import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FaireOAuthService } from '../oauth/faire-oauth.service';

@Controller('auth/faire')
export class FaireAuthController {
  private readonly logger = new Logger(FaireAuthController.name);

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
    // respond immediately
    res.redirect(`${process.env.FRONTEND_URL}/integrations?platform=faire`);

    // continue async (do NOT await)
    this.faireOAuth
      .handleCallback(code, storeId)
      .catch((err) => this.logger.error('Faire OAuth callback failed', err));
  }
}
