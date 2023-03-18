import {
  CollationType,
  CollationTypeAttributeRelationInverse,
  CollationTypeAttributeRelationMapped,
} from '@modules/content-type-builder/collation-type';
import { CreateContentTypeBuilderInput } from '@modules/content-type-builder/dto/create-content-type-builder.input';
import { UpdateContentTypeBuilderInput } from '@modules/content-type-builder/dto/update-content-type-builder.input';
import { generateContentTypesModule } from '@modules/content-type-builder/generate-content-type-module';
import { generateContentTypeSchema } from '@modules/content-type-builder/generate-content-type-schema';
import { isDevelopment, PrismaService } from '@moonlightjs/common';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ContentType } from '@prisma/client';
import { camelCase, paramCase, pascalCase } from 'change-case';
import { exec, spawn, SpawnOptions } from 'child_process';
import * as fs from 'fs-extra';
import { readdir, readFile } from 'fs/promises';
import * as path from 'path';
import * as util from 'util';

const {
  MigrateDev,
  MigrateDeploy,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
} = require('@modules/content-type-builder/packages/prisma');

declare const module: any;

const getDirectories = async (source: string) =>
  (await readdir(source, { withFileTypes: true }))
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

const execPromise = util.promisify(exec);

const spawnPromise = (
  command: string,
  args: readonly string[],
  options: SpawnOptions,
) => {
  return new Promise((resolve, reject) => {
    const shell = spawn(command, args, options);
    shell.on('error', (error) => {
      console.log(`error: ${error.message}`);
      reject(error);
    });
    shell.on('close', (code) => {
      console.log(`[shell] ${command} terminated :`, code);
      resolve(null);
    });
  });
};
@Injectable()
export class ContentTypeBuilderService implements OnModuleInit {
  constructor(protected prisma: PrismaService) {}

  private async shutdown() {
    // perform any cleanup tasks here
    await this.cleanup();
    // signal webpack that the module is disposed
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    module.hot.dispose(() => {});
    // trigger a full reload of the application
    module.hot.accept(() => window.location.reload());
  }

  private async cleanup() {
    // perform any cleanup tasks here
  }

  async get() {
    const data = await this.prisma.contentType.findFirst();
    if (!(data && data.contentTypesSchema)) {
      throw new NotFoundException();
    }
    return data.contentTypesSchema as unknown as Record<string, CollationType>;
  }

  async onModuleInit() {
    if (isDevelopment()) {
      const migrateDev = MigrateDev.new();
      await migrateDev.parse(['--force']);
    } else {
      const migrateDeploy = MigrateDeploy.new();
      await migrateDeploy.parse([]);
    }

    const rootFolder = process.env.INIT_CWD as string;
    let listPathFolderContentTypes: string[] = [];
    try {
      listPathFolderContentTypes = await getDirectories(
        `${rootFolder}/src/content-type`,
      );
    } catch (error) {
      listPathFolderContentTypes = [];
    }
    const data = await this.prisma.contentType.findFirst();
    let contentTypesSchema: Record<string, CollationType>;
    if (data && data.contentTypesSchema) {
      contentTypesSchema = data.contentTypesSchema as unknown as Record<
        string,
        CollationType
      >;
    } else {
      contentTypesSchema = {};
    }
    await Promise.all(
      listPathFolderContentTypes.map(async (contentTypePath) => {
        const schema = await readFile(
          `${rootFolder}/src/content-type/${contentTypePath}/content-types/schema.json`,
          'utf8',
        );
        const contentType: CollationType = JSON.parse(schema);
        contentTypesSchema[contentType.uid] = contentType;
      }),
    );
    if (data) {
      await this.prisma.contentType.update({
        where: {
          id: data.id,
        },
        data: {
          contentTypesSchema: contentTypesSchema as any,
        },
      });
    } else {
      await this.prisma.contentType.create({
        data: {
          contentTypesSchema: contentTypesSchema as any,
        },
      });
    }
  }

  async update(uid: string, input: UpdateContentTypeBuilderInput) {
    const data = await this.prisma.contentType.findFirst();
    if (!(data && data.contentTypesSchema)) {
      throw new BadRequestException();
    }
    const contentTypesSchema: Record<string, CollationType> =
      data.contentTypesSchema as unknown as Record<string, CollationType>;

    if (!(uid in contentTypesSchema)) {
      throw new NotFoundException('content type not found');
    }
    const contentType: CollationType = {
      attributes: input.attributes,
      collectionName: input.collectionName,
      info: {
        description: input.description,
        displayName: input.displayName,
        pluralName: input.pluralName,
        singularName: input.singularName,
      },
      options: {
        draftAndPublish: input.draftAndPublish,
        softDelete: input.softDelete,
      },
      uid,
    };
    await this.process(uid, contentType, contentTypesSchema, data, true);
    this.shutdown();
  }

  async create(input: CreateContentTypeBuilderInput) {
    let data = await this.prisma.contentType.findFirst();
    let contentTypesSchema: Record<string, CollationType>;
    if (data && data.contentTypesSchema) {
      contentTypesSchema = data.contentTypesSchema as unknown as Record<
        string,
        CollationType
      >;
    } else {
      contentTypesSchema = {};
    }
    const uid = `api::${paramCase(input.collectionName)}`;
    if (uid in contentTypesSchema) {
      throw new BadRequestException('Content type already defined');
    }
    const contentType: CollationType = {
      attributes: input.attributes,
      collectionName: input.collectionName,
      info: {
        description: input.description,
        displayName: input.displayName,
        pluralName: input.pluralName,
        singularName: input.singularName,
      },
      options: {
        draftAndPublish: input.draftAndPublish,
        softDelete: input.softDelete,
      },
      uid,
    };

    data = await this.process(uid, contentType, contentTypesSchema, data);
    this.shutdown();
    return data;
  }

  async delete(uid: string) {
    const data = await this.prisma.contentType.findFirst();
    if (!(data && data.contentTypesSchema)) {
      throw new BadRequestException();
    }
    const contentTypesSchema: Record<string, CollationType> =
      data.contentTypesSchema as unknown as Record<string, CollationType>;

    if (uid in contentTypesSchema) {
      await this.handleDelete(uid, contentTypesSchema, data);
    } else {
      throw new NotFoundException(`Not found content type ${uid}`);
    }
    this.shutdown();
  }

  async process(
    uid: string,
    contentType: CollationType,
    contentTypesSchema: Record<string, CollationType>,
    data: ContentType | null,
    isUpdate = false,
  ) {
    let result = data;
    Object.keys(contentType.attributes).forEach((attributeName) => {
      const attribute = contentType.attributes[attributeName];
      if (attribute.type === 'relation') {
        const attrRelation = attribute as CollationTypeAttributeRelationInverse;
        attrRelation.inversedBy = attributeName;
        const target = contentTypesSchema[attrRelation.target];
        if (!target)
          throw new BadRequestException(
            `${attrRelation.target} does not exist`,
          );
        switch (attrRelation.relation) {
          case 'oneToOne':
            const oneToOneRelation: CollationTypeAttributeRelationMapped = {
              configurable: attrRelation.configurable,
              private: attrRelation.private,
              relation: 'oneToOne',
              required: attrRelation.required,
              target: uid,
              targetAttribute: attributeName,
              type: 'relation',
              unique: attrRelation.unique,
              visible: attrRelation.visible,
              writable: attrRelation.writable,
              mappedBy: attributeName,
            };
            target.attributes[attrRelation.targetAttribute] = oneToOneRelation;
            break;
          case 'manyToOne':
            const oneToManyRelation: CollationTypeAttributeRelationMapped = {
              configurable: attrRelation.configurable,
              private: attrRelation.private,
              relation: 'oneToMany',
              required: attrRelation.required,
              target: uid,
              targetAttribute: attributeName,
              type: 'relation',
              unique: attrRelation.unique,
              visible: attrRelation.visible,
              writable: attrRelation.writable,
              mappedBy: attributeName,
            };
            target.attributes[attrRelation.targetAttribute] = oneToManyRelation;
            break;
          case 'oneToMany':
            const manyToOneRelation: CollationTypeAttributeRelationMapped = {
              configurable: attrRelation.configurable,
              private: attrRelation.private,
              relation: 'manyToOne',
              required: attrRelation.required,
              target: uid,
              targetAttribute: attributeName,
              type: 'relation',
              unique: attrRelation.unique,
              visible: attrRelation.visible,
              writable: attrRelation.writable,
              mappedBy: attributeName,
            };
            target.attributes[attrRelation.targetAttribute] = manyToOneRelation;
            break;
          case 'manyToMany':
            const manyToManyRelation: CollationTypeAttributeRelationMapped = {
              configurable: attrRelation.configurable,
              private: attrRelation.private,
              relation: 'manyToMany',
              required: attrRelation.required,
              target: uid,
              targetAttribute: attributeName,
              type: 'relation',
              unique: attrRelation.unique,
              visible: attrRelation.visible,
              writable: attrRelation.writable,
              mappedBy: attributeName,
            };
            target.attributes[attrRelation.targetAttribute] =
              manyToManyRelation;
            break;
        }
      }
    });
    contentTypesSchema[uid] = contentType;
    if (result) {
      result.contentTypesSchema = contentTypesSchema as any;
      await this.prisma.contentType.update({
        where: {
          id: result.id,
        },
        data: {
          contentTypesSchema: contentTypesSchema as any,
        },
      });
    } else {
      result = await this.prisma.contentType.create({
        data: {
          contentTypesSchema: contentTypesSchema as any,
        },
      });
    }

    generateContentTypeSchema(contentTypesSchema);
    generateContentTypesModule(contentTypesSchema);

    const rootFolder = process.env.INIT_CWD as string;

    const execAurora = await execPromise(`cd ${rootFolder} && npm run aurora`);

    console.log('stdout:', execAurora.stdout);
    console.log('stderr:', execAurora.stderr);

    const migrateDev = MigrateDev.new();
    await migrateDev.parse([
      '-n',
      `${isUpdate ? 'update' : 'create'}-${paramCase(
        contentType.collectionName,
      )}-model`,
      '--force',
    ]);

    const execFormat = await execPromise(`cd ${rootFolder} && npm run format`);

    console.log('stdout:', execFormat.stdout);
    console.log('stderr:', execFormat.stderr);

    return result;
  }

  async handleDelete(
    uid: string,
    contentTypesSchema: Record<string, CollationType>,
    data: ContentType | null,
  ) {
    let result = data;
    const contentType = contentTypesSchema[uid];
    Object.keys(contentType.attributes).forEach((attributeName) => {
      const attribute = contentType.attributes[attributeName];
      if (attribute.type === 'relation') {
        const attrRelation = attribute as CollationTypeAttributeRelationInverse;
        attrRelation.inversedBy = attributeName;
        const target = contentTypesSchema[attrRelation.target];
        if (!target)
          throw new BadRequestException(
            `${attrRelation.target} does not exist`,
          );
        delete target.attributes[attrRelation.targetAttribute];
      }
    });
    delete contentTypesSchema[uid];
    if (result) {
      result.contentTypesSchema = contentTypesSchema as any;
      await this.prisma.contentType.update({
        where: {
          id: result.id,
        },
        data: {
          contentTypesSchema: contentTypesSchema as any,
        },
      });
    } else {
      result = await this.prisma.contentType.create({
        data: {
          contentTypesSchema: contentTypesSchema as any,
        },
      });
    }
    const rootFolder = process.env.INIT_CWD as string;

    // remove content-type folder
    try {
      fs.removeSync(
        `${rootFolder}/src/content-type/${paramCase(
          contentType.collectionName,
        )}`,
      );
    } catch (err) {
      console.warn(err);
    }

    generateContentTypeSchema(contentTypesSchema);
    generateContentTypesModule(contentTypesSchema);
    // this.removeImportFromAppModule(rootFolder, contentType);

    const execAurora = await execPromise(`cd ${rootFolder} && npm run aurora`);

    console.log('stdout:', execAurora.stdout);
    console.log('stderr:', execAurora.stderr);

    const migrateDev = MigrateDev.new();
    await migrateDev.parse([
      '-n',
      `delete-${paramCase(contentType.collectionName)}-model`,
      '--force',
    ]);

    const execFormat = await execPromise(`cd ${rootFolder} && npm run format`);

    console.log('stdout:', execFormat.stdout);
    console.log('stderr:', execFormat.stderr);
    return result;
  }

  removeImportFromAppModule(rootFolder: string, contentType: CollationType) {
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
    appModuleContent = appModuleContent.replace(importStr, '');
    appModuleContent = appModuleContent.replace(moduleName + ',', '');
    appModuleContent = appModuleContent.replace(moduleName, '');
    fs.writeFileSync(`${appModulePath}`, appModuleContent, {
      encoding: 'utf-8',
    });
  }
}
