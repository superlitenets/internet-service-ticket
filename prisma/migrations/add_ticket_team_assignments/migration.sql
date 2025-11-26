-- Add team assignment fields to Ticket
ALTER TABLE "Ticket" ADD COLUMN "teamGroupId" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "assignedTeamMemberId" TEXT;

-- Create indexes for the new columns
CREATE INDEX "Ticket_teamGroupId_idx" ON "Ticket"("teamGroupId");
CREATE INDEX "Ticket_assignedTeamMemberId_idx" ON "Ticket"("assignedTeamMemberId");

-- Add foreign key constraints
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_teamGroupId_fkey" FOREIGN KEY ("teamGroupId") REFERENCES "TeamGroup"("id") ON DELETE SET NULL;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedTeamMemberId_fkey" FOREIGN KEY ("assignedTeamMemberId") REFERENCES "TeamMember"("id") ON DELETE SET NULL;

-- Add relations to TeamGroup and TeamMember for the reverse relation
-- Note: In Prisma, these are implicit once the foreign key is created
