import { RequestHandler } from "express";

interface Lead {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  location: string;
  package: string;
  agreedInstallAmount: number;
  status: "new" | "converted" | "closed";
  notes?: string;
  createdById: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  convertedToTicketId?: string;
  convertedAt?: string;
}

interface CreateLeadRequest {
  customerName: string;
  phone: string;
  email?: string;
  location: string;
  package: string;
  agreedInstallAmount: number;
  notes?: string;
}

interface UpdateLeadRequest {
  customerName?: string;
  phone?: string;
  email?: string;
  location?: string;
  package?: string;
  agreedInstallAmount?: number;
  status?: string;
  notes?: string;
}

let leads: Map<string, Lead> = new Map([
  [
    "LEAD-001",
    {
      id: "LEAD-001",
      customerName: "John Doe",
      phone: "0722111111",
      email: "john@example.com",
      location: "Nairobi",
      package: "Premium 10Mbps",
      agreedInstallAmount: 2500,
      status: "new",
      notes: "Interested in upgrades",
      createdById: "user-1",
      createdByName: "Admin User",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
  [
    "LEAD-002",
    {
      id: "LEAD-002",
      customerName: "Jane Smith",
      phone: "0733222222",
      email: "jane@example.com",
      location: "Kampala",
      package: "Standard 5Mbps",
      agreedInstallAmount: 1500,
      status: "new",
      createdById: "user-1",
      createdByName: "Admin User",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ],
]);

export const createLead: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id || "user-1";
    const userName = (req as any).user?.name || "Admin User";

    const {
      customerName,
      phone,
      email,
      location,
      package: packageName,
      agreedInstallAmount,
      notes,
    }: CreateLeadRequest = req.body;

    if (
      !customerName ||
      !phone ||
      !location ||
      !packageName ||
      agreedInstallAmount === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error:
          "customerName, phone, location, package, and agreedInstallAmount are required",
      });
    }

    const leadId = `LEAD-${String(leads.size + 1).padStart(3, "0")}`;
    const lead: Lead = {
      id: leadId,
      customerName,
      phone,
      email,
      location,
      package: packageName,
      agreedInstallAmount,
      notes,
      status: "new",
      createdById: userId,
      createdByName: userName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    leads.set(leadId, lead);

    return res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: lead,
    });
  } catch (error) {
    console.error("Error creating lead:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create lead",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

export const getLeads: RequestHandler = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    let filteredLeads = Array.from(leads.values());

    if (status) {
      filteredLeads = filteredLeads.filter((lead) => lead.status === status);
    }

    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredLeads = filteredLeads.filter(
        (lead) =>
          lead.customerName.toLowerCase().includes(searchLower) ||
          lead.phone.includes(searchLower as string) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.location.toLowerCase().includes(searchLower),
      );
    }

    const total = filteredLeads.length;
    const paginatedLeads = filteredLeads
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(skip, skip + limitNum);

    return res.json({
      success: true,
      data: paginatedLeads,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leads",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

export const getLeadById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const lead = leads.get(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
        error: "The requested lead does not exist",
      });
    }

    return res.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error("Error fetching lead:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch lead",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

export const updateLead: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: UpdateLeadRequest = req.body;

    const lead = leads.get(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
        error: "The requested lead does not exist",
      });
    }

    const updated: Lead = {
      ...lead,
      ...(updateData.customerName && {
        customerName: updateData.customerName,
      }),
      ...(updateData.phone && { phone: updateData.phone }),
      ...(updateData.email && { email: updateData.email }),
      ...(updateData.location && { location: updateData.location }),
      ...(updateData.package && { package: updateData.package }),
      ...(updateData.agreedInstallAmount !== undefined && {
        agreedInstallAmount: updateData.agreedInstallAmount,
      }),
      ...(updateData.status && { status: updateData.status as any }),
      ...(updateData.notes !== undefined && { notes: updateData.notes }),
      updatedAt: new Date().toISOString(),
    };

    leads.set(id, updated);

    return res.json({
      success: true,
      message: "Lead updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating lead:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update lead",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

export const deleteLead: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const lead = leads.get(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
        error: "The requested lead does not exist",
      });
    }

    leads.delete(id);

    return res.json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete lead",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

export const convertLeadToTicket: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, description, priority = "medium", category, assignedTo = "Unassigned" } = req.body;
    const userId = (req as any).user?.id || "user-1";

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "subject and description are required",
      });
    }

    const lead = leads.get(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
        error: "The requested lead does not exist",
      });
    }

    const ticketId = `TK-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;

    const ticketData = {
      id: ticketId,
      customer: lead.customerName,
      customerEmail: lead.email || "",
      customerPhone: lead.phone,
      customerLocation: lead.location,
      title: subject,
      description: `${description}\n\nLead Package: ${lead.package}\nAgreed Installation Amount: KES ${lead.agreedInstallAmount}`,
      status: "open",
      priority,
      category: category || "installation",
      assignedTo,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
      smsNotificationsSent: 0,
      replies: [],
    };

    const updatedLead: Lead = {
      ...lead,
      status: "converted",
      convertedToTicketId: ticketId,
      convertedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    leads.set(id, updatedLead);

    return res.status(201).json({
      success: true,
      message: "Lead converted to ticket successfully",
      data: {
        ticket: ticketData,
        lead: updatedLead,
      },
    });
  } catch (error) {
    console.error("Error converting lead to ticket:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to convert lead to ticket",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};
