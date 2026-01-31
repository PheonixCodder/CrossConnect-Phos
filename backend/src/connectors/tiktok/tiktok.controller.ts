import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { TikTokOAuthService } from 'connectors/oauth/tiktok-oauth.service';
import { Response } from 'express';

@Controller('auth/tiktok')
export class TikTokOAuthController {
  constructor(private readonly oauth: TikTokOAuthService) {}

  /**
   * Step 1: Redirect user to TikTok Shop OAuth
   * Mirrors Amazon / Walmart connect endpoints
   */
  @Get()
  redirectToTikTok(@Param('storeId') storeId: string, @Res() res: Response) {
    const url = this.oauth.getAuthUrl(storeId);
    return res.redirect(url);
  }

  /**
   * Step 2: TikTok OAuth callback
   */
  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') storeId: string,
    @Res() res: Response,
  ) {
    if (!code || !storeId) {
      throw new BadRequestException('Missing TikTok OAuth parameters');
    }

    await this.oauth.handleCallback(code, storeId);

    // Same UX pattern as Amazon/Walmart
    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations?platform=tiktok`,
    );
  }
}
