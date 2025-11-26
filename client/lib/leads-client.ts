export interface Lead {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  location: string;
  package: string;
  agreedInstallAmount: number;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  createdById: string;
  convertedToTicketId?: string;
  convertedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new lead
 */
export async function createLead(data: {
  customerName: string;
  phone: string;
  email?: string;
  location: string;
  package: string;
  agreedInstallAmount: number;
  notes?: string;
}): Promise<Lead> {
  const response = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create lead");
  }

  const result = await response.json();
  return result.lead || result;
}

/**
 * Get all leads
 */
export async function getLeads(): Promise<Lead[]> {
  const response = await fetch("/api/leads");

  if (!response.ok) {
    throw new Error("Failed to fetch leads");
  }

  const result = await response.json();
  return result.leads || result;
}

/**
 * Get a single lead by ID
 */
export async function getLeadById(id: string): Promise<Lead> {
  const response = await fetch(`/api/leads/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch lead");
  }

  const result = await response.json();
  return result.lead || result;
}

/**
 * Update a lead
 */
export async function updateLead(
  id: string,
  data: Partial<Omit<Lead, "id">>,
): Promise<Lead> {
  const response = await fetch(`/api/leads/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update lead");
  }

  const result = await response.json();
  return result.lead || result;
}

/**
 * Delete a lead
 */
export async function deleteLead(id: string): Promise<void> {
  const response = await fetch(`/api/leads/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete lead");
  }
}

/**
 * Convert a lead to a ticket
 */
export async function convertLeadToTicket(
  leadId: string,
  ticketData: {
    subject: string;
    description: string;
    priority?: "low" | "medium" | "high";
  },
): Promise<any> {
  const response = await fetch(`/api/leads/${leadId}/convert-to-ticket`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ticketData),
  });

  if (!response.ok) {
    throw new Error("Failed to convert lead to ticket");
  }

  const result = await response.json();
  return result;
}
