import type { SendWhatsAppRequest, SendWhatsAppResponse } from "@shared/api";
import { getWhatsAppConfig } from "./whatsapp-settings-storage";

/**
 * Send WhatsApp message via backend API
 * Automatically includes saved WhatsApp configuration if not provided
 * @param request - WhatsApp request with recipients, message, and optional config
 * @returns Promise with WhatsApp response
 */
export async function sendWhatsApp(
  request: SendWhatsAppRequest,
): Promise<SendWhatsAppResponse> {
  try {
    // Get saved config and merge with request
    const savedConfig = getWhatsAppConfig();
    const requestWithConfig = {
      ...request,
      phoneNumberId: request.phoneNumberId || savedConfig.phoneNumberId,
      accessToken: request.accessToken || savedConfig.accessToken,
    };

    const response = await fetch("/api/whatsapp/send", {
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

    const data = (await response.json()) as SendWhatsAppResponse;
    return data;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send WhatsApp message";
    throw new Error(errorMessage);
  }
}

/**
 * Send a single WhatsApp message
 * Uses saved configuration automatically if not provided
 * @param phoneNumber - Recipient phone number (with country code, e.g., +1234567890)
 * @param message - Message content
 * @param config - Optional WhatsApp configuration (overrides saved config)
 * @returns Promise with WhatsApp response
 */
export async function sendWhatsAppToPhone(
  phoneNumber: string,
  message: string,
  config?: {
    phoneNumberId?: string;
    accessToken?: string;
  },
): Promise<SendWhatsAppResponse> {
  return sendWhatsApp({
    to: phoneNumber,
    message,
    ...(config || {}),
  });
}

/**
 * Send WhatsApp to multiple phone numbers
 * Uses saved configuration automatically if not provided
 * @param phoneNumbers - Array of recipient phone numbers (with country codes)
 * @param message - Message content
 * @param config - Optional WhatsApp configuration (overrides saved config)
 * @returns Promise with WhatsApp response
 */
export async function sendWhatsAppBatch(
  phoneNumbers: string[],
  message: string,
  config?: {
    phoneNumberId?: string;
    accessToken?: string;
  },
): Promise<SendWhatsAppResponse> {
  return sendWhatsApp({
    to: phoneNumbers,
    message,
    ...(config || {}),
  });
}

/**
 * Test WhatsApp connection
 */
export async function testWhatsAppConnection(
  phoneNumberId: string,
  accessToken: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch("/api/whatsapp/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumberId, accessToken }),
    });

    if (!response.ok) {
      throw new Error(`Failed to test connection: ${response.statusText}`);
    }

    return (await response.json()) as { success: boolean; message: string };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to test WhatsApp connection";
    throw new Error(errorMessage);
  }
}
