import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { HelloService, PingResponse } from '@mammay/grpc-helper';
import { ClientGrpc } from '@nestjs/microservices';


@Injectable()
export class AppService implements OnModuleInit {

  private hello: HelloService;

  constructor(@Inject('HelloWorldPackage') private readonly client: ClientGrpc) {
  }

  onModuleInit(): any {
    this.hello = this.client.getService<HelloService>('HelloService');
  }

  async getHello(name: string): Promise<PingResponse> {
    const stuff = await this.hello.ping({ name }).toPromise();
    console.log(stuff);
    return stuff;
  }
}
