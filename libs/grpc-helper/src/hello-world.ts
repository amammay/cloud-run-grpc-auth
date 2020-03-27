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
