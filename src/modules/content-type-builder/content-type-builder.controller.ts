import { CreateContentTypeBuilderInput } from '@modules/content-type-builder/dto/create-content-type-builder.input';
import { UpdateContentTypeBuilderInput } from '@modules/content-type-builder/dto/update-content-type-builder.input';
import { SuccessResponseDto } from '@moonlightjs/common';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ContentTypeBuilderService } from './content-type-builder.service';

@ApiTags('content-type-builder')
@Controller({
  path: 'content-type-builder',
  version: '1',
})
export class ContentTypeBuilderController {
  constructor(
    private readonly contentTypeBuilderService: ContentTypeBuilderService,
  ) {}

  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDto })
  @Get()
  get() {
    return this.contentTypeBuilderService.get();
  }

  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDto })
  @Post()
  create(@Body() createContentTypeBuilderInput: CreateContentTypeBuilderInput) {
    return this.contentTypeBuilderService.create(createContentTypeBuilderInput);
  }

  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDto })
  @Put('/:uid')
  update(
    @Param('uid') uid: string,
    @Body() updateContentTypeBuilderInput: UpdateContentTypeBuilderInput,
  ) {
    return this.contentTypeBuilderService.update(
      uid,
      updateContentTypeBuilderInput,
    );
  }

  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDto })
  @Delete('/:uid')
  delete(@Param('uid') uid: string) {
    return this.contentTypeBuilderService.delete(uid);
  }
}
