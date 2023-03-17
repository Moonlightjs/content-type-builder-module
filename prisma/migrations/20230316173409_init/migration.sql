-- CreateTable
CREATE TABLE "ContentType" (
    "id" UUID NOT NULL,
    "contentTypesSchema" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "updatedById" UUID,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMPTZ,
    "deletedById" UUID,
    "deletedBy" TEXT,

    CONSTRAINT "ContentType_pkey" PRIMARY KEY ("id")
);
