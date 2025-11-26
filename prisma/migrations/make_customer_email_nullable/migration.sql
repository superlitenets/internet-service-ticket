-- Make email field nullable in Customer table
ALTER TABLE "Customer" ALTER COLUMN "email" DROP NOT NULL;
