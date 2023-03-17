import {
  CollationType,
  CollationTypeAttribute,
  CollationTypeAttributeBoolean,
  CollationTypeAttributeDate,
  CollationTypeAttributeDecimal,
  CollationTypeAttributeEnumeration,
  CollationTypeAttributeNumber,
  CollationTypeAttributeRelationBase,
  CollationTypeAttributeString,
} from '@modules/content-type-builder/collation-type';
import * as fs from 'fs-extra';

import { BadRequestException } from '@nestjs/common';
import { camelCase, pascalCase } from 'change-case';

export const generateContentTypeSchema = (
  contentTypesSchema: Record<string, CollationType>,
) => {
  const rootFolder = process.env.INIT_CWD;
  try {
    // remove schema file if it exists
    fs.removeSync(`${rootFolder}/prisma/schemas/content-type-builder.prisma`);
  } catch (err) {
    console.warn(err);
  }

  fs.mkdirSync(`${rootFolder}/prisma/schemas`, {
    recursive: true,
  });
  let content = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native"]
}  

`;
  Object.keys(contentTypesSchema).forEach((contentTypeId) => {
    content +=
      generateContentTypeSchemaContent(
        contentTypesSchema[contentTypeId],
        contentTypesSchema,
      ) + '\n';
  });
  fs.writeFileSync(
    `${rootFolder}/prisma/schemas/content-type-builder.prisma`,
    content,
    {
      encoding: 'utf-8',
    },
  );
};

const generateContentTypeSchemaContent = (
  contentType: CollationType,
  contentTypesSchema: Record<string, CollationType>,
) => {
  let schemaAttribute = '';
  let enumTxt = '';
  Object.keys(contentType.attributes).forEach((attributeName, index) => {
    const attribute = contentType.attributes[attributeName];

    if (attribute.type === 'enumeration') {
      const attributeEnum = attribute as CollationTypeAttributeEnumeration;
      enumTxt += `\n
enum ${pascalCase(contentType.collectionName)}${pascalCase(attributeName)} {
  ${attributeEnum.enum.join('\n  ')}
}`;
    }
    if (index !== 0) schemaAttribute += '\n';
    let property = '';
    if (attribute.type === 'relation') {
      property = generateSchemeAttributeRelationType(
        attributeName,
        attribute,
        contentType.collectionName,
        contentTypesSchema,
      );
    } else {
      property = `  ${attributeName} `;
      property +=
        ' ' +
        generateSchemeAttributeType(
          attribute,
          attributeName,
          contentType.collectionName,
        );
      property += '' + generateSchemeAttributeRequired(attribute.required);
      property += ' ' + generateSchemeAttributeNativeType(attribute);
    }
    schemaAttribute += property;
  });
  const schemaTemplate = `
${enumTxt}
model ${pascalCase(contentType.collectionName)} {
  id String @id @default(uuid()) @db.Uuid()
    
${schemaAttribute}
  ${
    contentType.options.draftAndPublish
      ? `\n  publishedAt          DateTime?                 @db.Timestamptz()
publishedById        String?                   @db.Uuid()
publishedBy          String?`
      : ''
  }
  createdAt          DateTime                  @default(now()) @db.Timestamptz()
  createdById        String?                   @db.Uuid()
  createdBy          String?
  updatedAt          DateTime                  @updatedAt @db.Timestamptz()
  updatedById        String?                   @db.Uuid()
  updatedBy          String?${
    contentType.options.softDelete
      ? `\n  deletedAt          DateTime?                 @db.Timestamptz()
deletedById        String?                   @db.Uuid()
deletedBy          String?`
      : ''
  }
}
`;
  return schemaTemplate;
};

const generateSchemeAttributeRelationType = (
  attributeName: string,
  attribute: CollationTypeAttribute,
  modelName: string,
  contentTypesSchema: Record<string, CollationType>,
) => {
  const attrRelation = attribute as CollationTypeAttributeRelationBase;
  const target = contentTypesSchema[attrRelation.target];
  if (!target) {
    throw new BadRequestException(`target: ${target} not found in schema`);
  }
  switch (attrRelation.relation) {
    case 'oneToOne':
      if ((attrRelation as any).mappedBy) {
        return `${attributeName} ${pascalCase(target.collectionName)}${
          attrRelation.required ? '' : '?'
        }`;
      }
      return `${camelCase(target.collectionName)}Id String${
        attrRelation.required ? '' : '?'
      }  @unique @db.Uuid()
${attributeName}   ${pascalCase(
        target.collectionName,
      )} @relation(fields: [${camelCase(
        target.collectionName,
      )}Id], references: [id])`;
    case 'oneToMany':
      return `${attributeName} ${pascalCase(target.collectionName)}[]`;
    case 'manyToOne':
      return `${camelCase(target.collectionName)}Id        String${
        attrRelation.required ? '' : '?'
      }   @db.Uuid()
      ${attributeName} ${pascalCase(
        target.collectionName,
      )}? @relation(fields: [${camelCase(
        target.collectionName,
      )}Id], references: [id])`;
    case 'manyToMany':
      let relationName = '';
      if (modelName > target.collectionName) {
        relationName = `${pascalCase(modelName)}${pascalCase(
          target.collectionName,
        )}Relation`;
      } else {
        relationName = `${pascalCase(target.collectionName)}${pascalCase(
          modelName,
        )}Relation`;
      }
      return `${attributeName} pascalCase(
        target.collectionName,
      )}[] @relation("${relationName}")`;
  }
};

const generateSchemeAttributeType = (
  attribute: CollationTypeAttribute,
  attributeName: string,
  modelName: string,
) => {
  switch (attribute.type) {
    case 'string':
    case 'password':
    case 'text':
    case 'richtext':
      return 'String';
    case 'integer':
      return 'Int';
    case 'bigint':
      return 'BigInt';
    case 'float':
      return 'Float';
    case 'decimal':
      return 'Decimal';
    case 'boolean':
      return 'Boolean';
    case 'json':
      return 'Json';
    case 'date':
    case 'datetime':
    case 'time':
      return 'DateTime';
    case 'enumeration':
      return `${pascalCase(modelName)}${pascalCase(attributeName)}`;
    case 'relation':
      return '';
    default:
      throw new BadRequestException(
        `Current attribute type ${attribute.type} is not supported`,
      );
  }
};

const generateSchemeAttributeRequired = (required: boolean) => {
  if (required) {
    return '';
  }
  return '?';
};

const generateSchemeAttributeNativeType = (
  attribute: CollationTypeAttribute,
) => {
  switch (attribute.type) {
    case 'string': {
      let txt = '@db.VarChar(255)';
      const attributeStr = attribute as CollationTypeAttributeString;
      if (attributeStr.maxLength) {
        txt = `@db.VarChar(${attributeStr.maxLength})`;
      }
      if (attributeStr.unique) {
        txt += ' @unique';
      }
      if (attributeStr.default) {
        txt += ` @default("${attributeStr.default}")`;
      }
      return txt;
    }
    case 'password':
      return '@db.VarChar(255)';
    case 'text':
    case 'richtext': {
      let txt = '@db.Text';
      const attributeStr = attribute as CollationTypeAttributeString;
      if (attributeStr.unique) {
        txt += ' @unique';
      }
      if (attributeStr.default) {
        txt += ` @default("${attributeStr.default}")`;
      }
      return txt;
    }
    case 'integer': {
      let txt = '';
      const attributeNumber = attribute as CollationTypeAttributeNumber;
      if (attributeNumber.unique) {
        txt += ' @unique';
      }
      if (attributeNumber.default) {
        txt += ` @default(${attributeNumber.default})`;
      }
      return txt;
    }
    case 'bigint': {
      let txt = '';
      const attributeNumber = attribute as CollationTypeAttributeNumber;
      if (attributeNumber.unique) {
        txt += ' @unique';
      }
      if (attributeNumber.default) {
        txt += ` @default(${attributeNumber.default})`;
      }
      return txt;
    }
    case 'float': {
      let txt = '';
      const attributeNumber = attribute as CollationTypeAttributeNumber;
      if (attributeNumber.unique) {
        txt += ' @unique';
      }
      if (attributeNumber.default) {
        txt += ` @default(${attributeNumber.default})`;
      }
      return txt;
    }
    case 'decimal': {
      const attributeDecimal = attribute as CollationTypeAttributeDecimal;
      let txt = `@db.Decimal(${attributeDecimal.precision}, ${attributeDecimal.scale})`;
      if (attributeDecimal.unique) {
        txt += ' @unique';
      }
      if (attributeDecimal.default) {
        txt += ` @default(${attributeDecimal.default})`;
      }
      return txt;
    }
    case 'boolean': {
      let txt = '';
      const attributeBoolean = attribute as CollationTypeAttributeBoolean;
      if (attributeBoolean.unique) {
        txt += ' @unique';
      }
      if (attributeBoolean.default) {
        txt += ` @default(${attributeBoolean.default})`;
      }
      return txt;
    }
    case 'json':
      return '@db.JsonB';
    case 'date': {
      let txt = '@db.Date';
      const attributeBoolean = attribute as CollationTypeAttributeDate;
      if (attributeBoolean.unique) {
        txt += ' @unique';
      }
      if (attributeBoolean.default) {
        txt += ` @default(${attributeBoolean.default})`;
      }
      return txt;
    }
    case 'datetime': {
      let txt = '@db.Timestamp()';
      const attributeBoolean = attribute as CollationTypeAttributeDate;
      if (attributeBoolean.unique) {
        txt += ' @unique';
      }
      if (attributeBoolean.default) {
        txt += ` @default(${attributeBoolean.default})`;
      }
      return txt;
    }
    case 'time': {
      let txt = '@db.Time()';
      const attributeBoolean = attribute as CollationTypeAttributeDate;
      if (attributeBoolean.unique) {
        txt += ' @unique';
      }
      if (attributeBoolean.default) {
        txt += ` @default(${attributeBoolean.default})`;
      }
      return txt;
    }
    case 'enumeration':
      let txt = '';
      const attributeEnum = attribute as CollationTypeAttributeEnumeration;
      if (attributeEnum.unique) {
        txt += ' @unique';
      }
      if (attributeEnum.default) {
        txt += ` @default(${attributeEnum.default})`;
      }
      return txt;
    case 'relation':
      return '';
    default:
      throw new BadRequestException('Current attribute type is not supported');
  }
};
