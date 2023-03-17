import { CollationTypeAttributeBoolean } from './collation-type';
import {
  CollationType,
  CollationTypeAttributeEnumeration,
  CollationTypeAttributeRelationInverse,
  CollationTypeAttribute,
  CollationTypeAttributeString,
  CollationTypeAttributeNumber,
  CollationTypeAttributeDecimal,
} from '@modules/content-type-builder/collation-type';
import { BadRequestException } from '@nestjs/common';
import { paramCase, pascalCase, camelCase, constantCase } from 'change-case';
import { constants } from 'fs';
import * as fs from 'fs-extra';
import * as path from 'path';

export const generateContentTypesModule = (
  contentTypesSchema: Record<string, CollationType>,
) => {
  Object.keys(contentTypesSchema).forEach((contentTypeId) => {
    generateContentTypeModule(
      contentTypesSchema[contentTypeId],
      contentTypesSchema,
    );
  });
};

const generateContentTypeModule = (
  contentType: CollationType,
  contentTypesSchema: Record<string, CollationType>,
) => {
  const rootFolder = process.env.INIT_CWD as string;
  try {
    // remove content-type folder if it exists
    fs.removeSync(
      `${rootFolder}/src/content-type/${paramCase(contentType.collectionName)}`,
    );
  } catch (err) {
    console.warn(err);
  }

  fs.mkdirSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/dto`,
    {
      recursive: true,
    },
  );
  fs.mkdirSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/content-types`,
    {
      recursive: true,
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/${paramCase(contentType.collectionName)}.module.ts`,
    generateContentTypeModuleContent(contentType),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/${paramCase(contentType.collectionName)}.controller.ts`,
    generateContentTypeControllerContent(contentType),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/admin-${paramCase(contentType.collectionName)}.controller.ts`,
    generateContentTypeAdminControllerContent(contentType),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/${paramCase(contentType.collectionName)}.service.ts`,
    generateContentTypeServiceContent(contentType),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/dto/${paramCase(contentType.collectionName)}.dto.ts`,
    generateContentTypeDtoContent(contentType, contentTypesSchema),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/dto/admin-${paramCase(contentType.collectionName)}.dto.ts`,
    generateContentTypeAdminDtoContent(contentType, contentTypesSchema),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/dto/create-${paramCase(contentType.collectionName)}.input.ts`,
    generateContentTypeCreateInputContent(contentType, contentTypesSchema),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/dto/create-admin-${paramCase(contentType.collectionName)}.input.ts`,
    generateContentTypeCreateAdminInputContent(contentType, contentTypesSchema),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/dto/update-${paramCase(contentType.collectionName)}.input.ts`,
    generateContentTypeUpdateInputContent(contentType, contentTypesSchema),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/dto/update-admin-${paramCase(contentType.collectionName)}.input.ts`,
    generateContentTypeUpdateAdminInputContent(contentType, contentTypesSchema),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/dto/index.ts`,
    generateContentTypeDtoIndexContent(contentType),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/index.ts`,
    generateContentTypeModuleIndexContent(contentType),
    {
      encoding: 'utf-8',
    },
  );
  fs.writeFileSync(
    `${rootFolder}/src/content-type/${paramCase(
      contentType.collectionName,
    )}/content-types/schema.json`,
    JSON.stringify(contentType),
    {
      encoding: 'utf-8',
    },
  );
  // importContentTypeIntoAppModule(rootFolder, contentType);
};

const generateContentTypeModuleContent = (contentType: CollationType) => {
  const template = `import { Module } from '@nestjs/common';
import { ${pascalCase(contentType.collectionName)}Service } from './${paramCase(
    contentType.collectionName,
  )}.service';
import { Admin${pascalCase(
    contentType.collectionName,
  )}Controller } from './admin-${paramCase(
    contentType.collectionName,
  )}.controller';
import { ${pascalCase(
    contentType.collectionName,
  )}Controller } from './${paramCase(contentType.collectionName)}.controller';


@Module({
  controllers: [Admin${pascalCase(
    contentType.collectionName,
  )}Controller,${pascalCase(contentType.collectionName)}Controller],
  providers: [${pascalCase(contentType.collectionName)}Service],
  exports: [${pascalCase(contentType.collectionName)}Service],
})
export class ${pascalCase(contentType.collectionName)}Module {}
`;
  return template;
};

const generateContentTypeControllerContent = (contentType: CollationType) => {
  const template = `
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import {
  OpenApiResponse,
  FindManyArgs,
  OpenApiPaginationResponse,
  FindOneArgs,
  SuccessResponseDto,
} from '@moonlightjs/common';
import { ${pascalCase(contentType.collectionName)}Dto } from './dto/${paramCase(
    contentType.collectionName,
  )}.dto';
import { ${pascalCase(contentType.collectionName)}Service } from './${paramCase(
    contentType.collectionName,
  )}.service';
import { Update${pascalCase(
    contentType.collectionName,
  )}Input } from './dto/update-${paramCase(contentType.collectionName)}.input';
import { Create${pascalCase(
    contentType.collectionName,
  )}Input } from './dto/create-${paramCase(contentType.collectionName)}.input';

@ApiTags('${paramCase(contentType.collectionName)}')
@Controller({
  path: '${paramCase(contentType.collectionName)}',
  version: '1',
})
// @UseGuards(JwtAuthGuard)
export class ${pascalCase(contentType.collectionName)}Controller {
  constructor(protected readonly ${camelCase(
    contentType.collectionName,
  )}Service: ${pascalCase(contentType.collectionName)}Service) {}

  @ApiBody({
    type: Create${pascalCase(contentType.collectionName)}Input,
  })
  @OpenApiResponse({
    status: HttpStatus.CREATED,
    model: ${pascalCase(contentType.collectionName)}Dto,
  })
  @Post()
  create(
    @Body() create${pascalCase(
      contentType.collectionName,
    )}Input: Create${pascalCase(contentType.collectionName)}Input,
    @Query() params: Omit<Prisma.${pascalCase(
      contentType.collectionName,
    )}CreateArgs, 'data'>,
  ) {
    return this.${camelCase(contentType.collectionName)}Service.create({
      ...params,
      data: {
        ...create${pascalCase(contentType.collectionName)}Input
      },
    });
  }

  @ApiQuery({
    type: FindManyArgs,
  })
  @OpenApiResponse({
    status: HttpStatus.OK,
    model: ${pascalCase(contentType.collectionName)}Dto,
    isArray: true,
  })
  @Get()
  findAll(@Query() params: Prisma.${pascalCase(
    contentType.collectionName,
  )}FindManyArgs) {
    return this.${camelCase(contentType.collectionName)}Service.findAll(params);
  }

  @ApiQuery({
    type: FindManyArgs,
  })
  @OpenApiPaginationResponse(${pascalCase(contentType.collectionName)}Dto)
  @Get('/pagination')
  findAllPagination(@Query() params: Prisma.${pascalCase(
    contentType.collectionName,
  )}FindManyArgs) {
    return this.${camelCase(
      contentType.collectionName,
    )}Service.findAllPagination(params);
  }

  @ApiQuery({
    type: FindOneArgs,
  })
  @OpenApiResponse({ status: HttpStatus.OK, model: ${pascalCase(
    contentType.collectionName,
  )}Dto })
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query() params: Prisma.${pascalCase(
      contentType.collectionName,
    )}FindUniqueArgs,
  ) {
    params.where = {
      id,
    };
    return this.${camelCase(contentType.collectionName)}Service.findOne(params);
  }

  @OpenApiResponse({ status: HttpStatus.OK, model: ${pascalCase(
    contentType.collectionName,
  )}Dto })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() update${pascalCase(
      contentType.collectionName,
    )}Input: Update${pascalCase(contentType.collectionName)}Input,
    @Query() params: Omit<Prisma.${pascalCase(
      contentType.collectionName,
    )}UpdateArgs, 'data' | 'where'>,
  ) {
    return this.${camelCase(contentType.collectionName)}Service.update({
      ...params,
      where: {
        id,
      },
      data: {
        ...update${pascalCase(contentType.collectionName)}Input,
      },
    });
  }

  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDto })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.${camelCase(contentType.collectionName)}Service.remove({
      id,
    });
  }
}
`;
  return template;
};

const generateContentTypeAdminControllerContent = (
  contentType: CollationType,
) => {
  const template = `
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import {
  OpenApiResponse,
  FindManyArgs,
  OpenApiPaginationResponse,
  FindOneArgs,
  SuccessResponseDto,
} from '@moonlightjs/common';
import { ${pascalCase(contentType.collectionName)}Service } from './${paramCase(
    contentType.collectionName,
  )}.service';
import { UpdateAdmin${pascalCase(
    contentType.collectionName,
  )}Input } from './dto/update-admin-${paramCase(
    contentType.collectionName,
  )}.input';
import { CreateAdmin${pascalCase(
    contentType.collectionName,
  )}Input } from './dto/create-admin-${paramCase(
    contentType.collectionName,
  )}.input';
import { Admin${pascalCase(
    contentType.collectionName,
  )}Dto } from './dto/admin-${paramCase(contentType.collectionName)}.dto';

@ApiTags('admin-content-type-${paramCase(contentType.collectionName)}')
@Controller({
  path: 'admin/content-type/${paramCase(contentType.collectionName)}',
  version: '1',
})
// @UseGuards(JwtAuthGuard)
export class Admin${pascalCase(contentType.collectionName)}Controller {
  constructor(protected readonly ${camelCase(
    contentType.collectionName,
  )}Service: ${pascalCase(contentType.collectionName)}Service) {}

  @ApiBody({
    type: CreateAdmin${pascalCase(contentType.collectionName)}Input,
  })
  @OpenApiResponse({
    status: HttpStatus.CREATED,
    model: Admin${pascalCase(contentType.collectionName)}Dto,
  })
  @Post()
  create(
    @Body() create${pascalCase(
      contentType.collectionName,
    )}Input: CreateAdmin${pascalCase(contentType.collectionName)}Input,
    @Query() params: Omit<Prisma.${pascalCase(
      contentType.collectionName,
    )}CreateArgs, 'data'>,
  ) {
    return this.${camelCase(contentType.collectionName)}Service.create({
      ...params,
      data: {
        ...create${pascalCase(contentType.collectionName)}Input
      },
    }, Admin${pascalCase(contentType.collectionName)}Dto);
  }

  @ApiQuery({
    type: FindManyArgs,
  })
  @OpenApiResponse({
    status: HttpStatus.OK,
    model: Admin${pascalCase(contentType.collectionName)}Dto,
    isArray: true,
  })
  @Get()
  findAll(@Query() params: Prisma.${pascalCase(
    contentType.collectionName,
  )}FindManyArgs) {
    return this.${camelCase(
      contentType.collectionName,
    )}Service.findAll(params, Admin${pascalCase(
    contentType.collectionName,
  )}Dto);
  }

  @ApiQuery({
    type: FindManyArgs,
  })
  @OpenApiPaginationResponse(Admin${pascalCase(contentType.collectionName)}Dto)
  @Get('/pagination')
  findAllPagination(@Query() params: Prisma.${pascalCase(
    contentType.collectionName,
  )}FindManyArgs) {
    return this.${camelCase(
      contentType.collectionName,
    )}Service.findAllPagination(params, Admin${pascalCase(
    contentType.collectionName,
  )}Dto);
  }

  @ApiQuery({
    type: FindOneArgs,
  })
  @OpenApiResponse({ status: HttpStatus.OK, model: Admin${pascalCase(
    contentType.collectionName,
  )}Dto })
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query() params: Prisma.${pascalCase(
      contentType.collectionName,
    )}FindUniqueArgs,
  ) {
    params.where = {
      id,
    };
    return this.${camelCase(
      contentType.collectionName,
    )}Service.findOne(params, Admin${pascalCase(
    contentType.collectionName,
  )}Dto);
  }

  ${
    contentType.options.draftAndPublish
      ? `@OpenApiResponse({ status: HttpStatus.OK, model: Admin${pascalCase(
          contentType.collectionName,
        )}Dto })
@Patch(':id/published')
published(@Param('id') id: string) {
  return this.${camelCase(contentType.collectionName)}Service.update(
    {
      where: {
        id,
      },
      data: {
        publishedAt: new Date(),
      },
    },
    Admin${pascalCase(contentType.collectionName)}Dto,
  );
}

@OpenApiResponse({ status: HttpStatus.OK, model: Admin${pascalCase(
          contentType.collectionName,
        )}Dto })
@Patch(':id/un-published')
unPublished(@Param('id') id: string) {
  return this.${camelCase(contentType.collectionName)}Service.update(
    {
      where: {
        id,
      },
      data: {
        publishedAt: null,
      },
    },
    Admin${pascalCase(contentType.collectionName)}Dto,
  );
}`
      : ''
  }
  @OpenApiResponse({ status: HttpStatus.OK, model: Admin${pascalCase(
    contentType.collectionName,
  )}Dto })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() update${pascalCase(
      contentType.collectionName,
    )}Input: UpdateAdmin${pascalCase(contentType.collectionName)}Input,
    @Query() params: Omit<Prisma.${pascalCase(
      contentType.collectionName,
    )}UpdateArgs, 'data' | 'where'>,
  ) {
    return this.${camelCase(contentType.collectionName)}Service.update({
      ...params,
      where: {
        id,
      },
      data: {
        ...update${pascalCase(contentType.collectionName)}Input,
      },
    }, Admin${pascalCase(contentType.collectionName)}Dto);
  }

  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDto })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.${camelCase(contentType.collectionName)}Service.remove({
      id,
    });
  }
}
`;
  return template;
};

const generateContentTypeServiceContent = (contentType: CollationType) => {
  const template = `
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PagedResultDto,
  Pagination,
  toDto,
  HttpErrorException,
} from '@moonlightjs/common';
import { PrismaService } from '@moonlightjs/common';
import { ${pascalCase(contentType.collectionName)}Dto } from './dto/${paramCase(
    contentType.collectionName,
  )}.dto';
import { Update${pascalCase(
    contentType.collectionName,
  )}Input } from './dto/update-${paramCase(contentType.collectionName)}.input';
import { Create${pascalCase(
    contentType.collectionName,
  )}Input } from './dto/create-${paramCase(contentType.collectionName)}.input';

const DEFAULT_SKIP = 0;
const DEFAULT_TAKE = 20;

@Injectable()
export class ${pascalCase(contentType.collectionName)}Service {
  constructor(
    protected prisma: PrismaService
  ) {}

  async findOne<TDto = any>(params: Prisma.${pascalCase(
    contentType.collectionName,
  )}FindFirstArgs, dtoType = ${pascalCase(
    contentType.collectionName,
  )}Dto) : Promise<TDto> {
    const ${camelCase(
      contentType.collectionName,
    )} = await this.prisma.${camelCase(
    contentType.collectionName,
  )}.findFirst(params);
    return toDto<TDto>(dtoType, ${camelCase(contentType.collectionName)});
  }

  async findAll<TDto = any>(params: Prisma.${pascalCase(
    contentType.collectionName,
  )}FindManyArgs, dtoType = ${pascalCase(
    contentType.collectionName,
  )}Dto): Promise<TDto[]> {
    params.skip = params.skip ?? DEFAULT_SKIP;
    params.take = params.take ?? DEFAULT_TAKE;
    const ${camelCase(
      contentType.collectionName,
    )}s = await this.prisma.${camelCase(
    contentType.collectionName,
  )}.findMany(params);
    return ${camelCase(contentType.collectionName)}s.map((${camelCase(
    contentType.collectionName,
  )}) => toDto<TDto>(dtoType, ${camelCase(contentType.collectionName)}));
  }

  async findAllPagination<TDto = any>(
    params: Prisma.${pascalCase(
      contentType.collectionName,
    )}FindManyArgs, dtoType = ${pascalCase(contentType.collectionName)}Dto
  ): Promise<PagedResultDto<TDto>> {
    params.skip = params.skip ?? DEFAULT_SKIP;
    params.take = params.take ?? DEFAULT_TAKE;
    const [${camelCase(
      contentType.collectionName,
    )}s, total] = await Promise.all([
      this.prisma.${camelCase(contentType.collectionName)}.findMany(params),
      this.prisma.${camelCase(contentType.collectionName)}.count({
        where: params.where,
      }),
    ]);
    return PagedResultDto.create({
      data: ${camelCase(contentType.collectionName)}s.map((${camelCase(
    contentType.collectionName,
  )}) => toDto<TDto>(dtoType, ${camelCase(contentType.collectionName)})),
      pagination: Pagination.create({
        take: params.take,
        skip: params.skip,
        total: total,
      }),
    });
  }

  async create<TDto = any>(params: Prisma.${pascalCase(
    contentType.collectionName,
  )}CreateArgs, dtoType = ${pascalCase(
    contentType.collectionName,
  )}Dto): Promise<TDto> {
    const ${camelCase(
      contentType.collectionName,
    )} = await this.prisma.${camelCase(
    contentType.collectionName,
  )}.create(params);
    return toDto<TDto>(dtoType, ${camelCase(contentType.collectionName)});
  }

  async update<TDto = any>(params: Prisma.${pascalCase(
    contentType.collectionName,
  )}UpdateArgs, dtoType = ${pascalCase(
    contentType.collectionName,
  )}Dto): Promise<TDto> {
    const ${camelCase(
      contentType.collectionName,
    )} = await this.prisma.${camelCase(
    contentType.collectionName,
  )}.update(params);
    return toDto<TDto>(dtoType, ${camelCase(contentType.collectionName)});
  }

  async remove(where: Prisma.${pascalCase(
    contentType.collectionName,
  )}WhereUniqueInput): Promise<boolean> {
    const ${camelCase(
      contentType.collectionName,
    )} = await this.prisma.${camelCase(contentType.collectionName)}.delete({
      where,
    });
    return !!${camelCase(contentType.collectionName)};
  }
}`;
  return template;
};

const generateContentTypeDtoContent = (
  contentType: CollationType,
  contentTypesSchema: Record<string, CollationType>,
) => {
  let attributeTxt = '';
  let enumImportTxt = '';
  let relationImportTxt = '';
  Object.keys(contentType.attributes).forEach((attributeName, index) => {
    const attribute = contentType.attributes[attributeName];
    if (attribute.private) {
      return;
    }

    if (attribute.type === 'enumeration') {
      enumImportTxt += `${pascalCase(contentType.collectionName)}${pascalCase(
        attributeName,
      )}Enum,`;
    }
    let typeRelation = '';
    let arrayTxt = '';
    if (attribute.type === 'relation') {
      const attrRelation = attribute as CollationTypeAttributeRelationInverse;
      const target = contentTypesSchema[attrRelation.target];
      typeRelation = `\n@Type(() => ${pascalCase(target.collectionName)}Dto)`;
      arrayTxt = ['oneToMany', 'manyToMany'].includes(attrRelation.relation)
        ? 'isArray: true,'
        : '';
      relationImportTxt += `import { ${pascalCase(
        target.collectionName,
      )}Dto } from '@content-type/${paramCase(
        target.collectionName,
      )}/dto/${paramCase(target.collectionName)}.dto';`;
    }
    if (index !== 0) attributeTxt += '\n';
    const property = `
@ApiProperty({ type: ${generateOpenApiType(attribute, contentTypesSchema)},${
      attribute.required ? 'required: true, ' : 'required: false, '
    }${attribute.required ? 'nullable: true, ' : 'nullable: false, '}${
      attribute.type === 'enumeration'
        ? ` enum: ${pascalCase(contentType.collectionName)}${pascalCase(
            attributeName,
          )}Enum,`
        : ''
    }${arrayTxt}})${typeRelation.length ? typeRelation : ''}
@Expose()
public readonly ${attributeName}: ${generateTypescriptType(
      attribute,
      attributeName,
      contentType.collectionName,
      contentTypesSchema,
    )};
`;
    attributeTxt += property;
  });
  const template = `
import { ApiProperty } from '@nestjs/swagger';
import { Nullable } from '@moonlightjs/common';
import { Expose, Type } from 'class-transformer';${
    relationImportTxt.length ? `\n${relationImportTxt}` : ''
  }${
    enumImportTxt.length
      ? `\nimport { ${enumImportTxt} } from './admin-${paramCase(
          contentType.collectionName,
        )}.dto';`
      : ''
  }
  

@Expose()
export class ${pascalCase(contentType.collectionName)}Dto {
  @ApiProperty({ type: 'string', required: true })
  @Expose()
  public readonly id: string;
  ${attributeTxt}
  ${
    contentType.options.softDelete
      ? `\n  @ApiProperty({ type: 'string', required: true })
@Expose()
public readonly publishedAt: string;`
      : ''
  }
}
`;
  return template;
};

const generateContentTypeAdminDtoContent = (
  contentType: CollationType,
  contentTypesSchema: Record<string, CollationType>,
) => {
  let attributeTxt = '';
  let enumTxt = '';
  let relationImportTxt = '';
  Object.keys(contentType.attributes).forEach((attributeName, index) => {
    const attribute = contentType.attributes[attributeName];

    if (attribute.type === 'enumeration') {
      const attributeEnum = attribute as CollationTypeAttributeEnumeration;
      enumTxt += `
export enum ${pascalCase(contentType.collectionName)}${pascalCase(
        attributeName,
      )}Enum {
  ${attributeEnum.enum
    .map((value) => {
      return `${constantCase(value)} = '${value}',`;
    })
    .join('\n')}
}`;
    }
    let typeRelation = '';
    let arrayTxt = '';
    if (attribute.type === 'relation') {
      const attrRelation = attribute as CollationTypeAttributeRelationInverse;
      const target = contentTypesSchema[attrRelation.target];
      typeRelation = `\n@Type(() => ${pascalCase(target.collectionName)}Dto)`;
      arrayTxt = ['oneToMany', 'manyToMany'].includes(attrRelation.relation)
        ? 'isArray: true,'
        : '';
      relationImportTxt += `import { ${pascalCase(
        target.collectionName,
      )}Dto } from '@content-type/${paramCase(
        target.collectionName,
      )}/dto/${paramCase(target.collectionName)}.dto';`;
    }
    if (index !== 0) attributeTxt += '\n';
    const property = `
@ApiProperty({ type: ${generateOpenApiType(attribute, contentTypesSchema)},${
      attribute.required ? 'required: true, ' : 'required: false, '
    }${attribute.required ? 'nullable: true, ' : 'nullable: false, '}${
      attribute.type === 'enumeration'
        ? ` enum: ${pascalCase(contentType.collectionName)}${pascalCase(
            attributeName,
          )}Enum,`
        : ''
    }${arrayTxt}})${typeRelation.length ? typeRelation : ''}
@Expose()
public readonly ${attributeName}: ${generateTypescriptType(
      attribute,
      attributeName,
      contentType.collectionName,
      contentTypesSchema,
    )};
`;
    attributeTxt += property;
  });
  const template = `
import { ApiProperty } from '@nestjs/swagger';
import { Nullable } from '@moonlightjs/common';
import { Expose, Type } from 'class-transformer';${
    relationImportTxt.length ? `\n${relationImportTxt}` : ''
  }

${enumTxt}

@Expose()
export class Admin${pascalCase(contentType.collectionName)}Dto {
  @ApiProperty({ type: 'string', required: true })
  @Expose()
  public readonly id: string;
  ${attributeTxt}
  ${
    contentType.options.draftAndPublish
      ? `\n  @ApiProperty({ type: 'string', required: true })
@Expose()
public readonly publishedAt: string;
@ApiProperty({ type: 'string', required: true, nullable: true })
@Expose()
public readonly publishedById: Nullable<string>;
@ApiProperty({ type: 'string', required: true, nullable: true })
@Expose()
public readonly publishedBy: Nullable<string>;`
      : ''
  }
  @ApiProperty({ type: 'string', required: true })
  @Expose()
  public readonly createdAt: string;
  @ApiProperty({ type: 'string', required: true, nullable: true })
  @Expose()
  public readonly createdById: Nullable<string>;
  @ApiProperty({ type: 'string', required: true, nullable: true })
  @Expose()
  public readonly createdBy: Nullable<string>;
  @ApiProperty({ type: 'string', required: true })
  @Expose()
  public readonly updatedAt: string;
  @ApiProperty({ type: 'string', required: true, nullable: true })
  @Expose()
  public readonly updatedById: Nullable<string>;
  @ApiProperty({ type: 'string', required: true, nullable: true })
  @Expose()
  public readonly updatedBy: Nullable<string>;${
    contentType.options.softDelete
      ? `\n  @ApiProperty({ type: 'string', required: true })
@Expose()
public readonly deletedAt: string;
@ApiProperty({ type: 'string', required: true, nullable: true })
@Expose()
public readonly deletedById: Nullable<string>;
@ApiProperty({ type: 'string', required: true, nullable: true })
@Expose()
public readonly deletedBy: Nullable<string>;`
      : ''
  }
}
`;
  return template;
};

const generateContentTypeCreateInputContent = (
  contentType: CollationType,
  contentTypesSchema: Record<string, CollationType>,
) => {
  let attributeTxt = '';
  let enumImportTxt = '';
  let relationTypeImportTxt = '';
  Object.keys(contentType.attributes).forEach((attributeName, index) => {
    const attribute = contentType.attributes[attributeName];

    if (attribute.type === 'enumeration') {
      enumImportTxt += `${pascalCase(contentType.collectionName)}${pascalCase(
        attributeName,
      )}Enum,`;
    }

    if (index !== 0) attributeTxt += '\n';
    let property;
    if (attribute.type !== 'relation') {
      property = `
@ApiProperty({ type: ${generateOpenApiType(
        attribute,
        contentTypesSchema,
        false,
      )},${attribute.required ? 'required: true, ' : 'required: false, '}${
        attribute.required ? 'nullable: true, ' : 'nullable: false, '
      }${
        attribute.type === 'enumeration'
          ? ` enum: ${pascalCase(contentType.collectionName)}${pascalCase(
              attributeName,
            )}Enum`
          : ''
      }})
${generateValidateType(attribute, attributeName, contentType.collectionName)}
${attribute.required ? '' : '@IsOptional()'}
@Expose()
public readonly ${attributeName}: ${generateTypescriptType(
        attribute,
        attributeName,
        contentType.collectionName,
        contentTypesSchema,
        false,
      )};
`;
    } else {
      const attrRelation = attribute as CollationTypeAttributeRelationInverse;
      const target = contentTypesSchema[attrRelation.target];
      relationTypeImportTxt += `${pascalCase(
        target.collectionName,
      )}CreateNested, `;
      property = `@ApiProperty({ required: true })
@ValidateNested()
@Type(() => ${pascalCase(target.collectionName)}CreateNested)
public readonly ${attributeName}: ${pascalCase(
        target.collectionName,
      )}CreateNested;`;
    }
    attributeTxt += property;
  });
  const template = `
import { ApiProperty } from '@nestjs/swagger';
import { IsDateStringISO, Nullable } from '@moonlightjs/common';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from 'class-validator';
${
  enumImportTxt.length
    ? `\nimport { ${enumImportTxt} } from './admin-${paramCase(
        contentType.collectionName,
      )}.dto';`
    : ''
}${
    relationTypeImportTxt.length
      ? `import { ${relationTypeImportTxt} } from './create-admin-${paramCase(
          contentType.collectionName,
        )}.input';`
      : ''
  }
@Expose()
export class Create${pascalCase(contentType.collectionName)}Input {
  ${attributeTxt}
}`;
  return template;
};

const generateContentTypeCreateAdminInputContent = (
  contentType: CollationType,
  contentTypesSchema: Record<string, CollationType>,
) => {
  let attributeTxt = '';
  let enumImportTxt = '';
  let relationTypeTxt = '';
  Object.keys(contentType.attributes).forEach((attributeName, index) => {
    const attribute = contentType.attributes[attributeName];

    if (attribute.type === 'enumeration') {
      enumImportTxt += `${pascalCase(contentType.collectionName)}${pascalCase(
        attributeName,
      )}Enum,`;
    }

    if (index !== 0) attributeTxt += '\n';
    let property;
    if (attribute.type !== 'relation') {
      property = `
@ApiProperty({ type: ${generateOpenApiType(
        attribute,
        contentTypesSchema,
        false,
      )},${attribute.required ? 'required: true, ' : 'required: false, '}${
        attribute.required ? 'nullable: true, ' : 'nullable: false, '
      }${
        attribute.type === 'enumeration'
          ? ` enum: ${pascalCase(contentType.collectionName)}${pascalCase(
              attributeName,
            )}Enum`
          : ''
      }})
${generateValidateType(attribute, attributeName, contentType.collectionName)}
${attribute.required ? '' : '@IsOptional()'}
@Expose()
public readonly ${attributeName}: ${generateTypescriptType(
        attribute,
        attributeName,
        contentType.collectionName,
        contentTypesSchema,
        false,
      )};
`;
    } else {
      const attrRelation = attribute as CollationTypeAttributeRelationInverse;
      const target = contentTypesSchema[attrRelation.target];
      relationTypeTxt += `export class ${pascalCase(target.collectionName)}Id {
@ApiProperty({ required: true })
@IsUUID()
@IsNotEmpty()
public readonly id: string;
}

export class ${pascalCase(target.collectionName)}CreateNested {
@ApiProperty({ required: true })
@ValidateNested()
@Type(() => ${pascalCase(target.collectionName)}Id)
public readonly connect: ${pascalCase(target.collectionName)}Id${
        ['manyToMany', 'oneToMany'].includes(attrRelation.relation) ? '[]' : ''
      };
}\n`;
      property = `@ApiProperty({ required: true })
@ValidateNested()
@Type(() => ${pascalCase(target.collectionName)}CreateNested)
public readonly ${attributeName}: ${pascalCase(
        target.collectionName,
      )}CreateNested;`;
    }
    attributeTxt += property;
  });
  const template = `
import { ApiProperty } from '@nestjs/swagger';
import { IsDateStringISO, Nullable } from '@moonlightjs/common';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from 'class-validator';
${
  enumImportTxt.length
    ? `\nimport { ${enumImportTxt} } from './admin-${paramCase(
        contentType.collectionName,
      )}.dto';`
    : ''
}

${relationTypeTxt}
@Expose()
export class CreateAdmin${pascalCase(contentType.collectionName)}Input {
  ${attributeTxt}
}`;
  return template;
};

const generateContentTypeUpdateInputContent = (
  contentType: CollationType,
  contentTypesSchema: Record<string, CollationType>,
) => {
  let manyToManyRelationAttr = '';
  let relationAttrImportTxt = '';
  let omitPropertyTxt = '';
  Object.keys(contentType.attributes).forEach((attributeName, index) => {
    if (index !== 0) manyToManyRelationAttr += '\n';
    const attribute = contentType.attributes[attributeName];
    if (attribute.type === 'relation') {
      const attrRelation = attribute as CollationTypeAttributeRelationInverse;
      const target = contentTypesSchema[attrRelation.target];
      if (['manyToMany', 'oneToMany'].includes(attrRelation.relation)) {
        manyToManyRelationAttr += `@ApiProperty({ required: ${
          attribute.required ? 'true' : 'false'
        } })
@ValidateNested()
@Type(() => ${pascalCase(target.collectionName)}UpdateNested)
@Expose()
public readonly ${pascalCase(attributeName)}: ${pascalCase(
          target.collectionName,
        )}UpdateNested;\n`;

        relationAttrImportTxt += `${pascalCase(
          target.collectionName,
        )}UpdateNested,`;
        omitPropertyTxt += `'${attributeName}',`;
      }
    }
  });
  const template = `
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Type, Expose } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Create${pascalCase(
    contentType.collectionName,
  )}Input } from './create-${paramCase(contentType.collectionName)}.input';
${
  relationAttrImportTxt.length
    ? `import { ${relationAttrImportTxt} } from './update-admin-${paramCase(
        contentType.collectionName,
      )}.input';`
    : ''
}

export class Update${pascalCase(
    contentType.collectionName,
  )}Input extends PartialType(${
    omitPropertyTxt.length
      ? `OmitType(Create${pascalCase(
          contentType.collectionName,
        )}Input, [${omitPropertyTxt}])`
      : `Create${pascalCase(contentType.collectionName)}Input`
  }) {

    ${manyToManyRelationAttr}
}
`;
  return template;
};

const generateContentTypeUpdateAdminInputContent = (
  contentType: CollationType,
  contentTypesSchema: Record<string, CollationType>,
) => {
  let manyToManyRelationAttr = '';
  let relationAttrTxt = '';
  let targetIdTxt = '';
  let omitPropertyTxt = '';
  Object.keys(contentType.attributes).forEach((attributeName, index) => {
    if (index !== 0) manyToManyRelationAttr += '\n';
    const attribute = contentType.attributes[attributeName];
    if (attribute.type === 'relation') {
      const attrRelation = attribute as CollationTypeAttributeRelationInverse;
      const target = contentTypesSchema[attrRelation.target];
      if (['manyToMany', 'oneToMany'].includes(attrRelation.relation)) {
        manyToManyRelationAttr += `@ApiProperty({ required: ${
          attribute.required ? 'true' : 'false'
        } })
@ValidateNested()
@Type(() => ${pascalCase(target.collectionName)}UpdateNested)
@Expose()
public readonly ${pascalCase(attributeName)}: ${pascalCase(
          target.collectionName,
        )}UpdateNested;\n`;

        relationAttrTxt += `
        export class ${pascalCase(target.collectionName)}UpdateNested {
@ApiProperty({ required: false, isArray: true, type: ${pascalCase(
          target.collectionName,
        )}Id })
@ValidateNested({ each: true })
@IsArray()
@IsOptional()
@Type(() => ${pascalCase(target.collectionName)}Id)
set?: ${pascalCase(target.collectionName)}Id[];
@ApiProperty({ required: false, isArray: true, type: ${pascalCase(
          target.collectionName,
        )}Id })
@ValidateNested({ each: true })
@IsArray()
@IsOptional()
@Type(() => ${pascalCase(target.collectionName)}Id)
disconnect?: ${pascalCase(target.collectionName)}Id[];
@ApiProperty({ required: false, isArray: true, type: ${pascalCase(
          target.collectionName,
        )}Id })
@ValidateNested({ each: true })
@IsArray()
@IsOptional()
@Type(() => ${pascalCase(target.collectionName)}Id)
delete?: ${pascalCase(target.collectionName)}Id[];
@ApiProperty({ required: false, isArray: true, type: ${pascalCase(
          target.collectionName,
        )}Id })
@ValidateNested({ each: true })
@IsArray()
@IsOptional()
@Type(() => ${pascalCase(target.collectionName)}Id)
connect?:${pascalCase(target.collectionName)}Id[];
        }`;
        targetIdTxt += `${pascalCase(target.collectionName)}Id,`;
        omitPropertyTxt += `'${attributeName}',`;
      }
    }
  });
  const template = `
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Type, Expose } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { CreateAdmin${pascalCase(
    contentType.collectionName,
  )}Input, ${targetIdTxt} } from './create-admin-${paramCase(
    contentType.collectionName,
  )}.input';

${relationAttrTxt}

export class UpdateAdmin${pascalCase(
    contentType.collectionName,
  )}Input extends PartialType(${
    omitPropertyTxt.length
      ? `OmitType(CreateAdmin${pascalCase(
          contentType.collectionName,
        )}Input, [${omitPropertyTxt}])`
      : `CreateAdmin${pascalCase(contentType.collectionName)}Input`
  }) {

    ${manyToManyRelationAttr}
}
`;
  return template;
};

const generateTypescriptType = (
  attribute: CollationTypeAttribute,
  attributeName: string,
  modelName: string,
  contentTypesSchema: Record<string, CollationType>,
  isDto = true,
) => {
  let type = '';
  switch (attribute.type) {
    case 'string':
    case 'password':
    case 'text':
    case 'richtext':
      type = 'string';
      break;
    case 'integer':
    case 'bigint':
    case 'float':
    case 'decimal':
      type = 'number';
      break;
    case 'boolean':
      type = 'boolean';
      break;
    case 'json':
      type = 'any';
      break;
    case 'date':
    case 'datetime':
    case 'time':
      type = 'string';
      break;
    case 'enumeration':
      type = `${pascalCase(modelName)}${pascalCase(attributeName)}Enum`;
      break;
    case 'relation':
      const attrRelation = attribute as CollationTypeAttributeRelationInverse;
      const target = contentTypesSchema[attrRelation.target];
      const array = ['oneToMany', 'manyToMany'].includes(attrRelation.relation)
        ? '[]'
        : '';
      return isDto ? `${pascalCase(target.collectionName)}Dto${array}` : '';
    default:
      throw new BadRequestException(
        `Current attribute type ${attribute.type} is not supported`,
      );
  }
  return attribute.required ? type : `Nullable<${type}>`;
};

const generateOpenApiType = (
  attribute: CollationTypeAttribute,
  contentTypesSchema: Record<string, CollationType>,
  isDto = true,
) => {
  switch (attribute.type) {
    case 'string':
    case 'password':
    case 'text':
    case 'richtext':
      return `'string'`;
    case 'integer':
    case 'bigint':
    case 'float':
    case 'decimal':
      return `'number'`;
    case 'boolean':
      return `'boolean'`;
    case 'json':
      return `'object'`;
    case 'date':
    case 'datetime':
    case 'time':
      return `'string'`;
    case 'enumeration':
      return `'string'`;
    case 'relation':
      const attrRelation = attribute as CollationTypeAttributeRelationInverse;
      const target = contentTypesSchema[attrRelation.target];
      return isDto ? `() => ${pascalCase(target.collectionName)}Dto` : '';
    default:
      throw new BadRequestException(
        `Current attribute type ${attribute.type} is not supported`,
      );
  }
};

const generateValidateType = (
  attribute: CollationTypeAttribute,
  attributeName: string,
  modelName: string,
) => {
  switch (attribute.type) {
    case 'string': {
      const attrStr = attribute as CollationTypeAttributeString;
      return `${
        attrStr.regex ? `@Matches(${new RegExp(attrStr.regex)})\n` : ''
      }${attrStr.required ? '@IsNotEmpty()\n' : ''}@MaxLength(${
        attrStr.maxLength ?? 255
      })${attrStr.minLength ? `\n@MinLength(${attrStr.minLength})` : ''}
@IsString()`;
    }
    case 'password': {
      return `@MaxLength(255)
@IsString()`;
    }
    case 'text':
    case 'richtext': {
      const attrStr = attribute as CollationTypeAttributeString;
      return `${
        attrStr.regex ? `@Matches(${new RegExp(attrStr.regex)})\n` : ''
      }${attrStr.required ? '@IsNotEmpty()\n' : ''}${
        attrStr.maxLength ? `@MaxLength(${attrStr.maxLength})\n` : ''
      }${attrStr.minLength ? `\n@MinLength(${attrStr.minLength})` : ''}
@IsString()`;
    }
    case 'integer':
    case 'bigint': {
      const attrNumber = attribute as CollationTypeAttributeNumber;
      return `${attrNumber.max ? `@Max(${attrNumber.max})\n` : ''}${
        attrNumber.min ? `@Min(${attrNumber.min})\n` : ''
      }@IsInt()`;
    }
    case 'float': {
      const attrNumber = attribute as CollationTypeAttributeNumber;
      return `${attrNumber.max ? `@Max(${attrNumber.max})\n` : ''}${
        attrNumber.min ? `@Min(${attrNumber.min})\n` : ''
      }@IsNumber()`;
    }
    case 'decimal': {
      const attrDecimal = attribute as CollationTypeAttributeDecimal;
      return `${attrDecimal.max ? `@Max(${attrDecimal.max})\n` : ''}${
        attrDecimal.min ? `@Min(${attrDecimal.min})\n` : ''
      }@IsNumber({ maxDecimalPlaces: ${attrDecimal.scale}})`;
    }
    case 'boolean':
      return '@IsBoolean()';
    case 'json':
      return '@IsObject()';
    case 'date':
    case 'datetime':
    case 'time':
      return '@IsDateStringISO()';
    case 'enumeration':
      return `@IsEnum(${pascalCase(modelName)}${pascalCase(
        attributeName,
      )}Enum)`;
    default:
      throw new BadRequestException(
        `Current attribute type ${attribute.type} is not supported`,
      );
  }
};

const generateContentTypeDtoIndexContent = (contentType: CollationType) => {
  const template = `export * from './create-${paramCase(
    contentType.collectionName,
  )}.input';
export * from './update-${paramCase(contentType.collectionName)}.input';
export * from './admin-${paramCase(contentType.collectionName)}.dto';
export * from './create-admin-${paramCase(contentType.collectionName)}.input';
export * from './update-admin-${paramCase(contentType.collectionName)}.input';
export * from './${paramCase(contentType.collectionName)}.dto';`;
  return template;
};

const generateContentTypeModuleIndexContent = (contentType: CollationType) => {
  const template = `export * from './dto';
export * from './admin-${paramCase(contentType.collectionName)}.controller';
export * from './${paramCase(contentType.collectionName)}.controller';
export * from './${paramCase(contentType.collectionName)}.service';`;
  return template;
};

function importContentTypeIntoAppModule(
  rootFolder: string,
  contentType: CollationType,
) {
  const appModulePath = path.join(rootFolder, 'src/app.module.ts');
  let appModuleContent = fs.readFileSync(appModulePath, {
    encoding: 'utf8',
  });
  const importStr = `import { ${pascalCase(
    contentType.collectionName,
  )}Module } from '@content-type/${paramCase(
    contentType.collectionName,
  )}/${paramCase(contentType.collectionName)}.module';`;
  const moduleName = `${pascalCase(contentType.collectionName)}Module`;
  if (!appModuleContent.includes(moduleName)) {
    const regex = /@Module\({\n  imports: \[([a-zA-Z0-9,\s.()]*)\]/gm;
    const m = regex.exec(appModuleContent);
    if (m && m.length > 1) {
      const text = m[1];
      appModuleContent =
        appModuleContent.slice(
          0,
          appModuleContent.indexOf(text) + text.length,
        ) +
        `${text.trim().endsWith(',') ? '' : ','}\n    ` +
        moduleName +
        ',\n' +
        appModuleContent.slice(appModuleContent.indexOf(text) + text.length);
    }
  }
  if (!appModuleContent.includes(importStr)) {
    const regex = /import [a-zA-Z0-9, .(){}''""@\/\-_]*;/gm;
    let m;
    let t;

    while ((m = regex.exec(appModuleContent)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      t = m;
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
    }
    if (t) {
      appModuleContent =
        appModuleContent.slice(
          0,
          appModuleContent.indexOf(t[0]) + t[0].length,
        ) +
        '\n' +
        importStr +
        appModuleContent.slice(appModuleContent.indexOf(t[0]) + t[0].length);
    }
  }
  fs.writeFileSync(`${appModulePath}`, appModuleContent, {
    encoding: 'utf-8',
  });
}

// refactor
const generateContentTypeAttributeStringDto = (
  attributeName: string,
  attribute: CollationTypeAttribute,
  contentType: CollationType,
) => {
  const attrStr = attribute as CollationTypeAttributeString;
  return `@ApiProperty({ type: 'string', required: true, nullable: ${
    attrStr.required ? 'true' : 'false'
  }, ${attrStr.minLength ? `minLength: ${attrStr.minLength}, ` : ''}${
    attrStr.maxLength ? `maxLength: ${attrStr.maxLength}, ` : ''
  } })
@Expose()
public readonly ${attributeName}: ${
    attrStr.required ? 'string' : ' Nullable<string>'
  };`;
};

const generateContentTypeAttributeNumberDto = (
  attributeName: string,
  attribute: CollationTypeAttribute,
  contentType: CollationType,
) => {
  const attrNum = attribute as CollationTypeAttributeNumber;
  return `@ApiProperty({ type: 'number', required: true, nullable: ${
    attrNum.required ? 'true' : 'false'
  }, ${attrNum.min ? `minimum: ${attrNum.min}, ` : ''}${
    attrNum.max ? `maximum: ${attrNum.max}, ` : ''
  }})
@Expose()
public readonly ${attributeName}: ${
    attrNum.required ? 'number' : ' Nullable<number>'
  };`;
};

const generateContentTypeAttributeBoolenDto = (
  attributeName: string,
  attribute: CollationTypeAttribute,
  contentType: CollationType,
) => {
  const attrNum = attribute as CollationTypeAttributeBoolean;
  return `@ApiProperty({ type: 'number', required: true, nullable: ${
    attrNum.required ? 'true' : 'false'
  }})
@Expose()
public readonly ${attributeName}: ${
    attrNum.required ? 'boolean' : ' Nullable<boolean>'
  };`;
};

const generateContentTypeAttributeEnumDto = (
  attributeName: string,
  attribute: CollationTypeAttribute,
  contentType: CollationType,
) => {
  const attrNum = attribute as CollationTypeAttributeBoolean;
  return `@ApiProperty({ type: 'number', required: true, nullable: ${
    attrNum.required ? 'true' : 'false'
  }})
@Expose()
public readonly ${attributeName}: ${
    attrNum.required ? 'boolean' : ' Nullable<boolean>'
  };`;
};
