// Task Management
export interface TicketTask {
  id: string;
  ticketId: string;
  title: string;
  description?: string;
  assignedTo?: string;
  status: "open" | "in-progress" | "completed" | "blocked";
  priority: "low" | "medium" | "high" | "critical";
  estimatedHours?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    name?: string;
    email: string;
  };
  timeLogs?: TimeLog[];
}

// Time Logging
export interface TimeLog {
  id: string;
  taskId?: string;
  ticketId: string;
  userId: string;
  hours: number;
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
}

// Comments
export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
}

// Activity Log
export interface ActivityLog {
  id: string;
  ticketId: string;
  userId?: string;
  action: string;
  changes?: string;
  description?: string;
  createdAt: string;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
}

// SLA Policy
export interface SLAPolicy {
  id: string;
  name: string;
  description?: string;
  priority: string;
  responseTimeHours: number;
  resolutionTimeHours: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Performance Metrics
export interface PerformanceMetric {
  id: string;
  userId: string;
  employeeName?: string;
  period: string;
  ticketsHandled: number;
  ticketsResolved: number;
  ticketsOverdue: number;
  avgResolutionHours: number;
  totalHoursLogged: number;
  slaCompliancePercent: number;
  customerSatisfaction?: number;
  taskCompletionPercent: number;
  createdAt: string;
  updatedAt: string;
}

// Task Management APIs
export async function createTask(
  ticketId: string,
  data: {
    title: string;
    description?: string;
    assignedTo?: string;
    priority?: string;
    estimatedHours?: number;
  },
): Promise<TicketTask> {
  const response = await fetch(`/api/tickets/${ticketId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create task");
  }

  const result = await response.json();
  return result.task || result;
}

export async function getTasks(ticketId: string): Promise<TicketTask[]> {
  const response = await fetch(`/api/tickets/${ticketId}/tasks`);

  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }

  const result = await response.json();
  return result.tasks || result;
}

export async function updateTask(
  taskId: string,
  data: Partial<TicketTask>,
): Promise<TicketTask> {
  const response = await fetch(`/api/tickets/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update task");
  }

  const result = await response.json();
  return result.task || result;
}

export async function deleteTask(taskId: string): Promise<void> {
  const response = await fetch(`/api/tickets/tasks/${taskId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete task");
  }
}

// Time Logging APIs
export async function logTime(data: {
  taskId?: string;
  ticketId: string;
  userId: string;
  hours: number;
  description?: string;
}): Promise<TimeLog> {
  const response = await fetch("/api/tickets/time-logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to log time");
  }

  const result = await response.json();
  return result.timeLog || result;
}

export async function getTimeLogs(
  ticketId: string,
): Promise<{ timeLogs: TimeLog[]; totalHours: number }> {
  const response = await fetch(`/api/tickets/${ticketId}/time-logs`);

  if (!response.ok) {
    throw new Error("Failed to fetch time logs");
  }

  return response.json();
}

// Comment APIs
export async function addComment(
  ticketId: string,
  data: {
    userId: string;
    content: string;
    isInternal?: boolean;
  },
): Promise<TicketComment> {
  const response = await fetch(`/api/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to add comment");
  }

  const result = await response.json();
  return result.comment || result;
}

export async function getComments(
  ticketId: string,
  internalOnly = false,
): Promise<TicketComment[]> {
  const url = `/api/tickets/${ticketId}/comments${internalOnly ? "?internalOnly=true" : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch comments");
  }

  const result = await response.json();
  return result.comments || result;
}

// Activity Log APIs
export async function getActivityLog(ticketId: string): Promise<ActivityLog[]> {
  const response = await fetch(`/api/tickets/${ticketId}/activity`);

  if (!response.ok) {
    throw new Error("Failed to fetch activity log");
  }

  const result = await response.json();
  return result.activities || result;
}

// SLA and Performance APIs
export async function getSLAPolicies(): Promise<SLAPolicy[]> {
  const response = await fetch("/api/sla/policies");

  if (!response.ok) {
    throw new Error("Failed to fetch SLA policies");
  }

  const result = await response.json();
  return result.policies || result;
}

export async function getEmployeePerformance(
  userId: string,
  period?: string,
): Promise<PerformanceMetric[]> {
  const url = `/api/performance/employee/${userId}${period ? `?period=${period}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch performance metrics");
  }

  const result = await response.json();
  return result.metrics || result;
}

export async function getTeamPerformance(period?: string): Promise<{
  metrics: PerformanceMetric[];
  teamTotals: {
    totalTicketsHandled: number;
    totalTicketsResolved: number;
    avgResolutionTime: number;
    avgSLACompliance: number;
    totalHoursLogged: number;
  };
}> {
  const url = `/api/performance/team${period ? `?period=${period}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch team performance report");
  }

  return response.json();
}

// Utility function to calculate SLA compliance
export function calculateSLACompliance(
  createdAt: Date,
  resolvedAt: Date | null,
  slaHours: number,
): boolean {
  if (!resolvedAt) return true; // Not yet resolved
  const hours = (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  return hours <= slaHours;
}

// Utility function to format duration
export function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  } else if (hours < 24) {
    return `${Math.round(hours)} h`;
  } else {
    return `${Math.round(hours / 24)} days`;
  }
}
