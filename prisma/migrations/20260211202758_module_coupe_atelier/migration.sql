-- CreateEnum
CREATE TYPE "OrderFileType" AS ENUM ('BON_COMMANDE', 'MODELE', 'MESURES', 'IMAGE', 'AUTRE');

-- AlterTable
ALTER TABLE "CutStep" ADD COLUMN     "receivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cuttingReceivedAt" TIMESTAMP(3),
ADD COLUMN     "sentToCuttingAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "OrderAttachment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "OrderFileType" NOT NULL DEFAULT 'AUTRE',
    "title" TEXT,
    "url" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderMeasurements" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "dataJson" TEXT NOT NULL DEFAULT '{}',
    "takenByDept" TEXT,
    "takenById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderMeasurements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderAttachment_orderId_createdAt_idx" ON "OrderAttachment"("orderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrderMeasurements_orderId_key" ON "OrderMeasurements"("orderId");

-- AddForeignKey
ALTER TABLE "OrderAttachment" ADD CONSTRAINT "OrderAttachment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAttachment" ADD CONSTRAINT "OrderAttachment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderMeasurements" ADD CONSTRAINT "OrderMeasurements_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderMeasurements" ADD CONSTRAINT "OrderMeasurements_takenById_fkey" FOREIGN KEY ("takenById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
