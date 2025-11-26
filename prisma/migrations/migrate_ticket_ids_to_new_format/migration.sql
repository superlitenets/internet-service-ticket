-- Add a temporary column to store old ticket IDs
ALTER TABLE "Ticket" ADD COLUMN "oldTicketId" TEXT;

-- Copy current ticketId values to oldTicketId for reference
UPDATE "Ticket" SET "oldTicketId" = "ticketId";

-- Create app settings for ticket prefix if not exists
INSERT INTO "AppSettings" (id, key, value, category, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'ticket_prefix',
  'TKT',
  'ticket',
  NOW(),
  NOW()
)
ON CONFLICT ("key") DO NOTHING;

-- Initialize ticket counter based on count of existing tickets
INSERT INTO "AppSettings" (id, key, value, category, "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'ticket_counter',
  (COUNT(*))::text,
  'ticket',
  NOW(),
  NOW()
FROM "Ticket"
ON CONFLICT ("key") DO NOTHING;

-- Update ticketId with new format: prefix + padded number
-- This assigns sequential numbers starting from 1
WITH numbered_tickets AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) as new_number
  FROM "Ticket"
)
UPDATE "Ticket"
SET "ticketId" = 'TKT' || LPAD(CAST(nt.new_number AS VARCHAR), 6, '0')
FROM numbered_tickets nt
WHERE "Ticket".id = nt.id;
