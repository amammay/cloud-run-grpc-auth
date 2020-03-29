import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const logger = new Logger('Main');

async function bootstrap() {
  const port = process.env.PORT || '5000';
  const address = '0.0.0.0';

  const protoPath = join(process.cwd(), 'protos/hello-world.proto');
  const microserviceOptions: MicroserviceOptions = {
    transport: Transport.GRPC,
    options: {
      package: 'hello_world',
      protoPath,
      url: `${address}:${port}`,
    },
  };

  const app = await NestFactory.createMicroservice(
    AppModule,
    microserviceOptions,
  );
  app.listen(() => {
    logger.debug(`Started GRPC server on ${microserviceOptions.options.url}`);
  });
}

bootstrap();
