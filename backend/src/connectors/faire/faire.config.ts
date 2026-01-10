import { registerAs } from '@nestjs/config';

export default registerAs('faire', () => ({
  baseUrl: process.env.FAIRE_API_BASE_URL,
  accessToken: process.env.FAIRE_ACCESS_TOKEN,
  timeout: Number(process.env.FAIRE_TIMEOUT ?? 10000),
}));
