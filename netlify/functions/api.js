const crypto = require("crypto");

const users = new Map([
  [
    "admin@example.com",
    {
      id: "user-1",
      name: "Admin User",
      email: "admin@example.com",
      phone: "0700000001",
      role: "admin",
      password: "password123",
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
]);

const sessions = new Map();
let mpesaTransactions = [];
let mpesaTokenCache = null;

function generateToken() {
  return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// MPESA OAuth token cache
async function getMpesaAccessToken(consumerKey, consumerSecret) {
  // Check if token is still valid
  if (mpesaTokenCache && mpesaTokenCache.expiresAt > Date.now() + 60000) {
    return mpesaTokenCache.accessToken;
  }

  try {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
      "base64",
    );

    const response = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("MPESA Token Error:", { status: response.status, data: errorData });
      throw new Error(`Failed to get access token from MPESA: ${errorData.error_description || response.statusText}`);
    }

    const data = await response.json();

    // Cache token
    mpesaTokenCache = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    return data.access_token;
  } catch (error) {
    throw new Error(`Failed to authenticate with MPESA: ${error.message}`);
  }
}

function generateTimestamp() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function generateStkPassword(shortCode, passkey, timestamp) {
  const text = `${shortCode}${passkey}${timestamp}`;
  return Buffer.from(text).toString("base64");
}

async function parseBody(event) {
  if (!event.body) {
    return {};
  }

  if (typeof event.body === "string") {
    try {
      return JSON.parse(event.body);
    } catch (e) {
      return {};
    }
  }

  return event.body;
}

function createJsonResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
}

exports.handler = async (event) => {
  console.log("Netlify Function Debug:", {
    path: event.path,
    rawPath: event.rawPath,
    requestContext: event.requestContext,
    httpMethod: event.httpMethod,
  });

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "OK",
    };
  }

  try {
    const body = await parseBody(event);

    // Auth routes
    if (event.path === "/api/auth/login" && event.httpMethod === "POST") {
      const { identifier, password } = body;

      if (!identifier || !password) {
        return createJsonResponse(400, {
          success: false,
          message: "Identifier and password are required",
        });
      }

      let user = users.get(identifier);

      if (!user) {
        for (const u of users.values()) {
          if (u.phone === identifier || u.email === identifier) {
            user = u;
            break;
          }
        }
      }

      if (!user || !user.active) {
        return createJsonResponse(401, {
          success: false,
          message: "Invalid credentials",
        });
      }

      if (user.password !== password) {
        return createJsonResponse(401, {
          success: false,
          message: "Invalid credentials",
        });
      }

      const token = generateToken();
      sessions.set(token, {
        userId: user.id,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });

      const { password: _, ...userWithoutPassword } = user;

      return createJsonResponse(200, {
        success: true,
        message: `Login successful. Welcome ${user.name}!`,
        user: userWithoutPassword,
        token,
      });
    }

    if (event.path === "/api/auth/verify" && event.httpMethod === "GET") {
      const token = event.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return createJsonResponse(401, {
          success: false,
          message: "No token provided",
        });
      }

      if (!token.startsWith("token_")) {
        return createJsonResponse(401, {
          success: false,
          message: "Invalid token format",
        });
      }

      const session = sessions.get(token);
      if (session) {
        if (session.expiresAt < Date.now()) {
          return createJsonResponse(401, {
            success: false,
            message: "Token expired",
          });
        }

        let user = null;
        for (const u of users.values()) {
          if (u.id === session.userId) {
            user = u;
            break;
          }
        }

        if (!user) {
          return createJsonResponse(404, {
            success: false,
            message: "User not found",
          });
        }

        const { password: _, ...userWithoutPassword } = user;

        return createJsonResponse(200, {
          success: true,
          user: userWithoutPassword,
          message: "Token is valid",
        });
      }

      const tokenParts = token.split("_");
      if (tokenParts.length >= 3) {
        const tokenTime = parseInt(tokenParts[1]);
        const now = Date.now();
        const tokenAge = now - tokenTime;
        const maxTokenAge = 24 * 60 * 60 * 1000;

        if (tokenAge > maxTokenAge) {
          return createJsonResponse(401, {
            success: false,
            message: "Token expired",
          });
        }

        return createJsonResponse(200, {
          success: true,
          message: "Token is valid",
        });
      }

      return createJsonResponse(401, {
        success: false,
        message: "Invalid token",
      });
    }

    if (event.path === "/api/auth/logout" && event.httpMethod === "POST") {
      const token = event.headers.authorization?.replace("Bearer ", "");
      if (token) {
        sessions.delete(token);
      }
      return createJsonResponse(200, {
        success: true,
        message: "Logged out successfully",
      });
    }

    if (event.path === "/api/auth/me" && event.httpMethod === "GET") {
      const token = event.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return createJsonResponse(401, {
          success: false,
          message: "Not authenticated",
        });
      }

      const session = sessions.get(token);
      if (!session || session.expiresAt < Date.now()) {
        return createJsonResponse(401, {
          success: false,
          message: "Invalid or expired token",
        });
      }

      let user = null;
      for (const u of users.values()) {
        if (u.id === session.userId) {
          user = u;
          break;
        }
      }

      if (!user) {
        return createJsonResponse(404, {
          success: false,
          message: "User not found",
        });
      }

      const { password: _, ...userWithoutPassword } = user;

      return createJsonResponse(200, {
        success: true,
        user: userWithoutPassword,
      });
    }

    // SMS routes
    if (event.path === "/api/sms/send" && event.httpMethod === "POST") {
      const {
        to,
        message,
        provider = "twilio",
        accountSid,
        authToken,
        fromNumber,
        apiKey,
        partnerId,
        shortcode,
        customApiUrl,
      } = body;

      if (!to || !message) {
        return createJsonResponse(400, {
          success: false,
          message: "Missing required fields: 'to' and 'message'",
          timestamp: new Date().toISOString(),
          error: "Invalid request",
        });
      }

      if (provider === "twilio") {
        if (!accountSid || !authToken || !fromNumber) {
          return createJsonResponse(400, {
            success: false,
            message:
              "Missing Twilio credentials: accountSid, authToken, fromNumber",
            timestamp: new Date().toISOString(),
            error: "Invalid credentials",
          });
        }
      } else if (provider === "advanta") {
        if (!apiKey || !partnerId || !shortcode) {
          return createJsonResponse(400, {
            success: false,
            message:
              "Missing Advanta SMS credentials: apiKey, partnerId, shortcode",
            timestamp: new Date().toISOString(),
            error: "Invalid credentials",
          });
        }
      }

      const recipients = Array.isArray(to) ? to : [to];
      const validPhoneNumbers = recipients.filter((phone) => {
        return /^\+?1?\d{9,15}$/.test(phone.replace(/\D/g, ""));
      });

      if (validPhoneNumbers.length === 0) {
        return createJsonResponse(400, {
          success: false,
          message: "No valid phone numbers provided",
          timestamp: new Date().toISOString(),
          error: "Invalid phone number",
        });
      }

      if (message.length === 0 || message.length > 1600) {
        return createJsonResponse(400, {
          success: false,
          message: "Message must be between 1 and 1600 characters",
          timestamp: new Date().toISOString(),
          error: "Invalid message",
        });
      }

      const messageIds = validPhoneNumbers.map(
        () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      );

      console.log(`[SMS] Sending via ${provider}`, {
        provider,
        recipients: validPhoneNumbers,
        messageLength: message.length,
        fromNumber,
        customApiUrl,
        timestamp: new Date().toISOString(),
      });

      if (provider === "advanta" && customApiUrl) {
        try {
          const formattedPhones = validPhoneNumbers.map((phone) => {
            const digits = phone.replace(/\D/g, "");
            if (digits.startsWith("0")) {
              return "254" + digits.substring(1);
            }
            if (!digits.startsWith("254")) {
              return "254" + digits;
            }
            return digits;
          });

          const advantaPayload = {
            apikey: apiKey,
            partnerID: partnerId,
            shortcode: shortcode,
            mobile: formattedPhones.join(","),
            message: message,
          };

          console.log("[SMS] Advanta request payload:", advantaPayload);

          const response = await fetch(customApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(advantaPayload),
          });

          const responseText = await response.text();
          console.log("[SMS] Advanta API response status:", response.status);
          console.log("[SMS] Advanta API response body:", responseText);

          if (!response.ok) {
            console.error("[SMS] Advanta API error:", responseText);
            return createJsonResponse(400, {
              success: false,
              message: "Failed to send SMS via Advanta API",
              timestamp: new Date().toISOString(),
              error: `Advanta API error: ${responseText}`,
            });
          }
        } catch (error) {
          console.error("[SMS] Error calling Advanta API:", error.message);
          return createJsonResponse(500, {
            success: false,
            message: "Failed to call SMS provider API",
            timestamp: new Date().toISOString(),
            error: error.message,
          });
        }
      }

      return createJsonResponse(200, {
        success: true,
        message: `SMS sent successfully to ${validPhoneNumbers.length} recipient(s)`,
        messageIds,
        recipients: validPhoneNumbers.length,
        timestamp: new Date().toISOString(),
      });
    }

    // MPESA routes
    if (event.path === "/api/mpesa/stk-push" && event.httpMethod === "POST") {
      const {
        phoneNumber,
        amount,
        accountReference,
        transactionDescription,
        credentials,
      } = body;

      if (
        !phoneNumber ||
        !amount ||
        !accountReference ||
        !transactionDescription
      ) {
        return createJsonResponse(400, {
          success: false,
          message: "Missing required fields",
          timestamp: new Date().toISOString(),
          error: "Invalid request",
        });
      }

      const consumerKey =
        credentials?.consumerKey || process.env.MPESA_CONSUMER_KEY || "";
      const consumerSecret =
        credentials?.consumerSecret || process.env.MPESA_CONSUMER_SECRET || "";
      const shortCode =
        credentials?.businessShortCode ||
        process.env.MPESA_BUSINESS_SHORT_CODE ||
        "";
      const passkey = credentials?.passkey || process.env.MPESA_PASSKEY || "";

      if (!consumerKey || !consumerSecret || !shortCode || !passkey) {
        return createJsonResponse(400, {
          success: false,
          message: "MPESA settings not configured",
          timestamp: new Date().toISOString(),
          error: "Server configuration error",
        });
      }

      try {
        const accessToken = await getMpesaAccessToken(
          consumerKey,
          consumerSecret,
        );
        const formattedPhone = phoneNumber
          .replace(/^0/, "254")
          .replace(/[^0-9]/g, "");
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
          },
        );

        const stkData = await stkResponse.json();

        if (!stkResponse.ok || stkData.ResponseCode !== "0") {
          const errorMsg = stkData.ResponseDescription || stkData.errorMessage || "MPESA API returned an error";
          const fullError = `${errorMsg} (ResponseCode: ${stkData.ResponseCode || "unknown"})`;
          console.error("MPESA STK Push Error:", { status: stkResponse.status, data: stkData });
          throw new Error(fullError);
        }

        const transaction = {
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

        mpesaTransactions.push(transaction);

        return createJsonResponse(200, {
          success: true,
          message: "STK push initiated successfully",
          transactionId: transaction.id,
          checkoutRequestId: stkData.CheckoutRequestID,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("STK Push Error:", error);
        return createJsonResponse(500, {
          success: false,
          message: "Failed to initiate STK push",
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Unknown error",
          details: error instanceof Error ? error.stack : String(error),
        });
      }
    }

    if (event.path === "/api/mpesa/c2b" && event.httpMethod === "POST") {
      const {
        phoneNumber,
        amount,
        accountReference,
        transactionDescription,
        credentials,
      } = body;

      if (
        !phoneNumber ||
        !amount ||
        !accountReference ||
        !transactionDescription
      ) {
        return createJsonResponse(400, {
          success: false,
          message: "Missing required fields",
          timestamp: new Date().toISOString(),
          error: "Invalid request",
        });
      }

      const consumerKey =
        credentials?.consumerKey || process.env.MPESA_CONSUMER_KEY || "";
      const consumerSecret =
        credentials?.consumerSecret || process.env.MPESA_CONSUMER_SECRET || "";
      const shortCode =
        credentials?.businessShortCode ||
        process.env.MPESA_BUSINESS_SHORT_CODE ||
        "";
      const passkey = credentials?.passkey || process.env.MPESA_PASSKEY || "";

      if (!consumerKey || !consumerSecret || !shortCode || !passkey) {
        return createJsonResponse(400, {
          success: false,
          message: "MPESA settings not configured",
          timestamp: new Date().toISOString(),
          error: "Server configuration error",
        });
      }

      try {
        const accessToken = await getMpesaAccessToken(
          consumerKey,
          consumerSecret,
        );
        const formattedPhone = phoneNumber
          .replace(/^0/, "254")
          .replace(/[^0-9]/g, "");
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
          },
        );

        const stkData = await stkResponse.json();

        if (!stkResponse.ok || stkData.ResponseCode !== "0") {
          throw new Error(
            stkData.ResponseDescription || "Failed to initiate C2B payment",
          );
        }

        const transaction = {
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

        mpesaTransactions.push(transaction);

        return createJsonResponse(200, {
          success: true,
          message: "C2B payment initiated successfully",
          transactionId: transaction.id,
          checkoutRequestId: stkData.CheckoutRequestID,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        return createJsonResponse(500, {
          success: false,
          message: "Failed to initiate C2B payment",
          timestamp: new Date().toISOString(),
          error: error.message,
        });
      }
    }

    if (event.path === "/api/mpesa/b2b" && event.httpMethod === "POST") {
      const {
        receiverShortCode,
        amount,
        commandId,
        accountReference,
        transactionDescription,
        credentials,
      } = body;

      if (
        !receiverShortCode ||
        !amount ||
        !commandId ||
        !accountReference ||
        !transactionDescription
      ) {
        return createJsonResponse(400, {
          success: false,
          message: "Missing required fields",
          timestamp: new Date().toISOString(),
          error: "Invalid request",
        });
      }

      const consumerKey =
        credentials?.consumerKey || process.env.MPESA_CONSUMER_KEY || "";
      const consumerSecret =
        credentials?.consumerSecret || process.env.MPESA_CONSUMER_SECRET || "";
      const senderShortCode =
        credentials?.businessShortCode ||
        process.env.MPESA_BUSINESS_SHORT_CODE ||
        "";
      const initiatorPassword =
        credentials?.initiatorPassword ||
        process.env.MPESA_INITIATOR_PASSWORD ||
        "";

      if (!consumerKey || !consumerSecret || !senderShortCode) {
        return createJsonResponse(400, {
          success: false,
          message: "MPESA settings not configured",
          timestamp: new Date().toISOString(),
          error: "Server configuration error",
        });
      }

      try {
        const accessToken = await getMpesaAccessToken(
          consumerKey,
          consumerSecret,
        );

        const b2bPayload = {
          InitiatorName: "testapi",
          InitiatorPassword: initiatorPassword,
          CommandID: commandId,
          SenderIdentifierType: "4",
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
          },
        );

        const b2bData = await b2bResponse.json();

        if (!b2bResponse.ok || b2bData.ResponseCode !== "0") {
          throw new Error(
            b2bData.ResponseDescription || "Failed to initiate B2B payment",
          );
        }

        const transaction = {
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

        mpesaTransactions.push(transaction);

        return createJsonResponse(200, {
          success: true,
          message: "B2B payment initiated successfully",
          transactionId: transaction.id,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        return createJsonResponse(500, {
          success: false,
          message: "Failed to initiate B2B payment",
          timestamp: new Date().toISOString(),
          error: error.message,
        });
      }
    }

    if (
      event.path === "/api/mpesa/transactions" &&
      event.httpMethod === "GET"
    ) {
      return createJsonResponse(200, mpesaTransactions);
    }

    if (
      event.path.match(/^\/api\/mpesa\/transactions\/[^/]+$/) &&
      event.httpMethod === "GET"
    ) {
      const transactionId = event.path.split("/").pop();
      const transaction = mpesaTransactions.find((t) => t.id === transactionId);

      if (!transaction) {
        return createJsonResponse(404, {
          success: false,
          message: "Transaction not found",
          timestamp: new Date().toISOString(),
          error: "Not found",
        });
      }

      return createJsonResponse(200, transaction);
    }

    if (event.path === "/api/mpesa/callback" && event.httpMethod === "POST") {
      const { Body } = body;

      if (!Body) {
        return createJsonResponse(400, {
          ResultCode: 1,
          ResultDesc: "Invalid callback format",
        });
      }

      const { stkCallback } = Body;

      if (!stkCallback) {
        return createJsonResponse(400, {
          ResultCode: 1,
          ResultDesc: "Invalid callback format",
        });
      }

      const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
        stkCallback;

      const transaction = mpesaTransactions.find(
        (t) => t.transactionId === CheckoutRequestID,
      );

      if (transaction) {
        transaction.status = ResultCode === 0 ? "completed" : "failed";
        transaction.resultCode = ResultCode;
        transaction.resultDescription = ResultDesc;

        if (ResultCode === 0 && CallbackMetadata && CallbackMetadata.Item) {
          const items = {};
          for (const item of CallbackMetadata.Item) {
            items[item.Name] = item.Value;
          }
          transaction.mpesaReceiptNumber = items.MpesaReceiptNumber;
        }

        transaction.updatedAt = new Date().toISOString();
      }

      return createJsonResponse(200, {
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    }

    if (event.path === "/api/mpesa/validation" && event.httpMethod === "POST") {
      return createJsonResponse(200, {
        ResultCode: 0,
        ResultDesc: "Validation accepted",
      });
    }

    // Accounting - Chart of Accounts
    if (
      event.path === "/api/accounting/accounts" &&
      event.httpMethod === "GET"
    ) {
      return createJsonResponse(200, [
        {
          id: "1000",
          accountCode: "1000",
          accountName: "Cash",
          type: "Asset",
          category: "Cash",
          balance: 0,
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    }

    // Accounting - General Ledger
    if (event.path === "/api/accounting/ledger" && event.httpMethod === "GET") {
      return createJsonResponse(200, []);
    }

    // Accounting - Expenses
    if (
      event.path === "/api/accounting/expenses" &&
      event.httpMethod === "GET"
    ) {
      return createJsonResponse(200, []);
    }

    // Accounting - Expense Categories
    if (
      event.path === "/api/accounting/expense-categories" &&
      event.httpMethod === "GET"
    ) {
      return createJsonResponse(200, []);
    }

    // POS - Items
    if (event.path === "/api/pos/items" && event.httpMethod === "GET") {
      return createJsonResponse(200, []);
    }

    // POS - Transactions
    if (event.path === "/api/pos/transactions" && event.httpMethod === "GET") {
      return createJsonResponse(200, []);
    }

    // Accounting - Summary
    if (
      event.path === "/api/accounting/summary" &&
      event.httpMethod === "GET"
    ) {
      return createJsonResponse(200, {
        id: "summary",
        summaryDate: new Date().toISOString(),
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Accounting - Trial Balance
    if (
      event.path === "/api/accounting/trial-balance" &&
      event.httpMethod === "GET"
    ) {
      return createJsonResponse(200, {
        items: [],
        totalDebit: 0,
        totalCredit: 0,
        isBalanced: true,
      });
    }

    // Demo route
    if (event.path === "/api/demo" && event.httpMethod === "GET") {
      return createJsonResponse(200, {
        message: "Hello from the server!",
      });
    }

    // Ping route
    if (event.path === "/api/ping" && event.httpMethod === "GET") {
      return createJsonResponse(200, { message: "pong" });
    }

    console.log("No route matched for:", {
      path: event.path,
      method: event.httpMethod,
    });
    return createJsonResponse(404, {
      error: "Not found",
      debug: {
        path: event.path,
        method: event.httpMethod,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return createJsonResponse(500, {
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
