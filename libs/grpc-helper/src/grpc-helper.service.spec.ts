import { Test, TestingModule } from '@nestjs/testing';
import { GrpcHelperService } from './grpc-helper.service';

describe('GrpcHelperService', () => {
  let service: GrpcHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GrpcHelperService],
    }).compile();

    service = module.get<GrpcHelperService>(GrpcHelperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
