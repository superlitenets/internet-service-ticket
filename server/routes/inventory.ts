import { RequestHandler } from "express";
import { db } from "../lib/db";

/**
 * Create a new POS item
 */
export const createPOSItem: RequestHandler = async (req, res) => {
  try {
    const {
      sku,
      name,
      description,
      category,
      unitPrice,
      quantity,
      reorderLevel,
    } = req.body;

    if (!sku || !name || unitPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: "SKU, name, and unit price are required",
      });
    }

    const item = await db.pOSItem.create({
      data: {
        sku,
        name,
        description: description || undefined,
        category: category || undefined,
        unitPrice,
        quantity: quantity || 0,
        reorderLevel: reorderLevel || 10,
        enabled: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      item,
    });
  } catch (error) {
    console.error("Create POS item error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create inventory item",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get all POS items
 */
export const getPOSItems: RequestHandler = async (_req, res) => {
  try {
    const items = await db.pOSItem.findMany({
      where: { enabled: true },
      orderBy: { name: "asc" },
    });

    return res.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    console.error("Get POS items error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inventory items",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get a single POS item by ID
 */
export const getPOSItemById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await db.pOSItem.findUnique({
      where: { id },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    return res.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error("Get POS item error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inventory item",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Update a POS item
 */
export const updatePOSItem: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      unitPrice,
      quantity,
      reorderLevel,
      enabled,
    } = req.body;

    const item = await db.pOSItem.findUnique({
      where: { id },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (unitPrice !== undefined) updateData.unitPrice = unitPrice;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (reorderLevel !== undefined) updateData.reorderLevel = reorderLevel;
    if (enabled !== undefined) updateData.enabled = enabled;

    const updatedItem = await db.pOSItem.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      message: "Inventory item updated successfully",
      item: updatedItem,
    });
  } catch (error) {
    console.error("Update POS item error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update inventory item",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Delete a POS item (soft delete)
 */
export const deletePOSItem: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await db.pOSItem.findUnique({
      where: { id },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    await db.pOSItem.update({
      where: { id },
      data: { enabled: false },
    });

    return res.json({
      success: true,
      message: "Inventory item deleted successfully",
    });
  } catch (error) {
    console.error("Delete POS item error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete inventory item",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Create a POS transaction
 */
export const createPOSTransaction: RequestHandler = async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      paymentMethod,
      paymentStatus,
      cashier,
      notes,
      items,
    } = req.body;

    if (!totalAmount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Total amount and payment method are required",
      });
    }

    const transaction = await db.pOSTransaction.create({
      data: {
        receiptNumber: `RCP-${Date.now()}`,
        customerId: customerId || undefined,
        customerName: customerName || undefined,
        subtotal: subtotal || totalAmount,
        taxAmount: taxAmount || 0,
        discountAmount: discountAmount || 0,
        totalAmount,
        paymentMethod,
        paymentStatus: paymentStatus || "completed",
        cashier: cashier || undefined,
        notes: notes || undefined,
        items: {
          create:
            items?.map((item: any) => ({
              itemId: item.itemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.quantity * item.unitPrice,
            })) || [],
        },
      },
      include: {
        items: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "POS transaction created successfully",
      transaction,
    });
  } catch (error) {
    console.error("Create POS transaction error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create POS transaction",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get all POS transactions
 */
export const getPOSTransactions: RequestHandler = async (_req, res) => {
  try {
    const transactions = await db.pOSTransaction.findMany({
      include: {
        items: true,
      },
      orderBy: {
        transactionDate: "desc",
      },
    });

    return res.json({
      success: true,
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error("Get POS transactions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch POS transactions",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get a single POS transaction by ID
 */
export const getPOSTransactionById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await db.pOSTransaction.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "POS transaction not found",
      });
    }

    return res.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error("Get POS transaction error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch POS transaction",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
