/**
 * Unified WhatsApp Client
 * Supports both Business API and WhatsApp Web with intelligent failover
 */

import type { SendWhatsAppRequest, SendWhatsAppResponse } from "@shared/api";
import { getWhatsAppConfig } from "./whatsapp-settings-storage";

export type WhatsAppMode = "business" | "web" | "both";

/**
 * Send WhatsApp message using unified method
 * Tries Business API first, falls back to Web if enabled
 */
export async function sendWhatsAppUnified(
  request: SendWhatsAppRequest & {
    mode?: WhatsAppMode;
    failoverEnabled?: boolean;
  },
): Promise<SendWhatsAppResponse> {
  try {
    const config = getWhatsAppConfig();
    const mode = request.mode || config.mode;
    const failoverEnabled = request.failoverEnabled ?? config.failoverEnabled;

    const requestWithConfig = {
      ...request,
      phoneNumberId:
        request.phoneNumberId || config.businessApi.phoneNumberId,
      accessToken: request.accessToken || config.businessApi.accessToken,
      mode,
      failoverEnabled,
    };

    const response = await fetch("/api/whatsapp/send-unified", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestWithConfig),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as SendWhatsAppResponse;
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return (await response.json()) as SendWhatsAppResponse;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send WhatsApp message";
    throw new Error(errorMessage);
  }
}

/**
 * Initialize WhatsApp Web connection
 */
export async function initializeWhatsAppWeb(): Promise<{
  success: boolean;
  message: string;
  qrCode?: string;
}> {
  try {
    const response = await fetch("/api/whatsapp/web/init", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Failed to initialize: ${response.statusText}`);
    }

    return (await response.json()) as {
      success: boolean;
      message: string;
      qrCode?: string;
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to initialize WhatsApp Web";
    throw new Error(errorMessage);
  }
}

/**
 * Get QR code for WhatsApp Web authentication
 */
export async function getWhatsAppQRCode(): Promise<{
  success: boolean;
  qrCode?: string;
  message: string;
}> {
  try {
    const response = await fetch("/api/whatsapp/web/qrcode");

    if (!response.ok) {
      throw new Error(`Failed to get QR code: ${response.statusText}`);
    }

    return (await response.json()) as {
      success: boolean;
      qrCode?: string;
      message: string;
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get QR code";
    throw new Error(errorMessage);
  }
}

/**
 * Check WhatsApp Web authentication status
 */
export async function checkWhatsAppWebStatus(): Promise<{
  authenticated: boolean;
  message: string;
}> {
  try {
    const response = await fetch("/api/whatsapp/web/status");

    if (!response.ok) {
      throw new Error(`Failed to check status: ${response.statusText}`);
    }

    return (await response.json()) as {
      authenticated: boolean;
      message: string;
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to check status";
    throw new Error(errorMessage);
  }
}

/**
 * Logout from WhatsApp Web
 */
export async function logoutWhatsAppWeb(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const response = await fetch("/api/whatsapp/web/logout", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Failed to logout: ${response.statusText}`);
    }

    return (await response.json()) as {
      success: boolean;
      message: string;
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to logout";
    throw new Error(errorMessage);
  }
}

/**
 * Send unified message to a single phone number
 */
export async function sendWhatsAppUnifiedToPhone(
  phoneNumber: string,
  message: string,
  mode: WhatsAppMode = "both",
  failoverEnabled = true,
): Promise<SendWhatsAppResponse> {
  return sendWhatsAppUnified({
    to: phoneNumber,
    message,
    mode,
    failoverEnabled,
  });
}

/**
 * Send unified message to multiple phone numbers
 */
export async function sendWhatsAppUnifiedBatch(
  phoneNumbers: string[],
  message: string,
  mode: WhatsAppMode = "both",
  failoverEnabled = true,
): Promise<SendWhatsAppResponse> {
  return sendWhatsAppUnified({
    to: phoneNumbers,
    message,
    mode,
    failoverEnabled,
  });
}
