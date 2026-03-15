/*
  Warnings:

  - The values [BON_COMMANDE,MODELE,MESURES,AUTRE] on the enum `OrderFileType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderFileType_new" AS ENUM ('PDF', 'IMAGE', 'WORD', 'EXCEL', 'OTHER');
ALTER TABLE "public"."OrderAttachment" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "OrderAttachment" ALTER COLUMN "type" TYPE "OrderFileType_new" USING ("type"::text::"OrderFileType_new");
ALTER TYPE "OrderFileType" RENAME TO "OrderFileType_old";
ALTER TYPE "OrderFileType_new" RENAME TO "OrderFileType";
DROP TYPE "public"."OrderFileType_old";
ALTER TABLE "OrderAttachment" ALTER COLUMN "type" SET DEFAULT 'OTHER';
COMMIT;

-- AlterTable
ALTER TABLE "OrderAttachment" ALTER COLUMN "type" SET DEFAULT 'OTHER';
