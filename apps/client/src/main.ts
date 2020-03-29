import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

const logger = new Logger('main');

async function bootstrap() {
  const port = process.env.PORT || '8080';
  const app = await NestFactory.create(AppModule);
  await app.listen(port, () => {
    logger.debug(`Client Server listening on port ${port}`);
  });
}

bootstrap();
