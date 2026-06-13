import { registerAs } from '@nestjs/config';

export default registerAs('target', () => ({
  baseUrl: process.env.TARGET_API_BASE_URL,
  apiKey: process.env.TARGET_API_KEY,
  sellerId: process.env.TARGET_SELLER_ID,
  sellerToken: process.env.TARGET_SELLER_TOKEN,
  timeout: Number(process.env.TARGET_TIMEOUT ?? 10000),
}));
