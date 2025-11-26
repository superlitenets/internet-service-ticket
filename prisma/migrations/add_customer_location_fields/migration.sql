-- Add location fields to Customer table
ALTER TABLE "Customer" ADD COLUMN "location" TEXT;
ALTER TABLE "Customer" ADD COLUMN "apartment" TEXT;
ALTER TABLE "Customer" ADD COLUMN "roomNumber" TEXT;
ALTER TABLE "Customer" ADD COLUMN "streetAddress" TEXT;
