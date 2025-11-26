import { RequestHandler } from "express";
import { db } from "../lib/db";

/**
 * Create a new employee
 */
export const createEmployee: RequestHandler = async (req, res) => {
  try {
    const {
      userId,
      firstName,
      lastName,
      email,
      phone,
      position,
      department,
      salary,
      hireDate,
      emergencyContact,
    } = req.body;

    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, email, and phone are required",
      });
    }

    // Create or link user if userId provided
    let linkedUserId = userId;
    if (!linkedUserId) {
      // For now, employees are created without users
      linkedUserId = undefined;
    }

    const employee = await db.employee.create({
      data: {
        userId: linkedUserId || undefined,
        firstName,
        lastName,
        email,
        phone,
        position: position || undefined,
        department: department || undefined,
        salary: salary || undefined,
        hireDate: new Date(hireDate),
        status: "active",
        emergencyContact: emergencyContact || undefined,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee,
    });
  } catch (error) {
    console.error("Create employee error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create employee",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get all employees
 */
export const getEmployees: RequestHandler = async (_req, res) => {
  try {
    const employees = await db.employee.findMany({
      orderBy: {
        firstName: "asc",
      },
    });

    return res.json({
      success: true,
      employees,
      count: employees.length,
    });
  } catch (error) {
    console.error("Get employees error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get a single employee by ID
 */
export const getEmployeeById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await db.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.json({
      success: true,
      employee,
    });
  } catch (error) {
    console.error("Get employee error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Update an employee
 */
export const updateEmployee: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      position,
      department,
      salary,
      status,
      emergencyContact,
    } = req.body;

    const employee = await db.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const updateData: any = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (position !== undefined) updateData.position = position;
    if (department !== undefined) updateData.department = department;
    if (salary !== undefined) updateData.salary = salary;
    if (status !== undefined) updateData.status = status;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;

    const updatedEmployee = await db.employee.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("Update employee error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update employee",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Delete an employee
 */
export const deleteEmployee: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await db.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    await db.employee.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error("Delete employee error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete employee",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
