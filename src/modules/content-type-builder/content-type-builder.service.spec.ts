import { Test, TestingModule } from '@nestjs/testing';
import { ContentTypeBuilderService } from './content-type-builder.service';

describe('ContentTypeBuilderService', () => {
  let service: ContentTypeBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContentTypeBuilderService],
    }).compile();

    service = module.get<ContentTypeBuilderService>(ContentTypeBuilderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
