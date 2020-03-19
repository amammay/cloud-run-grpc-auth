import { Module } from '@nestjs/common';
import { GrpcHelperService } from './grpc-helper.service';

@Module({
  providers: [GrpcHelperService],
  exports: [GrpcHelperService],
})
export class GrpcHelperModule {}
