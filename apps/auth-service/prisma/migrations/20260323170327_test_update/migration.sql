/*
  Warnings:

  - Added the required column `test` to the `auth_users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "auth_users" ADD COLUMN     "test" TEXT NOT NULL;
