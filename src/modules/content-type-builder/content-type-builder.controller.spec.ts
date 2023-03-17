import { Test, TestingModule } from '@nestjs/testing';
import { ContentTypeBuilderController } from './content-type-builder.controller';
import { ContentTypeBuilderService } from './content-type-builder.service';

describe('ContentTypeBuilderController', () => {
  let controller: ContentTypeBuilderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContentTypeBuilderController],
      providers: [ContentTypeBuilderService],
    }).compile();

    controller = module.get<ContentTypeBuilderController>(
      ContentTypeBuilderController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
