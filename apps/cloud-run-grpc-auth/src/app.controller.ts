import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PingRequest, PingResponse } from '@mammay/grpc-helper';


@Controller()
export class AppController {


  @GrpcMethod('HelloService', 'Ping')
  ping(ping: PingRequest): PingResponse {
    return {
      greetingMessage: `Hello ${ping.name}`,
    };
  }
}
