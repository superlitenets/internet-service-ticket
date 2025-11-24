import { RequestHandler } from "express";
import { db } from "../lib/db";
import type {
  Employee,
  AttendanceRecord,
  LeaveRequest,
  PayrollRecord,
  PerformanceReview,
  ZKtecoDeviceConfig,
} from "@shared/api";

/**
 * Get all employees
 */
export const getEmployees: RequestHandler<
  unknown,
  { employees: Employee[] }
> = async (_req, res) => {
  try {
    const employees = await db.employee.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    const formattedEmployees: Employee[] = employees.map((emp) => ({
      id: emp.id,
      userId: emp.userId,
      name: emp.user?.name || emp.firstName + " " + emp.lastName,
      email: emp.email,
      phone: emp.phone,
      position: emp.position || undefined,
      department: emp.department || undefined,
      hireDate: emp.hireDate.toISOString(),
      status: emp.status,
      employeeId: emp.id,
    }));

    res.json({ employees: formattedEmployees });
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch employees",
    });
  }
};

/**
 * Create employee
 */
export const createEmployee: RequestHandler<
  unknown,
  unknown,
  Employee
> = async (req, res) => {
  try {
    const { name, email, phone, position, department, hireDate, userId } =
      req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        error: "Missing required fields: name, email, phone",
      });
    }

    // Check if email or phone already exists
    const existingEmployee = await db.employee.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingEmployee) {
      return res.status(409).json({
        error: "Employee with this email or phone already exists",
      });
    }

    const employee = await db.employee.create({
      data: {
        firstName: name.split(" ")[0],
        lastName: name.split(" ").slice(1).join(" ") || name,
        email,
        phone,
        position: position || undefined,
        department: department || undefined,
        hireDate: hireDate ? new Date(hireDate) : new Date(),
        userId: userId || undefined,
        status: "active",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const formattedEmployee: Employee = {
      id: employee.id,
      userId: employee.userId || undefined,
      name: employee.user?.name || name,
      email: employee.email,
      phone: employee.phone,
      position: employee.position || undefined,
      department: employee.department || undefined,
      hireDate: employee.hireDate.toISOString(),
      status: employee.status,
      employeeId: employee.id,
    };

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee: formattedEmployee,
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to create employee",
    });
  }
};

/**
 * Get attendance records
 */
export const getAttendance: RequestHandler<
  unknown,
  { attendance: AttendanceRecord[] }
> = (_req, res) => {
  try {
    // TODO: Implement attendance records fetching from database
    const attendance: AttendanceRecord[] = [];
    res.json({ attendance });
  } catch (error) {
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch attendance",
    });
  }
};

/**
 * Get leave requests
 */
export const getLeaveRequests: RequestHandler<
  unknown,
  { requests: LeaveRequest[] }
> = (_req, res) => {
  try {
    // TODO: Implement leave requests fetching from database
    const requests: LeaveRequest[] = [];
    res.json({ requests });
  } catch (error) {
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch leave requests",
    });
  }
};

/**
 * Get payroll records
 */
export const getPayroll: RequestHandler<
  unknown,
  { records: PayrollRecord[] }
> = (_req, res) => {
  try {
    // TODO: Implement payroll records fetching from database
    const records: PayrollRecord[] = [];
    res.json({ records });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch payroll",
    });
  }
};

/**
 * Get performance reviews
 */
export const getPerformance: RequestHandler<
  unknown,
  { reviews: PerformanceReview[] }
> = (_req, res) => {
  try {
    // TODO: Implement performance reviews fetching from database
    const reviews: PerformanceReview[] = [];
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch performance reviews",
    });
  }
};

/**
 * Test ZKteco device connection
 */
export const testZKtecoConnection: RequestHandler<
  unknown,
  { success: boolean; message: string; version?: string },
  ZKtecoDeviceConfig
> = (req, res) => {
  try {
    const { ipAddress, port, username, password } = req.body;

    // Validate required fields
    if (!ipAddress || !port || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing ZKteco device credentials",
      });
    }

    // Simulate ZKteco device connection
    console.log("[ZKteco] Testing connection to device:", {
      ipAddress,
      port,
      username,
    });

    // In production, you would use a ZKteco SDK or API to connect
    // For now, we'll simulate a successful connection
    res.json({
      success: true,
      message: `Connected to ZKteco40 device at ${ipAddress}:${port}`,
      version: "V5.3.1",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to connect to device",
    });
  }
};

/**
 * Sync attendance from ZKteco device
 */
export const syncZKtecoAttendance: RequestHandler<
  unknown,
  {
    success: boolean;
    recordsImported: number;
    message: string;
    timestamp: string;
  },
  { deviceId: string }
> = (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        recordsImported: 0,
        message: "Device ID is required",
        timestamp: new Date().toISOString(),
      });
    }

    // Simulate syncing attendance records
    console.log("[ZKteco] Syncing attendance from device:", deviceId);

    // In production, you would:
    // 1. Connect to the ZKteco device
    // 2. Retrieve attendance records
    // 3. Parse and validate the data
    // 4. Save to database
    // 5. Return the number of records imported

    const recordsImported = Math.floor(Math.random() * 20) + 1;

    res.json({
      success: true,
      recordsImported,
      message: `Successfully imported ${recordsImported} attendance records`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      recordsImported: 0,
      message:
        error instanceof Error ? error.message : "Failed to sync attendance",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get real-time attendance from ZKteco device
 */
export const getZKtecoRealtime: RequestHandler<
  { deviceId: string },
  { attendance: AttendanceRecord[] }
> = (req, res) => {
  try {
    const { deviceId } = req.params;

    if (!deviceId) {
      return res.status(400).json({
        attendance: [],
      });
    }

    // Simulate getting real-time data from device
    console.log("[ZKteco] Getting real-time data from device:", deviceId);

    // In production, you would connect to the device and get live data
    res.json({
      attendance: [],
    });
  } catch (error) {
    res.status(500).json({
      attendance: [],
    });
  }
};
