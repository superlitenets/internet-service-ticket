-- Create TicketComment table for discussions
CREATE TABLE "TicketComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE CASCADE,
    CONSTRAINT "TicketComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- Create TicketTask table for subtasks
CREATE TABLE "TicketTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedTo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "estimatedHours" DOUBLE PRECISION,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TicketTask_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE CASCADE,
    CONSTRAINT "TicketTask_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User" ("id")
);

-- Create TimeLog table for time tracking
CREATE TABLE "TimeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TimeLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TicketTask" ("id") ON DELETE SET NULL,
    CONSTRAINT "TimeLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE CASCADE,
    CONSTRAINT "TimeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- Create ActivityLog table for audit trail
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "changes" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE CASCADE,
    CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL
);

-- Create SLAPolicy table
CREATE TABLE "SLAPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "priority" TEXT NOT NULL,
    "responseTimeHours" INTEGER NOT NULL,
    "resolutionTimeHours" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create PerformanceMetric table for reporting
CREATE TABLE "PerformanceMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "employeeName" TEXT,
    "period" TIMESTAMP(3) NOT NULL,
    "ticketsHandled" INTEGER NOT NULL DEFAULT 0,
    "ticketsResolved" INTEGER NOT NULL DEFAULT 0,
    "ticketsOverdue" INTEGER NOT NULL DEFAULT 0,
    "avgResolutionHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHoursLogged" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "slaCompliancePercent" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "customerSatisfaction" DOUBLE PRECISION,
    "taskCompletionPercent" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PerformanceMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE,
    CONSTRAINT "PerformanceMetric_userId_period_key" UNIQUE("userId", "period")
);

-- Add new columns to Ticket table
ALTER TABLE "Ticket" ADD COLUMN "slaPolicyId" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "firstResponseAt" TIMESTAMP(3);
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_slaPolicyId_fkey" FOREIGN KEY ("slaPolicyId") REFERENCES "SLAPolicy" ("id") ON DELETE SET NULL;

-- Create indexes
CREATE INDEX "TicketComment_ticketId_idx" ON "TicketComment"("ticketId");
CREATE INDEX "TicketComment_userId_idx" ON "TicketComment"("userId");
CREATE INDEX "TicketTask_ticketId_idx" ON "TicketTask"("ticketId");
CREATE INDEX "TicketTask_assignedTo_idx" ON "TicketTask"("assignedTo");
CREATE INDEX "TicketTask_status_idx" ON "TicketTask"("status");
CREATE INDEX "TimeLog_ticketId_idx" ON "TimeLog"("ticketId");
CREATE INDEX "TimeLog_taskId_idx" ON "TimeLog"("taskId");
CREATE INDEX "TimeLog_userId_idx" ON "TimeLog"("userId");
CREATE INDEX "TimeLog_date_idx" ON "TimeLog"("date");
CREATE INDEX "ActivityLog_ticketId_idx" ON "ActivityLog"("ticketId");
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");
CREATE INDEX "SLAPolicy_priority_idx" ON "SLAPolicy"("priority");
CREATE INDEX "PerformanceMetric_userId_idx" ON "PerformanceMetric"("userId");
CREATE INDEX "PerformanceMetric_period_idx" ON "PerformanceMetric"("period");
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");
CREATE INDEX "Ticket_priority_idx" ON "Ticket"("priority");
CREATE INDEX "Ticket_createdAt_idx" ON "Ticket"("createdAt");
CREATE INDEX "Ticket_slaPolicyId_idx" ON "Ticket"("slaPolicyId");
