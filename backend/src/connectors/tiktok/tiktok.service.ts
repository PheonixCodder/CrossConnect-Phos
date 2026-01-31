import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import * as zlib from 'zlib';
import {
  ClientConfiguration,
  Fulfillment202309SearchPackageResponseDataPackages,
  Order202309GetOrderListResponseDataOrders,
  Product202502SearchProductsResponseDataProducts,
  ReturnRefund202309SearchReturnsResponseDataReturnOrders,
  TikTokShopNodeApiClient,
} from 'libs/tiktok';
import { TikTokOAuthService } from 'connectors/oauth/tiktok-oauth.service';

@Injectable()
export class TikTokService {
  private client: TikTokShopNodeApiClient;

  constructor(
    private readonly config: ConfigService,
    private readonly oauth: TikTokOAuthService,
  ) {
    ClientConfiguration.globalConfig.app_key =
      this.config.get('TIKTOK_APP_KEY');
    ClientConfiguration.globalConfig.app_secret =
      this.config.get('TIKTOK_APP_SECRET');

    this.client = new TikTokShopNodeApiClient({
      config: ClientConfiguration.createConfig().build(),
    });
  }

  async getAllOrders(storeId: string) {
    const { accessToken, shopCipher } = await this.oauth.getValidToken(storeId);
    const allOrders: Order202309GetOrderListResponseDataOrders[] = [];
    let pageToken = '';

    do {
      const res = await this.client.api.OrderV202309Api.OrdersSearchPost(
        100,
        accessToken,
        'application/json',
        undefined,
        pageToken,
        undefined,
        shopCipher,
      );

      const data = res.body.data;
      if (data?.orders) allOrders.push(...data.orders);
      pageToken = data?.nextPageToken || '';
    } while (pageToken !== '');

    return allOrders;
  }

  async getAllProducts(storeId: string) {
    const { accessToken, shopCipher } = await this.oauth.getValidToken(storeId);
    const allProducts: Product202502SearchProductsResponseDataProducts[] = [];
    let pageToken = '';

    do {
      const res = await this.client.api.ProductV202502Api.ProductsSearchPost(
        100,
        accessToken,
        'application/json',
        pageToken || undefined,
        shopCipher,
      );

      const data = res.body.data;
      if (data?.products) allProducts.push(...data.products);
      pageToken = data?.nextPageToken || '';
    } while (pageToken !== '');

    return allProducts;
  }

  async getOrderItems(storeId: string, orderId: string) {
    const { accessToken, shopCipher } = await this.oauth.getValidToken(storeId);
    const res = await this.client.api.OrderV202309Api.OrdersGet(
      [orderId],
      accessToken,
      'application/json',
      shopCipher,
    );
    return res.body.data?.orders?.[0]?.lineItems || [];
  }

  async getAllReturns(storeId: string) {
    const { accessToken, shopCipher } = await this.oauth.getValidToken(storeId);
    const allReturns: ReturnRefund202309SearchReturnsResponseDataReturnOrders[] =
      [];
    let pageToken = '';

    do {
      const res =
        await this.client.api.ReturnRefundV202309Api.ReturnsSearchPost(
          accessToken,
          'application/json',
          undefined,
          undefined,
          '50',
          pageToken || undefined,
          shopCipher,
        );

      const data = res.body.data;
      if (data?.returnOrders) {
        allReturns.push(...data.returnOrders);
      }
      pageToken = data?.nextPageToken || '';
    } while (pageToken !== '');

    return allReturns;
  }

  /**
   * FBT Fulfillment: Fetches shipment provider and package details.
   * Note: In FBT, TikTok provides the tracking and shipping labels.
   */
  async getAllFulfillments(storeId: string, orderId: string) {
    const { accessToken, shopCipher } = await this.oauth.getValidToken(storeId);

    const allPackages: Fulfillment202309SearchPackageResponseDataPackages[] =
      [];
    let pageToken = '';

    do {
      const res =
        await this.client.api.FulfillmentV202309Api.PackagesSearchPost(
          50,
          accessToken,
          'application/json',
          undefined,
          undefined,
          pageToken,
          shopCipher,
        );

      const data = res.body.data;

      if (data?.packages) {
        allPackages.push(...data.packages);
      }

      // Update token for the next iteration
      pageToken = data?.nextPageToken || '';
    } while (pageToken !== '');

    return allPackages;
  }
}
