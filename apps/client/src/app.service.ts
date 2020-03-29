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
