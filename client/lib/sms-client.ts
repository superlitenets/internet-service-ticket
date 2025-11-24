import { SendSmsRequest, SendSmsResponse } from "@shared/api";
import { getSmsSettings } from "./sms-settings-storage";

/**
 * Send SMS messages via the backend API
 * Automatically includes saved provider credentials if not provided
 * @param request - SMS request with recipients, message, and optional provider credentials
 * @returns Promise with SMS response
 */
export async function sendSms(
  request: SendSmsRequest,
): Promise<SendSmsResponse> {
  try {
    // Get saved settings and merge with request
    const savedSettings = getSmsSettings();
    const requestWithSettings = {
      ...request,
      provider: request.provider || savedSettings?.provider,
      accountSid: request.accountSid || savedSettings?.accountSid,
      authToken: request.authToken || savedSettings?.authToken,
      fromNumber: request.fromNumber || savedSettings?.fromNumber,
      apiKey: request.apiKey || savedSettings?.apiKey,
      partnerId: request.partnerId || savedSettings?.partnerId,
      shortcode: request.shortcode || savedSettings?.shortcode,
      customApiUrl:
        (request as any).customApiUrl || savedSettings?.customApiUrl,
    };

    const response = await fetch("/api/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestWithSettings),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as SendSmsResponse;
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = (await response.json()) as SendSmsResponse;
    return data;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send SMS";
    throw new Error(errorMessage);
  }
}

/**
 * Send a single SMS to a phone number
 * Uses saved settings automatically if credentials not provided
 * Supports Twilio, Vonage, AWS SNS, Nexmo, and Advanta SMS
 * @param phoneNumber - Recipient phone number
 * @param message - SMS message content
 * @param credentials - Optional SMS provider credentials (overrides saved settings)
 * @returns Promise with SMS response
 */
export async function sendSmsToPhone(
  phoneNumber: string,
  message: string,
  credentials?: {
    provider?: string;
    accountSid?: string;
    authToken?: string;
    fromNumber?: string;
    apiKey?: string;
    partnerId?: string;
    shortcode?: string;
    customApiUrl?: string;
  },
): Promise<SendSmsResponse> {
  return sendSms({
    to: phoneNumber,
    message,
    ...(credentials || {}),
  });
}

/**
 * Send SMS to multiple phone numbers
 * Uses saved settings automatically if credentials not provided
 * Supports Twilio, Vonage, AWS SNS, Nexmo, and Advanta SMS
 * @param phoneNumbers - Array of recipient phone numbers
 * @param message - SMS message content
 * @param credentials - Optional SMS provider credentials (overrides saved settings)
 * @returns Promise with SMS response
 */
export async function sendSmsBatch(
  phoneNumbers: string[],
  message: string,
  credentials?: {
    provider?: string;
    accountSid?: string;
    authToken?: string;
    fromNumber?: string;
    apiKey?: string;
    partnerId?: string;
    shortcode?: string;
  },
): Promise<SendSmsResponse> {
  return sendSms({
    to: phoneNumbers,
    message,
    ...(credentials || {}),
  });
}
