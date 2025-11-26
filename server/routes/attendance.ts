import { RequestHandler } from "express";
import { db } from "../lib/db";

/**
 * Create an attendance record
 */
export const createAttendanceRecord: RequestHandler = async (req, res) => {
  try {
    const { employeeId, date, checkInTime, checkOutTime, status, notes } = req.body;

    if (!employeeId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: "Employee ID, date, and status are required",
      });
    }

    const record = await db.attendanceLog.create({
      data: {
        employeeId,
        date: new Date(date),
        checkInTime: checkInTime || undefined,
        checkOutTime: checkOutTime || undefined,
        status,
        notes: notes || undefined,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Attendance record created successfully",
      record,
    });
  } catch (error) {
    console.error("Create attendance record error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create attendance record",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get all attendance records with optional filters
 */
export const getAttendanceRecords: RequestHandler = async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    const where: any = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    const records = await db.attendanceLog.findMany({
      where,
      orderBy: {
        date: "desc",
      },
    });

    return res.json({
      success: true,
      records,
      count: records.length,
    });
  } catch (error) {
    console.error("Get attendance records error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch attendance records",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get a single attendance record by ID
 */
export const getAttendanceRecordById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await db.attendanceLog.findUnique({
      where: { id },
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    return res.json({
      success: true,
      record,
    });
  } catch (error) {
    console.error("Get attendance record error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch attendance record",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Update an attendance record
 */
export const updateAttendanceRecord: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { checkInTime, checkOutTime, status, notes } = req.body;

    const record = await db.attendanceLog.findUnique({
      where: { id },
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    const updateData: any = {};

    if (checkInTime !== undefined) updateData.checkInTime = checkInTime;
    if (checkOutTime !== undefined) updateData.checkOutTime = checkOutTime;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const updatedRecord = await db.attendanceLog.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      message: "Attendance record updated successfully",
      record: updatedRecord,
    });
  } catch (error) {
    console.error("Update attendance record error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update attendance record",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Delete an attendance record
 */
export const deleteAttendanceRecord: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await db.attendanceLog.findUnique({
      where: { id },
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    await db.attendanceLog.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Attendance record deleted successfully",
    });
  } catch (error) {
    console.error("Delete attendance record error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete attendance record",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
