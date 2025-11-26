import { RequestHandler } from "express";
import { db } from "../lib/db";
import { generateTicketId } from "../lib/ticket-id-generator";

/**
 * Create a new ticket
 */
export const createTicket: RequestHandler = async (req, res) => {
  try {
    const {
      customerId,
      userId,
      subject,
      description,
      category,
      priority,
      status,
    } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Subject and description are required",
      });
    }

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    // Verify customer exists
    const customer = await db.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const ticket = await db.ticket.create({
      data: {
        ticketId: `TK-${Date.now()}`,
        customerId,
        userId: userId || undefined,
        subject,
        description,
        category: category || "general",
        priority: priority || "medium",
        status: status || "open",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticket,
    });
  } catch (error) {
    console.error("Create ticket error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create ticket",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get all tickets with optional filters
 */
export const getTickets: RequestHandler = async (req, res) => {
  try {
    const { status, priority, customerId, userId } = req.query;

    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (priority && priority !== "all") {
      where.priority = priority;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (userId) {
      where.userId = userId;
    }

    const tickets = await db.ticket.findMany({
      where,
      include: {
        customer: true,
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      tickets,
      count: tickets.length,
    });
  } catch (error) {
    console.error("Get tickets error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tickets",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get a single ticket by ID
 */
export const getTicketById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await db.ticket.findUnique({
      where: { id },
      include: {
        customer: true,
        user: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    return res.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("Get ticket error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ticket",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Update a ticket
 */
export const updateTicket: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      subject,
      description,
      status,
      priority,
      category,
      resolution,
      userId,
    } = req.body;

    const ticket = await db.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const updateData: any = {};

    if (subject !== undefined) updateData.subject = subject;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "resolved" || status === "closed") {
        updateData.resolvedAt = new Date();
      }
    }
    if (priority !== undefined) updateData.priority = priority;
    if (category !== undefined) updateData.category = category;
    if (resolution !== undefined) updateData.resolution = resolution;
    if (userId !== undefined) updateData.userId = userId;

    const updatedTicket = await db.ticket.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        user: true,
      },
    });

    return res.json({
      success: true,
      message: "Ticket updated successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("Update ticket error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update ticket",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Delete a ticket
 */
export const deleteTicket: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await db.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    await db.ticket.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("Delete ticket error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete ticket",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get tickets by customer ID
 */
export const getTicketsByCustomer: RequestHandler = async (req, res) => {
  try {
    const { customerId } = req.params;

    const tickets = await db.ticket.findMany({
      where: { customerId },
      include: {
        customer: true,
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      tickets,
      count: tickets.length,
    });
  } catch (error) {
    console.error("Get customer tickets error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer tickets",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Assign a ticket to a user
 */
export const assignTicket: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const ticket = await db.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updatedTicket = await db.ticket.update({
      where: { id },
      data: { userId },
      include: {
        customer: true,
        user: true,
      },
    });

    return res.json({
      success: true,
      message: "Ticket assigned successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("Assign ticket error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to assign ticket",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get ticket statistics
 */
export const getTicketStats: RequestHandler = async (_req, res) => {
  try {
    const total = await db.ticket.count();
    const open = await db.ticket.count({
      where: { status: "open" },
    });
    const inProgress = await db.ticket.count({
      where: { status: "in-progress" },
    });
    const pending = await db.ticket.count({
      where: { status: "pending" },
    });
    const resolved = await db.ticket.count({
      where: { status: "resolved" },
    });

    const byPriority = {
      high: await db.ticket.count({
        where: { priority: "high" },
      }),
      medium: await db.ticket.count({
        where: { priority: "medium" },
      }),
      low: await db.ticket.count({
        where: { priority: "low" },
      }),
    };

    return res.json({
      success: true,
      stats: {
        total,
        byStatus: {
          open,
          inProgress,
          pending,
          resolved,
        },
        byPriority,
      },
    });
  } catch (error) {
    console.error("Get ticket stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ticket statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
