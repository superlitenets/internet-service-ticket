import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: "User not authenticated",
      });
    }

    const {
      customerName,
      phone,
      email,
      location,
      package: packageName,
      agreedInstallAmount,
      notes,
    }: CreateLeadRequest = req.body;

    if (!customerName || !phone || !location || !packageName || agreedInstallAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "customerName, phone, location, package, and agreedInstallAmount are required",
      });
    }

    const lead = await prisma.lead.create({
      data: {
        customerName,
        phone,
        email,
        location,
        package: packageName,
        agreedInstallAmount,
        notes,
        createdById: userId,
        status: "new",
      },
    });

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
      prisma.lead.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.lead.count({ where }),
    ]);

    return res.json({
      success: true,
      data: leads,
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

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
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

    const lead = await prisma.lead.findUnique({ where: { id } });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
        error: "The requested lead does not exist",
      });
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ...(updateData.customerName && { customerName: updateData.customerName }),
        ...(updateData.phone && { phone: updateData.phone }),
        ...(updateData.email && { email: updateData.email }),
        ...(updateData.location && { location: updateData.location }),
        ...(updateData.package && { package: updateData.package }),
        ...(updateData.agreedInstallAmount !== undefined && {
          agreedInstallAmount: updateData.agreedInstallAmount,
        }),
        ...(updateData.status && { status: updateData.status }),
        ...(updateData.notes !== undefined && { notes: updateData.notes }),
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

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

    const lead = await prisma.lead.findUnique({ where: { id } });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
        error: "The requested lead does not exist",
      });
    }

    await prisma.lead.delete({ where: { id } });

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
    const { subject, description, priority = "medium", category } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: "User not authenticated",
      });
    }

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "subject and description are required",
      });
    }

    const lead = await prisma.lead.findUnique({ where: { id } });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
        error: "The requested lead does not exist",
      });
    }

    const ticketId = `TKT-${Date.now()}`;

    let customer = await prisma.customer.findUnique({
      where: { phone: lead.phone },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          phone: lead.phone,
          email: lead.email || "",
          name: lead.customerName,
        },
      });
    }

    const ticket = await prisma.ticket.create({
      data: {
        ticketId,
        customerId: customer.id,
        userId,
        subject,
        description: `${description}\n\nLead Package: ${lead.package}\nAgreed Installation Amount: ${lead.agreedInstallAmount}\nLocation: ${lead.location}`,
        category,
        priority,
        status: "open",
      },
    });

    await prisma.lead.update({
      where: { id },
      data: {
        status: "converted",
        convertedToTicketId: ticket.id,
        convertedAt: new Date(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Lead converted to ticket successfully",
      data: {
        ticket,
        lead: await prisma.lead.findUnique({ where: { id } }),
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
