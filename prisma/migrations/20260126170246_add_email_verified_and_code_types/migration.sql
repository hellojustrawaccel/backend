-- AlterTable
ALTER TABLE "login_codes" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'login';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "login_codes_type_idx" ON "login_codes"("type");
