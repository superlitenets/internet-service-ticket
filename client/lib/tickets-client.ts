export interface Ticket {
  id: string;
  ticketId: string;
  customerId: string;
  userId?: string | null;
  subject: string;
  description: string;
  category?: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in-progress" | "pending" | "resolved" | "closed";
  resolution?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  user?: {
    id: string;
    name?: string;
    email: string;
  };
}

export interface TicketStats {
  total: number;
  byStatus: {
    open: number;
    inProgress: number;
    pending: number;
    resolved: number;
  };
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Create a new ticket
 */
export async function createTicket(data: {
  customerId: string;
  userId?: string;
  subject: string;
  description: string;
  category?: string;
  priority?: "low" | "medium" | "high";
  status?: "open" | "in-progress" | "pending";
}): Promise<Ticket> {
  const response = await fetch("/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create ticket");
  }

  const result = await response.json();
  return result.ticket;
}

/**
 * Get all tickets with optional filters
 */
export async function getTickets(filters?: {
  status?: string;
  priority?: string;
  customerId?: string;
  userId?: string;
}): Promise<Ticket[]> {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.status) params.append("status", filters.status);
    if (filters.priority) params.append("priority", filters.priority);
    if (filters.customerId) params.append("customerId", filters.customerId);
    if (filters.userId) params.append("userId", filters.userId);
  }

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`/api/tickets${query}`);

  if (!response.ok) {
    throw new Error("Failed to fetch tickets");
  }

  const result = await response.json();
  return result.tickets;
}

/**
 * Get a single ticket by ID
 */
export async function getTicketById(id: string): Promise<Ticket> {
  const response = await fetch(`/api/tickets/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch ticket");
  }

  const result = await response.json();
  return result.ticket;
}

/**
 * Update a ticket
 */
export async function updateTicket(
  id: string,
  data: {
    subject?: string;
    description?: string;
    status?: "open" | "in-progress" | "pending" | "resolved" | "closed";
    priority?: "low" | "medium" | "high";
    category?: string;
    resolution?: string;
    userId?: string;
  },
): Promise<Ticket> {
  const response = await fetch(`/api/tickets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update ticket");
  }

  const result = await response.json();
  return result.ticket;
}

/**
 * Delete a ticket
 */
export async function deleteTicket(id: string): Promise<void> {
  const response = await fetch(`/api/tickets/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete ticket");
  }
}

/**
 * Get tickets by customer ID
 */
export async function getTicketsByCustomer(
  customerId: string,
): Promise<Ticket[]> {
  const response = await fetch(`/api/tickets/customer/${customerId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch customer tickets");
  }

  const result = await response.json();
  return result.tickets;
}

/**
 * Assign a ticket to a user
 */
export async function assignTicket(
  id: string,
  userId: string,
): Promise<Ticket> {
  const response = await fetch(`/api/tickets/${id}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    throw new Error("Failed to assign ticket");
  }

  const result = await response.json();
  return result.ticket;
}

/**
 * Get ticket statistics
 */
export async function getTicketStats(): Promise<TicketStats> {
  const response = await fetch("/api/tickets/stats");

  if (!response.ok) {
    throw new Error("Failed to fetch ticket statistics");
  }

  const result = await response.json();
  return result.stats;
}
