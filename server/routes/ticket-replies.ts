import { RequestHandler } from "express";
import { db } from "../lib/db";

/**
 * Create a new ticket reply
 */
export const createTicketReply: RequestHandler = async (req, res) => {
  try {
    const { ticketId, userId, message, isInternal } = req.body;

    if (!ticketId || !userId || !message) {
      return res.status(400).json({
        success: false,
        message: "TicketId, userId, and message are required",
      });
    }

    const reply = await db.ticketReply.create({
      data: {
        ticketId,
        userId,
        message,
        isInternal: isInternal || false,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Reply added successfully",
      reply,
    });
  } catch (error) {
    console.error("Create ticket reply error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create ticket reply",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get all replies for a ticket
 */
export const getTicketReplies: RequestHandler = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const replies = await db.ticketReply.findMany({
      where: { ticketId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return res.json({
      success: true,
      replies,
      count: replies.length,
    });
  } catch (error) {
    console.error("Get ticket replies error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ticket replies",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get a single reply by ID
 */
export const getTicketReplyById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const reply = await db.ticketReply.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: "Reply not found",
      });
    }

    return res.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("Get ticket reply error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ticket reply",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Delete a ticket reply
 */
export const deleteTicketReply: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const reply = await db.ticketReply.findUnique({
      where: { id },
    });

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: "Reply not found",
      });
    }

    await db.ticketReply.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Reply deleted successfully",
    });
  } catch (error) {
    console.error("Delete ticket reply error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete ticket reply",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
