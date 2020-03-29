# Cloud Run (Rest) <- Grpc Authenticated -> Cloud Run (Grpc) communication

Here is a quick overview of how to do secure cloud run to cloud run communication over grpc.

A quick over view of the tech stack in use
- NodeJs
- NestJs (express, and grpc)
- Cloud Run

Inspiration was to piggy back of this article [here](https://cloud.google.com/blog/products/compute/serve-cloud-run-requests-with-grpc-not-just-http)
that explained how cloud run supports unary grpc calls, but it in my case I wanted to find an example of doing authenticated GRPC inside cloud run, shouldn't be too much different. 
## Proto Definition

We have a simple hello world style of service takes a name and returns a greeting
`protos/hello-world.proto`
```proto
syntax = "proto3";

package hello_world;

service HelloService {
    rpc Ping (PingRequest) returns (PingResponse);
}

message PingRequest {
    string name = 1;
}

message PingResponse {
    string greeting_message = 1;
}

```

## Common model to share between apps
`libs/grpc-helper/src/hello-world.ts`
```typescript
import { Observable } from 'rxjs';

export const HelloWorldPackage = Symbol.for('HelloWorldPackage');

export interface HelloService {
  ping(ping: PingRequest): Observable<PingResponse>;
}

export interface PingRequest {
  name: string;
}

export interface PingResponse {
  greetingMessage: string;
}

```

## Server setup

Here is our grpc server setup. 
`apps/server/src/main.ts`
```typescript
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const logger = new Logger('Main');

async function bootstrap() {
  // cloud run will default set the PORT env variable
  const port = process.env.PORT || '5000';
  // important to have the server listening on 0.0.0.0
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

```

and our controller
`apps/server/src/app.controller.ts`
```typescript
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PingRequest, PingResponse } from '@mammay/grpc-helper';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  //Nest js will do the service mapping with this decorator 
  @GrpcMethod('HelloService', 'Ping')
  ping(ping: PingRequest, metaData: any): PingResponse {
    this.logger.debug(
      `received ${JSON.stringify(ping)} from ${JSON.stringify(metaData)}`,
    );
    return {
      greetingMessage: `Hello ${ping.name}`,
    };
  }
}

```

## Client setup

`apps/client/src/main.ts`
```typescript
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

```

`apps/client/src/app.module.ts`
```typescript
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

```

and next the googleCloudGrpcConfigurator

`libs/grpc-helper/src/grpc-helper.ts`
```typescript
import {
  ClientProxy,
  ClientProxyFactory,
  Closeable,
  GrpcOptions,
} from '@nestjs/microservices';
import * as assert from 'assert';
import * as GRPC from 'grpc';
import { GoogleAuth } from 'google-auth-library';

export async function googleCloudGrpcConfigurator(
  targetGrpcServer: GrpcOptions,
): Promise<ClientProxy & Closeable> {
  assert(targetGrpcServer.options, 'no options provided');
  assert(targetGrpcServer.options.package, 'no package provided');
  assert(targetGrpcServer.options.protoPath, 'no protopath provided');

  const audience = targetGrpcServer.options.url.split(':')[0];
  const target = `https://${audience}`;
  const idTokenClient = await new GoogleAuth().getIdTokenClient(target);
  const channelCredentials = GRPC.credentials.createSsl();

  const callCreds = GRPC.credentials.createFromGoogleCredential(
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    idTokenClient,
  );
  targetGrpcServer.options.credentials = GRPC.credentials.combineChannelCredentials(
    channelCredentials,
    callCreds,
  );

  return ClientProxyFactory.create(targetGrpcServer);
}

```

and our controller
`apps/client/src/app.controller.ts`
```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get(':user')
  getHello(@Param('user') user: string) {
    return this.appService.getHello(user);
  }
}

```

and our service
`apps/client/src/app.service.ts`
```typescript
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  HelloService,
  HelloWorldPackage,
  PingResponse,
} from '@mammay/grpc-helper';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  private hello: HelloService;

  constructor(@Inject(HelloWorldPackage) private readonly client: ClientGrpc) {}

  onModuleInit(): any {
    this.hello = this.client.getService<HelloService>('HelloService');
  }

  getHello(name: string): Observable<PingResponse> {
    this.logger.debug('calling ping service');
    return this.hello
      .ping({ name })
      .pipe(tap(x => this.logger.debug(`received ${JSON.stringify(x)}`)));
  }
}

```


So then to get this up and running in the cloud we just need to do a 

```
docker build --build-arg=project=server -t gcr.io/[PROJECT_ID]/server .
docker push gcr.io/[PROJECT_ID]/server
gcloud run deploy server --image gcr.io/mammay-play/server --no-allow-unauthenticated
```

```
docker build --build-arg=project=client -t gcr.io/[PROJECT_ID]/client .
docker push gcr.io/[PROJECT_ID]/client
gcloud run deploy client --image gcr.io/mammay-play/client --allow-unauthenticated --set-env-vars=GRPC_TARGET_URL=server-5wbt2shqaq-uc.a.run.app:443

```

and then to test it out, lets do 

a quick curl 
```shell

curl https://client-5wbt2shqaq-uc.a.run.app/alex

```

and the response is 

```json

{
    "greetingMessage": "Hello alex"
}

```
