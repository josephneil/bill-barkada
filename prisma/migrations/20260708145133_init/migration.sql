-- CreateEnum
CREATE TYPE "TipMode" AS ENUM ('AMOUNT', 'PERCENT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'UNPAID');

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "paidByPersonId" TEXT,
    "serviceChargePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tipMode" "TipMode" NOT NULL DEFAULT 'AMOUNT',
    "tipAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tipPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "publicShareId" TEXT NOT NULL,
    "editTokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillItem" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BillItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillItemShare" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,

    CONSTRAINT "BillItemShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bill_publicShareId_key" ON "Bill"("publicShareId");

-- CreateIndex
CREATE INDEX "Person_billId_idx" ON "Person"("billId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_billId_clientId_key" ON "Person"("billId", "clientId");

-- CreateIndex
CREATE INDEX "BillItem_billId_idx" ON "BillItem"("billId");

-- CreateIndex
CREATE UNIQUE INDEX "BillItem_billId_clientId_key" ON "BillItem"("billId", "clientId");

-- CreateIndex
CREATE INDEX "BillItemShare_personId_idx" ON "BillItemShare"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "BillItemShare_itemId_personId_key" ON "BillItemShare"("itemId", "personId");

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_paidByPersonId_fkey" FOREIGN KEY ("paidByPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillItem" ADD CONSTRAINT "BillItem_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillItemShare" ADD CONSTRAINT "BillItemShare_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "BillItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillItemShare" ADD CONSTRAINT "BillItemShare_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
