/*
  Warnings:

  - You are about to drop the column `refresh_token` on the `auth_sessions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[provider,provider_id]` on the table `auth_users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `auth_roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refresh_token_hash` to the `auth_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `auth_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `auth_verification_tokens` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `auth_verification_tokens` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AuthRoleName" AS ENUM ('student', 'instructor', 'admin');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('email_verification', 'password_reset');

-- AlterTable
ALTER TABLE "auth_roles" DROP COLUMN "name",
ADD COLUMN     "name" "AuthRoleName" NOT NULL;

-- AlterTable
ALTER TABLE "auth_sessions" DROP COLUMN "refresh_token",
ADD COLUMN     "refresh_token_hash" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "auth_users" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "auth_verification_tokens" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "TokenType" NOT NULL;

-- CreateTable
CREATE TABLE "auth_user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "auth_user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateIndex
CREATE INDEX "auth_user_roles_user_id_idx" ON "auth_user_roles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_roles_name_key" ON "auth_roles"("name");

-- CreateIndex
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_users_provider_provider_id_key" ON "auth_users"("provider", "provider_id");

-- CreateIndex
CREATE INDEX "auth_verification_tokens_user_id_idx" ON "auth_verification_tokens"("user_id");

-- AddForeignKey
ALTER TABLE "auth_user_roles" ADD CONSTRAINT "auth_user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_user_roles" ADD CONSTRAINT "auth_user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "auth_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
