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
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateLeadRequest {
  customerName: string;
  phone: string;
  email?: string;
  location: string;
  package: string;
  agreedInstallAmount: number;
  notes?: string;
}

export interface UpdateLeadRequest {
  customerName?: string;
  phone?: string;
  email?: string;
  location?: string;
  package?: string;
  agreedInstallAmount?: number;
  status?: string;
  notes?: string;
}

export interface LeadsResponse {
  success: boolean;
  data?: Lead | Lead[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  message?: string;
  error?: string;
}

export async function createLead(data: CreateLeadRequest): Promise<Lead> {
  try {
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create lead");
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to create lead",
    );
  }
}

export async function getLeads(
  status?: string,
  search?: string,
  page: number = 1,
  limit: number = 20,
): Promise<{ leads: Lead[]; pagination: any }> {
  try {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (search) params.append("search", search);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    const response = await fetch(`/api/leads?${params.toString()}`);

    if (!response.ok) {
      throw new Error("Failed to fetch leads");
    }

    const result = await response.json();
    return {
      leads: result.data,
      pagination: result.pagination,
    };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch leads",
    );
  }
}

export async function getLeadById(id: string): Promise<Lead> {
  try {
    const response = await fetch(`/api/leads/${id}`);

    if (!response.ok) {
      throw new Error("Failed to fetch lead");
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch lead",
    );
  }
}

export async function updateLead(
  id: string,
  data: UpdateLeadRequest,
): Promise<Lead> {
  try {
    const response = await fetch(`/api/leads/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update lead");
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to update lead",
    );
  }
}

export async function deleteLead(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/leads/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete lead");
    }
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to delete lead",
    );
  }
}

export async function convertLeadToTicket(
  id: string,
  subject: string,
  description: string,
  priority?: string,
  category?: string,
): Promise<any> {
  try {
    const response = await fetch(`/api/leads/${id}/convert-to-ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject,
        description,
        priority,
        category,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to convert lead to ticket");
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to convert lead to ticket",
    );
  }
}
