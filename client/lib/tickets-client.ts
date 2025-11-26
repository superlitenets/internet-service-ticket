export interface Ticket {
  id: string;
  ticketId: string;
  customerId: string;
  userId?: string;
  subject: string;
  description: string;
  category?: string;
  priority: "high" | "medium" | "low";
  status: "open" | "in-progress" | "bounced" | "waiting" | "resolved" | "closed";
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TicketReply {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  name?: string;
  email?: string;
}

/**
 * Get all tickets with filters
 */
export async function getTickets(filters?: {
  status?: string;
  priority?: string;
  customerId?: string;
  userId?: string;
}): Promise<Ticket[]> {
  let url = "/api/tickets";
  const params = new URLSearchParams();

  if (filters?.status && filters.status !== "all") {
    params.append("status", filters.status);
  }
  if (filters?.priority && filters.priority !== "all") {
    params.append("priority", filters.priority);
  }
  if (filters?.customerId) {
    params.append("customerId", filters.customerId);
  }
  if (filters?.userId) {
    params.append("userId", filters.userId);
  }

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch tickets");
  }

  const result = await response.json();
  return result.tickets || result;
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
  return result.ticket || result;
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
  priority?: string;
  status?: string;
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
  return result.ticket || result;
}

/**
 * Update a ticket
 */
export async function updateTicket(
  id: string,
  data: Partial<Omit<Ticket, "id" | "createdAt" | "updatedAt">>,
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
  return result.ticket || result;
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
 * Get all replies for a ticket
 */
export async function getTicketReplies(ticketId: string): Promise<TicketReply[]> {
  const response = await fetch(`/api/tickets/${ticketId}/replies`);

  if (!response.ok) {
    throw new Error("Failed to fetch ticket replies");
  }

  const result = await response.json();
  return result.replies || [];
}

/**
 * Create a reply to a ticket
 */
export async function createTicketReply(data: {
  ticketId: string;
  userId: string;
  message: string;
  isInternal?: boolean;
}): Promise<TicketReply> {
  const response = await fetch("/api/ticket-replies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create ticket reply");
  }

  const result = await response.json();
  return result.reply || result;
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
  id: string,
  status: "open" | "in-progress" | "bounced" | "waiting" | "resolved" | "closed",
): Promise<Ticket> {
  return updateTicket(id, { status });
}
