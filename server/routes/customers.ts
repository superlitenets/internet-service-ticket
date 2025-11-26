import { RequestHandler } from "express";
import { db } from "../lib/db";

/**
 * Create a new customer
 */
export const createCustomer: RequestHandler = async (req, res) => {
  try {
    console.log("[API] POST /api/customers - Creating customer");
    console.log("[API] Request body:", req.body);

    const { name, email, phone, accountType } = req.body;

    if (!name || !phone) {
      console.warn("[API] Missing required fields - name:", name, "phone:", phone);
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    console.log("[API] Creating customer in database with:", { name, email, phone, accountType });

    const customer = await db.customer.create({
      data: {
        name,
        email: email || "",
        phone,
        accountType: accountType || "residential",
        status: "active",
      },
    });

    console.log("[API] Customer created successfully:", customer);

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    console.error("[API] Create customer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create customer",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get all customers
 */
export const getCustomers: RequestHandler = async (_req, res) => {
  try {
    const customers = await db.customer.findMany({
      orderBy: {
        registeredAt: "desc",
      },
    });

    return res.json({
      success: true,
      customers,
      count: customers.length,
    });
  } catch (error) {
    console.error("Get customers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get a single customer by ID
 */
export const getCustomerById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await db.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Get customer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Update a customer
 */
export const updateCustomer: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, accountType, status } = req.body;

    const customer = await db.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (accountType !== undefined) updateData.accountType = accountType;
    if (status !== undefined) updateData.status = status;

    const updatedCustomer = await db.customer.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      message: "Customer updated successfully",
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error("Update customer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update customer",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Delete a customer
 */
export const deleteCustomer: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await db.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await db.customer.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete customer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete customer",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
