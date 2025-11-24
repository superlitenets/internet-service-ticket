import {
  MpesaC2BRequest,
  MpesaB2BRequest,
  MpesaStkPushRequest,
  MpesaResponse,
} from "@shared/api";
import { getMpesaSettings } from "./mpesa-settings-storage";

export async function initiateMpesaC2B(
  request: MpesaC2BRequest,
): Promise<MpesaResponse> {
  try {
    const settings = getMpesaSettings();
    const requestData: MpesaC2BRequest = {
      ...request,
      credentials: {
        consumerKey: request.credentials?.consumerKey || settings.consumerKey,
        consumerSecret:
          request.credentials?.consumerSecret || settings.consumerSecret,
        businessShortCode:
          request.credentials?.businessShortCode || settings.businessShortCode,
        passkey: request.credentials?.passkey || settings.passkey,
        callbackUrl: request.credentials?.callbackUrl || settings.callbackUrl,
        initiatorPassword:
          request.credentials?.initiatorPassword || settings.initiatorPassword,
      },
    };

    const response = await fetch("/api/mpesa/c2b", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to initiate C2B payment");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to initiate C2B payment",
    );
  }
}

export async function initiateMpesaB2B(
  request: MpesaB2BRequest,
): Promise<MpesaResponse> {
  try {
    const settings = getMpesaSettings();
    const requestData: MpesaB2BRequest = {
      ...request,
      credentials: {
        consumerKey: request.credentials?.consumerKey || settings.consumerKey,
        consumerSecret:
          request.credentials?.consumerSecret || settings.consumerSecret,
        businessShortCode:
          request.credentials?.businessShortCode || settings.businessShortCode,
        passkey: request.credentials?.passkey || settings.passkey,
        callbackUrl: request.credentials?.callbackUrl || settings.callbackUrl,
        initiatorPassword:
          request.credentials?.initiatorPassword || settings.initiatorPassword,
      },
    };

    const response = await fetch("/api/mpesa/b2b", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to initiate B2B payment");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to initiate B2B payment",
    );
  }
}

export async function initiateMpesaStkPush(
  request: MpesaStkPushRequest,
): Promise<MpesaResponse> {
  try {
    const settings = getMpesaSettings();
    const requestData: MpesaStkPushRequest = {
      ...request,
      credentials: {
        consumerKey: request.credentials?.consumerKey || settings.consumerKey,
        consumerSecret:
          request.credentials?.consumerSecret || settings.consumerSecret,
        businessShortCode:
          request.credentials?.businessShortCode || settings.businessShortCode,
        passkey: request.credentials?.passkey || settings.passkey,
        callbackUrl:
          request.credentials?.callbackUrl ||
          request.callbackUrl ||
          settings.callbackUrl,
        initiatorPassword:
          request.credentials?.initiatorPassword || settings.initiatorPassword,
      },
    };

    const response = await fetch("/api/mpesa/stk-push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to initiate STK push");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to initiate STK push",
    );
  }
}

export async function getMpesaTransactions(): Promise<any[]> {
  try {
    const response = await fetch("/api/mpesa/transactions");

    if (!response.ok) {
      throw new Error("Failed to fetch transactions");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch transactions",
    );
  }
}

export async function getMpesaTransactionStatus(
  transactionId: string,
): Promise<any> {
  try {
    const response = await fetch(`/api/mpesa/transactions/${transactionId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch transaction status");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to fetch transaction status",
    );
  }
}
