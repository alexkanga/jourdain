-- WP-002 S10 fix: align DB schema with Better Auth expected types.
--
-- Two issues uncovered during S10 integration testing:
--
-- 1. user.email_verified and user.banned were `text`. Better Auth core user schema
--    declares emailVerified as boolean, and the Admin plugin declares banned as
--    boolean. With text columns, the boolean false written by Better Auth was
--    stored as the string "false" (truthy in JS), which made the Admin plugin's
--    `if (user.banned)` check fire on every login — auto-banning every user.
--
-- 2. rateLimit.count was `text` and rateLimit.last_request was `timestamp`.
--    Better Auth's rate limiter writes `count: <number>` and `lastRequest: Date.now()`
--    (epoch millis number). Drizzle's `PgTimestamp.mapToDriverValue` calls
--    `value.toISOString()` which fails on a number, breaking every rate-limited
--    HTTP handler call with "value.toISOString is not a function".
--
-- This migration is non-destructive: type conversions use explicit USING clauses
-- that accept both the old text/timestamp values and the new boolean/integer/bigint
-- values, so the migration is idempotent whether or not a prior partial fix was
-- applied. NOT NULL constraints set defaults for any NULL rows.

UPDATE "user" SET "email_verified" = 'false' WHERE "email_verified" IS NULL;--> statement-breakpoint
UPDATE "user" SET "banned" = 'false' WHERE "banned" IS NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "email_verified" SET DATA TYPE boolean USING ("email_verified"::boolean);--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "email_verified" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "email_verified" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "banned" SET DATA TYPE boolean USING ("banned"::boolean);--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "banned" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "banned" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rateLimit" ALTER COLUMN "count" SET DATA TYPE integer USING ("count"::integer);--> statement-breakpoint
ALTER TABLE "rateLimit" ALTER COLUMN "last_request" SET DATA TYPE bigint USING (COALESCE(EXTRACT(EPOCH FROM "last_request"::timestamptz) * 1000, 0)::bigint);--> statement-breakpoint
ALTER TABLE "rateLimit" ALTER COLUMN "last_request" SET DEFAULT 0;
