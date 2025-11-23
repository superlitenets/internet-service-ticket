import { SendSmsRequest, SendSmsResponse } from "@shared/api";

/**
 * Send SMS messages via the backend API
 * @param request - SMS request with recipients, message, and optional provider credentials
 * @returns Promise with SMS response
 */
export async function sendSms(
  request: SendSmsRequest,
): Promise<SendSmsResponse> {
  try {
    const response = await fetch("/api/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
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
 * @param phoneNumber - Recipient phone number
 * @param message - SMS message content
 * @param credentials - Optional SMS provider credentials
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
  },
): Promise<SendSmsResponse> {
  return sendSms({
    to: phoneNumber,
    message,
    ...credentials,
  });
}

/**
 * Send SMS to multiple phone numbers
 * @param phoneNumbers - Array of recipient phone numbers
 * @param message - SMS message content
 * @param credentials - Optional SMS provider credentials
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
  },
): Promise<SendSmsResponse> {
  return sendSms({
    to: phoneNumbers,
    message,
    ...credentials,
  });
}
