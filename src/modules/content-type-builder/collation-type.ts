import { Nullable } from '@moonlightjs/common';
export class CollationTypeInfo {
  public singularName: string;
  public pluralName: string;
  public displayName: string;
  public description: string;
}

export class CollationTypeOptions {
  public draftAndPublish: boolean;
  public softDelete: boolean;
}

export type CollationTypeAttributeTypeCommon =
  | 'string'
  | 'text'
  | 'password'
  | 'richtext'
  | 'integer'
  | 'bigint'
  | 'float'
  | 'decimal'
  | 'enumeration'
  | 'date'
  | 'datetime'
  | 'time'
  | 'boolean'
  | 'json';

export type CollationTypeAttributeTypeRelation = 'relation';

export type CollationTypeAttributeTypeMedia = 'media';

export type CollationTypeAttributeType =
  | CollationTypeAttributeTypeCommon
  | CollationTypeAttributeTypeRelation
  | CollationTypeAttributeTypeMedia;

export class CollationTypeAttributeBase {
  public type: CollationTypeAttributeType;
  public required: boolean;
  public unique: boolean;
  public configurable: boolean;
  public writable: boolean;
  public visible: boolean;
  public private: boolean;
}

export class CollationTypeAttributeCommonBase extends CollationTypeAttributeBase {
  public type: CollationTypeAttributeTypeCommon;
  public default: any;
}

export class CollationTypeAttributeString extends CollationTypeAttributeCommonBase {
  public regex?: Nullable<string>;
  public minLength: number;
  public maxLength: number;
  public default: string;
}

export class CollationTypeAttributeNumber extends CollationTypeAttributeCommonBase {
  public min?: Nullable<number>;
  public max?: Nullable<number>;
  public default: number;
}

export class CollationTypeAttributeDecimal extends CollationTypeAttributeCommonBase {
  public min: number;
  public max: number;
  public precision: number;
  public scale: number;
  public default: number;
}

export class CollationTypeAttributeBoolean extends CollationTypeAttributeCommonBase {
  public default: boolean;
}

export class CollationTypeAttributeEnumeration extends CollationTypeAttributeCommonBase {
  public enum: string[];
  public default: string;
}

export class CollationTypeAttributeDate extends CollationTypeAttributeCommonBase {
  public default: string;
}

export type CollationTypeAttributeCommon =
  | CollationTypeAttributeString
  | CollationTypeAttributeNumber
  | CollationTypeAttributeDecimal
  | CollationTypeAttributeBoolean
  | CollationTypeAttributeEnumeration;

export type RelationType =
  | 'oneToOne'
  | 'manyToOne'
  | 'oneToMany'
  | 'manyToMany';

export class CollationTypeAttributeRelationBase extends CollationTypeAttributeBase {
  public type: CollationTypeAttributeTypeRelation;
  public relation: RelationType;
  public target: string;
  public targetAttribute: string;
}

export class CollationTypeAttributeRelationInverse extends CollationTypeAttributeRelationBase {
  public inversedBy: string;
}

export class CollationTypeAttributeRelationMapped extends CollationTypeAttributeRelationBase {
  public mappedBy: string;
}

export type CollationTypeAttributeRelation =
  | CollationTypeAttributeRelationInverse
  | CollationTypeAttributeRelationMapped;

export enum AllowedTypeEnum {
  'images',
  'files',
  'videos',
  'audios',
}

export class CollationTypeAttributeMediaBase extends CollationTypeAttributeBase {
  public type: CollationTypeAttributeTypeMedia;
  public multiple: boolean;
  public allowedTypes: AllowedTypeEnum[];
}

export type CollationTypeAttribute =
  | CollationTypeAttributeCommon
  | CollationTypeAttributeRelation
  | CollationTypeAttributeMediaBase;

export class CollationType {
  public uid: string;
  public collectionName: string;
  public info: CollationTypeInfo;
  public options: CollationTypeOptions;
  public attributes: Record<string, CollationTypeAttribute>;
}
