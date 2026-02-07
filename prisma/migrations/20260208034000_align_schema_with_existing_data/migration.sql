-- Align existing database objects with current Prisma schema while preserving data.

-- feature_flags.name (required in schema, missing in initial migration)
ALTER TABLE "feature_flags"
ADD COLUMN IF NOT EXISTS "name" TEXT;

UPDATE "feature_flags"
SET "name" = COALESCE(NULLIF("name", ''), NULLIF("description", ''), "key", "id")
WHERE "name" IS NULL OR "name" = '';

ALTER TABLE "feature_flags"
ALTER COLUMN "name" SET NOT NULL;

-- audit_logs changes between initial migration and current schema
ALTER TABLE "audit_logs"
ALTER COLUMN "entityId" DROP NOT NULL;

ALTER TABLE "audit_logs"
DROP COLUMN IF EXISTS "changes";

ALTER TABLE "audit_logs"
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'success';

-- idempotency_keys additions in current schema
ALTER TABLE "idempotency_keys"
ADD COLUMN IF NOT EXISTS "key" TEXT;

ALTER TABLE "idempotency_keys"
ADD COLUMN IF NOT EXISTS "statusCode" INTEGER NOT NULL DEFAULT 200;

UPDATE "idempotency_keys"
SET "key" = COALESCE(NULLIF("key", ''), 'legacy-' || "id")
WHERE "key" IS NULL OR "key" = '';

ALTER TABLE "idempotency_keys"
ALTER COLUMN "key" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "idempotency_keys_key_key" ON "idempotency_keys"("key");
CREATE INDEX IF NOT EXISTS "idempotency_keys_key_idx" ON "idempotency_keys"("key");
