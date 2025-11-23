/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * SMS Send Request
 */
export interface SendSmsRequest {
  to: string | string[];
  message: string;
  provider?: string;
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  apiKey?: string;
  partnerId?: string;
  shortcode?: string;
}

/**
 * SMS Send Response
 */
export interface SendSmsResponse {
  success: boolean;
  message: string;
  messageIds?: string[];
  recipients?: number;
  timestamp: string;
  error?: string;
}
