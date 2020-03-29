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
