import { RequestHandler } from "express";
import { db } from "../lib/db";

/**
 * Create a new payment
 */
export const createPayment: RequestHandler = async (req, res) => {
  try {
    const {
      invoiceId,
      accountId,
      userId,
      customerId,
      amount,
      paymentMethod,
      mpesaReceiptNumber,
      transactionId,
      status,
    } = req.body;

    if (!accountId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Account ID, amount, and payment method are required",
      });
    }

    const payment = await db.payment.create({
      data: {
        invoiceId: invoiceId || undefined,
        accountId,
        userId: userId || undefined,
        customerId: customerId || undefined,
        amount,
        paymentMethod,
        mpesaReceiptNumber: mpesaReceiptNumber || undefined,
        transactionId: transactionId || undefined,
        status: status || "pending",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Payment created successfully",
      payment,
    });
  } catch (error) {
    console.error("Create payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create payment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get all payments
 */
export const getPayments: RequestHandler = async (_req, res) => {
  try {
    const payments = await db.payment.findMany({
      orderBy: {
        paymentDate: "desc",
      },
    });

    return res.json({
      success: true,
      payments,
      count: payments.length,
    });
  } catch (error) {
    console.error("Get payments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get a single payment by ID
 */
export const getPaymentById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await db.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    return res.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Get payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get payments by invoice ID
 */
export const getPaymentsByInvoice: RequestHandler = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const payments = await db.payment.findMany({
      where: { invoiceId },
      orderBy: {
        paymentDate: "desc",
      },
    });

    return res.json({
      success: true,
      payments,
      count: payments.length,
    });
  } catch (error) {
    console.error("Get invoice payments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoice payments",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get payments by customer ID
 */
export const getPaymentsByCustomer: RequestHandler = async (req, res) => {
  try {
    const { customerId } = req.params;

    const payments = await db.payment.findMany({
      where: { customerId },
      orderBy: {
        paymentDate: "desc",
      },
    });

    return res.json({
      success: true,
      payments,
      count: payments.length,
    });
  } catch (error) {
    console.error("Get customer payments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer payments",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Update a payment
 */
export const updatePayment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, amount, paymentMethod } = req.body;

    const payment = await db.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const updateData: any = {};

    if (status !== undefined) updateData.status = status;
    if (amount !== undefined) updateData.amount = amount;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;

    const updatedPayment = await db.payment.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      message: "Payment updated successfully",
      payment: updatedPayment,
    });
  } catch (error) {
    console.error("Update payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update payment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Delete a payment
 */
export const deletePayment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await db.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    await db.payment.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Payment deleted successfully",
    });
  } catch (error) {
    console.error("Delete payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete payment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
