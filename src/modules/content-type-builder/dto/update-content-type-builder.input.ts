import { CollationTypeAttribute } from '@modules/content-type-builder/collation-type';

export class UpdateContentTypeBuilderInput {
  public readonly singularName: string;
  public readonly pluralName: string;
  public readonly displayName: string;
  public readonly description: string;
  public readonly draftAndPublish: boolean;
  public readonly softDelete: boolean;
  public readonly collectionName: string;
  public readonly attributes: Record<string, CollationTypeAttribute>;
}
