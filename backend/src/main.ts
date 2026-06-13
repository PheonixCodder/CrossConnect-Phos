import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger as NestLogger } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { configureHttpApplication } from './bootstrap/http/app-bootstrap';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });

  configureHttpApplication(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`Application is running on: http://localhost:${port}`);
}

bootstrap().catch((error) => {
  new NestLogger('Bootstrap').error('Failed to bootstrap application', error);
  process.exit(1);
});
