import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PingRequest, PingResponse } from '@mammay/grpc-helper';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

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
