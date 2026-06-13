import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ShopifyOAuthService } from '../oauth/shopify-oauth.service';

@Controller('auth/shopify')
export class ShopifyAuthController {
  constructor(private readonly shopifyOAuth: ShopifyOAuthService) {}

  /**
   * Step 1: Redirect merchant to Shopify permissions screen
   */
  @Get()
  async redirect(
    @Query('storeId') storeId: string,
    @Query('shop') shop: string, // Add this
    @Res() res: Response,
  ) {
    if (!storeId || !shop) {
      throw new BadRequestException('Missing storeId or shop domain');
    }

    return res.redirect(await this.shopifyOAuth.getAuthUrl(shop, storeId));
  }

  /**
   * Step 2: Shopify callback
   */
  @Get('callback')
  async callback(@Query() query: any, @Res() res: Response) {
    await this.shopifyOAuth.handleCallback(query);

    return res.redirect(
      `${process.env.FRONTEND_URL}/integrations?platform=shopify`,
    );
  }
}
