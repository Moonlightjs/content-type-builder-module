import { Module } from '@nestjs/common';
import { ContentTypeBuilderService } from './content-type-builder.service';
import { ContentTypeBuilderController } from './content-type-builder.controller';

@Module({
  controllers: [ContentTypeBuilderController],
  providers: [ContentTypeBuilderService],
  exports: [ContentTypeBuilderService],
})
export class ContentTypeBuilderModule {}
