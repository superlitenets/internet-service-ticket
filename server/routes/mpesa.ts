import { RequestHandler } from "express";
import {
  MpesaC2BRequest,
  MpesaB2BRequest,
  MpesaStkPushRequest,
  MpesaResponse,
  MpesaTransaction,
} from "@shared/api";

// In-memory transaction storage (for demo purposes)
let transactions: MpesaTransaction[] = [];

// MPESA OAuth token cache
let tokenCache: { accessToken: string; expiresAt: number } | null = null;

/**
 * Get MPESA Access Token from Daraja API
 */
async function getMpesaAccessToken(
  consumerKey: string,
  consumerSecret: string
): Promise<string> {
  // Check if token is still valid
  if (
    tokenCache &&
    tokenCache.expiresAt > Date.now() + 60000 // 1 minute buffer
  ) {
    return tokenCache.accessToken;
  }

  try {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
      "base64"
    );

    const response = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get access token from MPESA");
    }

    const data: any = await response.json();

    // Cache token (typically expires in 3600 seconds)
    tokenCache = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    return data.access_token;
  } catch (error) {
    throw new Error(
      `Failed to authenticate with MPESA: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate timestamp in format: YYYYMMDDHHMMSS
 */
function generateTimestamp(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Generate password for STK Push (Base64 encoded)
 */
function generateStkPassword(
  shortCode: string,
  passkey: string,
  timestamp: string
): string {
  const text = `${shortCode}${passkey}${timestamp}`;
  return Buffer.from(text).toString("base64");
}

/**
 * C2B Payment Initiation
 */
export const handleMpesaC2B: RequestHandler<
  unknown,
  MpesaResponse,
  MpesaC2BRequest
> = async (req, res) => {
  try {
    const { phoneNumber, amount, accountReference, transactionDescription, credentials } =
      req.body;

    // Validation
    if (!phoneNumber || !amount || !accountReference || !transactionDescription) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        timestamp: new Date().toISOString(),
        error: "Invalid request",
      });
    }

    // Get MPESA settings from request or environment
    const consumerKey = credentials?.consumerKey || process.env.MPESA_CONSUMER_KEY || "";
    const consumerSecret = credentials?.consumerSecret || process.env.MPESA_CONSUMER_SECRET || "";
    const shortCode = credentials?.businessShortCode || process.env.MPESA_BUSINESS_SHORT_CODE || "";
    const passkey = credentials?.passkey || process.env.MPESA_PASSKEY || "";

    if (!consumerKey || !consumerSecret || !shortCode || !passkey) {
      return res.status(400).json({
        success: false,
        message: "MPESA settings not configured",
        timestamp: new Date().toISOString(),
        error: "Server configuration error",
      });
    }

    // Get access token
    const accessToken = await getMpesaAccessToken(consumerKey, consumerSecret);

    // Format phone number (Safaricom expects 254XXXXXXXXX format)
    const formattedPhone = phoneNumber
      .replace(/^0/, "254")
      .replace(/[^0-9]/g, "");

    // Initiate C2B payment via STK Push for better user experience
    const timestamp = generateTimestamp();
    const password = generateStkPassword(shortCode, passkey, timestamp);

    const stkPushPayload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: shortCode,
      PhoneNumber: formattedPhone,
      CallBackURL:
        process.env.MPESA_CALLBACK_URL ||
        "https://example.com/mpesa/callback",
      AccountReference: accountReference,
      TransactionDesc: transactionDescription,
    };

    const stkResponse = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stkPushPayload),
      }
    );

    const stkData: any = await stkResponse.json();

    if (!stkResponse.ok || stkData.ResponseCode !== "0") {
      throw new Error(
        stkData.ResponseDescription || "Failed to initiate C2B payment"
      );
    }

    // Store transaction record
    const transaction: MpesaTransaction = {
      id: `TXN-${Date.now()}`,
      transactionId: stkData.CheckoutRequestID || "",
      type: "C2B",
      phoneNumber: formattedPhone,
      amount,
      accountReference,
      description: transactionDescription,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    transactions.push(transaction);

    return res.json({
      success: true,
      message: "C2B payment initiated successfully",
      transactionId: transaction.id,
      checkoutRequestId: stkData.CheckoutRequestID,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to initiate C2B payment",
      timestamp: new Date().toISOString(),
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * B2B Payment Initiation
 */
export const handleMpesaB2B: RequestHandler<
  unknown,
  MpesaResponse,
  MpesaB2BRequest
> = async (req, res) => {
  try {
    const {
      receiverShortCode,
      amount,
      commandId,
      accountReference,
      transactionDescription,
      credentials,
    } = req.body;

    // Validation
    if (
      !receiverShortCode ||
      !amount ||
      !commandId ||
      !accountReference ||
      !transactionDescription
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        timestamp: new Date().toISOString(),
        error: "Invalid request",
      });
    }

    // Get MPESA settings from request or environment
    const consumerKey = credentials?.consumerKey || process.env.MPESA_CONSUMER_KEY || "";
    const consumerSecret = credentials?.consumerSecret || process.env.MPESA_CONSUMER_SECRET || "";
    const senderShortCode = credentials?.businessShortCode || process.env.MPESA_BUSINESS_SHORT_CODE || "";

    if (!consumerKey || !consumerSecret || !senderShortCode) {
      return res.status(400).json({
        success: false,
        message: "MPESA settings not configured",
        timestamp: new Date().toISOString(),
        error: "Server configuration error",
      });
    }

    // Get access token
    const accessToken = await getMpesaAccessToken(consumerKey, consumerSecret);

    const b2bPayload = {
      InitiatorName: "testapi",
      InitiatorPassword: process.env.MPESA_INITIATOR_PASSWORD || "",
      CommandID: commandId, // "BusinessPayBill" or "MerchantToMerchantTransfer" or "SendRemittance"
      SenderIdentifierType: "4", // 4 = Organization shortcode
      RecieverIdentifierType: "4",
      Amount: Math.round(amount),
      PartyA: senderShortCode,
      PartyB: receiverShortCode,
      Remarks: transactionDescription,
      QueueTimeOutURL:
        process.env.MPESA_TIMEOUT_URL ||
        "https://example.com/mpesa/timeout",
      ResultURL:
        process.env.MPESA_RESULT_URL || "https://example.com/mpesa/result",
      AccountReference: accountReference,
    };

    const b2bResponse = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/b2b/v1/paymentrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(b2bPayload),
      }
    );

    const b2bData: any = await b2bResponse.json();

    if (
      !b2bResponse.ok ||
      b2bData.ResponseCode !== "0"
    ) {
      throw new Error(b2bData.ResponseDescription || "Failed to initiate B2B payment");
    }

    // Store transaction record
    const transaction: MpesaTransaction = {
      id: `TXN-${Date.now()}`,
      transactionId: b2bData.ConversationID || "",
      type: "B2B",
      phoneNumber: senderShortCode,
      amount,
      accountReference,
      description: transactionDescription,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    transactions.push(transaction);

    return res.json({
      success: true,
      message: "B2B payment initiated successfully",
      transactionId: transaction.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to initiate B2B payment",
      timestamp: new Date().toISOString(),
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * STK Push Payment Initiation
 */
export const handleMpesaStkPush: RequestHandler<
  unknown,
  MpesaResponse,
  MpesaStkPushRequest
> = async (req, res) => {
  try {
    const {
      phoneNumber,
      amount,
      accountReference,
      transactionDescription,
      callbackUrl,
      credentials,
    } = req.body;

    // Validation
    if (!phoneNumber || !amount || !accountReference || !transactionDescription) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        timestamp: new Date().toISOString(),
        error: "Invalid request",
      });
    }

    // Get MPESA settings from request or environment
    const consumerKey = credentials?.consumerKey || process.env.MPESA_CONSUMER_KEY || "";
    const consumerSecret = credentials?.consumerSecret || process.env.MPESA_CONSUMER_SECRET || "";
    const shortCode = credentials?.businessShortCode || process.env.MPESA_BUSINESS_SHORT_CODE || "";
    const passkey = credentials?.passkey || process.env.MPESA_PASSKEY || "";

    if (!consumerKey || !consumerSecret || !shortCode || !passkey) {
      return res.status(400).json({
        success: false,
        message: "MPESA settings not configured",
        timestamp: new Date().toISOString(),
        error: "Server configuration error",
      });
    }

    // Get access token
    const accessToken = await getMpesaAccessToken(consumerKey, consumerSecret);

    // Format phone number
    const formattedPhone = phoneNumber
      .replace(/^0/, "254")
      .replace(/[^0-9]/g, "");

    // Generate timestamp and password
    const timestamp = generateTimestamp();
    const password = generateStkPassword(shortCode, passkey, timestamp);

    const stkPayload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: shortCode,
      PhoneNumber: formattedPhone,
      CallBackURL:
        callbackUrl ||
        process.env.MPESA_CALLBACK_URL ||
        "https://example.com/mpesa/callback",
      AccountReference: accountReference,
      TransactionDesc: transactionDescription,
    };

    const stkResponse = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stkPayload),
      }
    );

    const stkData: any = await stkResponse.json();

    if (!stkResponse.ok || stkData.ResponseCode !== "0") {
      throw new Error(
        stkData.ResponseDescription || "Failed to initiate STK push"
      );
    }

    // Store transaction record
    const transaction: MpesaTransaction = {
      id: `TXN-${Date.now()}`,
      transactionId: stkData.CheckoutRequestID || "",
      type: "STK_PUSH",
      phoneNumber: formattedPhone,
      amount,
      accountReference,
      description: transactionDescription,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    transactions.push(transaction);

    return res.json({
      success: true,
      message: "STK push initiated successfully",
      transactionId: transaction.id,
      checkoutRequestId: stkData.CheckoutRequestID,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to initiate STK push",
      timestamp: new Date().toISOString(),
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get all MPESA transactions
 */
export const getMpesaTransactions: RequestHandler = (_req, res) => {
  try {
    return res.json(transactions);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      timestamp: new Date().toISOString(),
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get MPESA transaction by ID
 */
export const getMpesaTransaction: RequestHandler = (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = transactions.find((t) => t.id === transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
        timestamp: new Date().toISOString(),
        error: "Not found",
      });
    }

    return res.json(transaction);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transaction",
      timestamp: new Date().toISOString(),
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Handle MPESA callbacks (C2B confirmation)
 */
export const handleMpesaCallback: RequestHandler = (req, res) => {
  try {
    const { Body } = req.body;

    if (!Body) {
      return res.status(400).json({
        ResultCode: 1,
        ResultDesc: "Invalid callback format",
      });
    }

    const { stkCallback } = Body;

    if (!stkCallback) {
      return res.status(400).json({
        ResultCode: 1,
        ResultDesc: "Invalid callback format",
      });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
      stkCallback;

    // Find and update transaction
    const transaction = transactions.find(
      (t) => t.transactionId === CheckoutRequestID
    );

    if (transaction) {
      transaction.status = ResultCode === 0 ? "completed" : "failed";
      transaction.resultCode = ResultCode;
      transaction.resultDescription = ResultDesc;

      // Extract payment details if successful
      if (
        ResultCode === 0 &&
        CallbackMetadata &&
        CallbackMetadata.Item
      ) {
        const items: any = {};
        for (const item of CallbackMetadata.Item) {
          items[item.Name] = item.Value;
        }
        transaction.mpesaReceiptNumber = items.MpesaReceiptNumber;
      }

      transaction.updatedAt = new Date().toISOString();
    }

    // Return success to MPESA
    return res.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } catch (error) {
    return res.status(500).json({
      ResultCode: 1,
      ResultDesc: "Server error",
    });
  }
};

/**
 * Handle MPESA validation (for C2B)
 */
export const handleMpesaValidation: RequestHandler = (req, res) => {
  try {
    // Perform validation checks here
    // Return 0 to accept, 1 to reject

    return res.json({
      ResultCode: 0,
      ResultDesc: "Validation accepted",
    });
  } catch (error) {
    return res.status(500).json({
      ResultCode: 1,
      ResultDesc: "Validation failed",
    });
  }
};
