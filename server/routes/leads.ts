import { RequestHandler } from "express";
import { db } from "../lib/db";

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

export const createLead: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id || "user-1";

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

    const lead = await db.lead.create({
      data: {
        customerName,
        phone,
        email: email || undefined,
        location,
        package: packageName,
        agreedInstallAmount,
        notes: notes || undefined,
        status: "new",
        createdById: userId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: {
        id: lead.id,
        customerName: lead.customerName,
        phone: lead.phone,
        email: lead.email,
        location: lead.location,
        package: lead.package,
        agreedInstallAmount: lead.agreedInstallAmount,
        notes: lead.notes,
        status: lead.status,
        createdById: lead.createdById,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
      },
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

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search as string, mode: "insensitive" } },
        { phone: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
        { location: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      db.lead.count({ where }),
    ]);

    const formattedLeads = leads.map((lead) => ({
      id: lead.id,
      customerName: lead.customerName,
      phone: lead.phone,
      email: lead.email,
      location: lead.location,
      package: lead.package,
      agreedInstallAmount: lead.agreedInstallAmount,
      status: lead.status,
      notes: lead.notes,
      createdById: lead.createdById,
      createdByName: lead.createdBy?.name,
      convertedToTicketId: lead.convertedToTicketId,
      convertedAt: lead.convertedAt?.toISOString(),
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    }));

    return res.json({
      success: true,
      data: formattedLeads,
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

    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
        error: "The requested lead does not exist",
      });
    }

    return res.json({
      success: true,
      data: {
        id: lead.id,
        customerName: lead.customerName,
        phone: lead.phone,
        email: lead.email,
        location: lead.location,
        package: lead.package,
        agreedInstallAmount: lead.agreedInstallAmount,
        status: lead.status,
        notes: lead.notes,
        createdById: lead.createdById,
        createdByName: lead.createdBy?.name,
        convertedToTicketId: lead.convertedToTicketId,
        convertedAt: lead.convertedAt?.toISOString(),
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
      },
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

    const lead = await db.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
        error: "The requested lead does not exist",
      });
    }

    const updatedLead = await db.lead.update({
      where: { id },
      data: {
        customerName: updateData.customerName ?? undefined,
        phone: updateData.phone ?? undefined,
        email: updateData.email ?? undefined,
        location: updateData.location ?? undefined,
        package: updateData.package ?? undefined,
        agreedInstallAmount:
          updateData.agreedInstallAmount ?? undefined,
        status: updateData.status ?? undefined,
        notes: updateData.notes ?? undefined,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      message: "Lead updated successfully",
      data: {
        id: updatedLead.id,
        customerName: updatedLead.customerName,
        phone: updatedLead.phone,
        email: updatedLead.email,
        location: updatedLead.location,
        package: updatedLead.package,
        agreedInstallAmount: updatedLead.agreedInstallAmount,
        status: updatedLead.status,
        notes: updatedLead.notes,
        createdById: updatedLead.createdById,
        createdByName: updatedLead.createdBy?.name,
        convertedToTicketId: updatedLead.convertedToTicketId,
        convertedAt: updatedLead.convertedAt?.toISOString(),
        createdAt: updatedLead.createdAt.toISOString(),
        updatedAt: updatedLead.updatedAt.toISOString(),
      },
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

    const lead = await db.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
        error: "The requested lead does not exist",
      });
    }

    await db.lead.delete({
      where: { id },
    });

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
    const {
      subject,
      description,
      priority = "medium",
      category,
      assignedTo = "Unassigned",
    } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "subject and description are required",
      });
    }

    const lead = await db.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
        error: "The requested lead does not exist",
      });
    }

    const ticketId = `TK-${String(Math.floor(Math.random() * 10000)).padStart(5, "0")}`;

    const ticket = await db.ticket.create({
      data: {
        ticketId,
        customerId: "temp-customer-id",
        subject,
        description: `${description}\n\nLead Package: ${lead.package}\nAgreed Installation Amount: KES ${lead.agreedInstallAmount}`,
        category: category || "installation",
        priority,
      },
    });

    const updatedLead = await db.lead.update({
      where: { id },
      data: {
        status: "converted",
        convertedToTicketId: ticketId,
        convertedAt: new Date(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Lead converted to ticket successfully",
      data: {
        ticket: {
          id: ticket.id,
          ticketId: ticket.ticketId,
          subject: ticket.subject,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          category: ticket.category,
          createdAt: ticket.createdAt.toISOString(),
          updatedAt: ticket.updatedAt.toISOString(),
        },
        lead: {
          id: updatedLead.id,
          customerName: updatedLead.customerName,
          phone: updatedLead.phone,
          email: updatedLead.email,
          location: updatedLead.location,
          package: updatedLead.package,
          agreedInstallAmount: updatedLead.agreedInstallAmount,
          status: updatedLead.status,
          convertedToTicketId: updatedLead.convertedToTicketId,
          convertedAt: updatedLead.convertedAt?.toISOString(),
          createdAt: updatedLead.createdAt.toISOString(),
          updatedAt: updatedLead.updatedAt.toISOString(),
        },
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
