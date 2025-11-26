export interface TimeLog {
  id: string;
  ticketId: string;
  taskId?: string;
  userId: string;
  hours: number;
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface LogTimeRequest {
  ticketId: string;
  taskId?: string;
  userId: string;
  hours: number;
  description?: string;
  date?: string;
}

export async function logTime(data: LogTimeRequest): Promise<TimeLog> {
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

export async function getTimeLogs(ticketId: string): Promise<TimeLog[]> {
  const response = await fetch(`/api/tickets/${ticketId}/time-logs`);

  if (!response.ok) {
    throw new Error("Failed to fetch time logs");
  }

  const result = await response.json();
  return result.timeLogs || result;
}

export async function deleteTimeLog(timeLogId: string): Promise<void> {
  const response = await fetch(`/api/tickets/time-logs/${timeLogId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete time log");
  }
}

export function formatHours(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (wholeHours === 0) {
    return `${minutes}m`;
  }
  
  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  
  return `${wholeHours}h ${minutes}m`;
}

export function getTotalHours(timeLogs: TimeLog[]): number {
  return timeLogs.reduce((sum, log) => sum + log.hours, 0);
}

export function getTeamMemberTotal(
  timeLogs: TimeLog[],
  userId: string
): number {
  return timeLogs
    .filter((log) => log.userId === userId)
    .reduce((sum, log) => sum + log.hours, 0);
}
