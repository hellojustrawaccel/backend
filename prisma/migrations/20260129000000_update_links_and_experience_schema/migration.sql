-- AlterTable Links: rename name to title, description to icon, add order
ALTER TABLE "links" RENAME COLUMN "name" TO "title";
ALTER TABLE "links" RENAME COLUMN "description" TO "icon";
ALTER TABLE "links" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable Experiences: rename role to title, startedAt to startDate, endedAt to endDate
-- Add description, current, order fields
-- Make url and color optional
ALTER TABLE "experiences" RENAME COLUMN "role" TO "title";
ALTER TABLE "experiences" RENAME COLUMN "started_at" TO "start_date";
ALTER TABLE "experiences" RENAME COLUMN "ended_at" TO "end_date";
ALTER TABLE "experiences" ADD COLUMN "description" TEXT;
ALTER TABLE "experiences" ADD COLUMN "current" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "experiences" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "experiences" ALTER COLUMN "url" DROP NOT NULL;
ALTER TABLE "experiences" ALTER COLUMN "color" DROP NOT NULL;
