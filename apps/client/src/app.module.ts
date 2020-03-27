import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([{
      name: 'HelloWorldPackage',
      transport: Transport.GRPC,
      options: {
        package: 'hello_world',
        protoPath: join(process.cwd(), 'protos/hello-world.proto'),
      },
    }]),
  ],
  controllers: [AppController],
  providers: [AppService,
  ],
})
export class AppModule {
}
