import { RequestHandler } from "express";
import { db } from "../lib/db";

/**
 * Create a new task for a ticket
 */
export const createTask: RequestHandler = async (req, res) => {
  try {
    const { ticketId, title, description, assignedTo, priority, estimatedHours } = req.body;

    if (!ticketId || !title) {
      return res.status(400).json({
        success: false,
        message: "Ticket ID and title are required",
      });
    }

    const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const task = await db.ticketTask.create({
      data: {
        ticketId,
        title,
        description: description || undefined,
        assignedTo: assignedTo || undefined,
        priority: priority || "medium",
        estimatedHours: estimatedHours || undefined,
      },
      include: {
        assignee: true,
        timeLogs: true,
      },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        ticketId,
        action: "task_added",
        description: `Task "${title}" added to ticket`,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create task",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get all tasks for a ticket
 */
export const getTasks: RequestHandler = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const tasks = await db.ticketTask.findMany({
      where: { ticketId },
      include: {
        assignee: true,
        timeLogs: true,
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    return res.json({
      success: true,
      tasks,
      count: tasks.length,
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Update a task
 */
export const updateTask: RequestHandler = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, assignedTo, status, priority, estimatedHours } = req.body;

    const task = await db.ticketTask.findUnique({ where: { id: taskId } });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "completed") {
        updateData.completedAt = new Date();
      }
    }
    if (priority !== undefined) updateData.priority = priority;
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours;

    const updatedTask = await db.ticketTask.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: true,
        timeLogs: true,
      },
    });

    // Log activity
    if (status && status !== task.status) {
      await db.activityLog.create({
        data: {
          ticketId: task.ticketId,
          action: "task_status_changed",
          description: `Task "${task.title}" status changed to ${status}`,
        },
      });
    }

    return res.json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update task",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Delete a task
 */
export const deleteTask: RequestHandler = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await db.ticketTask.findUnique({ where: { id: taskId } });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    await db.ticketTask.delete({ where: { id: taskId } });

    // Log activity
    await db.activityLog.create({
      data: {
        ticketId: task.ticketId,
        action: "task_deleted",
        description: `Task "${task.title}" deleted`,
      },
    });

    return res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete task",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Log time on a task/ticket
 */
export const logTime: RequestHandler = async (req, res) => {
  try {
    const { taskId, ticketId, userId, hours, description } = req.body;

    if (!ticketId || !userId || !hours) {
      return res.status(400).json({
        success: false,
        message: "Ticket ID, user ID, and hours are required",
      });
    }

    const timeLog = await db.timeLog.create({
      data: {
        taskId: taskId || undefined,
        ticketId,
        userId,
        hours,
        description: description || undefined,
      },
      include: {
        user: true,
        task: true,
        ticket: true,
      },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        ticketId,
        userId,
        action: "time_logged",
        description: `${hours} hours logged${taskId ? " on task" : ""}`,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Time logged successfully",
      timeLog,
    });
  } catch (error) {
    console.error("Log time error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to log time",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get time logs for a ticket
 */
export const getTimeLogs: RequestHandler = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const timeLogs = await db.timeLog.findMany({
      where: { ticketId },
      include: {
        user: true,
        task: true,
      },
      orderBy: { date: "desc" },
    });

    const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);

    return res.json({
      success: true,
      timeLogs,
      totalHours,
      count: timeLogs.length,
    });
  } catch (error) {
    console.error("Get time logs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch time logs",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get activity log for a ticket
 */
export const getActivityLog: RequestHandler = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const activities = await db.activityLog.findMany({
      where: { ticketId },
      include: {
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      activities,
      count: activities.length,
    });
  } catch (error) {
    console.error("Get activity log error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch activity log",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Add a comment to a ticket
 */
export const addComment: RequestHandler = async (req, res) => {
  try {
    const { ticketId, userId, content, isInternal } = req.body;

    if (!ticketId || !userId || !content) {
      return res.status(400).json({
        success: false,
        message: "Ticket ID, user ID, and content are required",
      });
    }

    const comment = await db.ticketComment.create({
      data: {
        ticketId,
        userId,
        content,
        isInternal: isInternal || false,
      },
      include: {
        user: true,
      },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        ticketId,
        userId,
        action: "comment_added",
        description: `${isInternal ? "Internal note" : "Comment"} added`,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment,
    });
  } catch (error) {
    console.error("Add comment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get comments for a ticket
 */
export const getComments: RequestHandler = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { internalOnly } = req.query;

    const where: any = { ticketId };
    if (internalOnly === "true") {
      where.isInternal = true;
    }

    const comments = await db.ticketComment.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      comments,
      count: comments.length,
    });
  } catch (error) {
    console.error("Get comments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get SLA policies
 */
export const getSLAPolicies: RequestHandler = async (_req, res) => {
  try {
    const policies = await db.sLAPolicy.findMany({
      where: { enabled: true },
      orderBy: { name: "asc" },
    });

    return res.json({
      success: true,
      policies,
      count: policies.length,
    });
  } catch (error) {
    console.error("Get SLA policies error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch SLA policies",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get performance metrics for an employee
 */
export const getPerformanceMetrics: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { period } = req.query; // Optional: filter by period (YYYY-MM)

    const where: any = { userId };
    if (period) {
      const startDate = new Date(`${period}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
      where.period = {
        gte: startDate,
        lt: endDate,
      };
    }

    const metrics = await db.performanceMetric.findMany({
      where,
      orderBy: { period: "desc" },
    });

    return res.json({
      success: true,
      metrics,
      count: metrics.length,
    });
  } catch (error) {
    console.error("Get performance metrics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch performance metrics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get team performance report
 */
export const getTeamPerformanceReport: RequestHandler = async (req, res) => {
  try {
    const { period } = req.query; // Optional: filter by period (YYYY-MM)

    const where: any = {};
    if (period) {
      const startDate = new Date(`${period}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
      where.period = {
        gte: startDate,
        lt: endDate,
      };
    }

    const metrics = await db.performanceMetric.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { slaCompliancePercent: "desc" },
    });

    // Calculate team totals
    const teamTotals = {
      totalTicketsHandled: metrics.reduce((sum, m) => sum + m.ticketsHandled, 0),
      totalTicketsResolved: metrics.reduce((sum, m) => sum + m.ticketsResolved, 0),
      avgResolutionTime: metrics.reduce((sum, m) => sum + m.avgResolutionHours, 0) / metrics.length || 0,
      avgSLACompliance: metrics.reduce((sum, m) => sum + m.slaCompliancePercent, 0) / metrics.length || 0,
      totalHoursLogged: metrics.reduce((sum, m) => sum + m.totalHoursLogged, 0),
    };

    return res.json({
      success: true,
      metrics,
      teamTotals,
      count: metrics.length,
    });
  } catch (error) {
    console.error("Get team performance report error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch team performance report",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
