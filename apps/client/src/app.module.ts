import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Transport } from '@nestjs/microservices';
import { join } from 'path';
import {
  googleCloudGrpcConfigurator,
  HelloWorldPackage,
} from '@mammay/grpc-helper';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  controllers: [AppController],
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    AppService,
    {
      provide: HelloWorldPackage,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const targetUrl = config.get('GRPC_TARGET_URL');
        return await googleCloudGrpcConfigurator({
          transport: Transport.GRPC,
          options: {
            url: targetUrl,
            package: 'hello_world',
            protoPath: join(process.cwd(), 'protos/hello-world.proto'),
          },
        });
      },
    },
  ],
})
export class AppModule {}
