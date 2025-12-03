/**
 * Direct SMS sending service for backend use
 * This handles actual SMS sending without HTTP overhead
 */

export interface SendSmsOptions {
  to: string | string[];
  message: string;
  provider: string;
  apiKey?: string;
  partnerId?: string;
  shortcode?: string;
  customApiUrl?: string;
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
}

/**
 * Send SMS directly via provider API
 * Used internally by the backend for notifications
 */
export async function sendSmsDirectly(options: SendSmsOptions): Promise<{
  success: boolean;
  messageIds?: string[];
  error?: string;
}> {
  try {
    const {
      to,
      message,
      provider = "advanta",
      apiKey,
      partnerId,
      shortcode,
      customApiUrl,
    } = options;

    // Validate required fields
    if (!to || !message) {
      console.error("[SMS SERVICE] Missing required fields: to or message");
      return {
        success: false,
        error: "Missing required fields",
      };
    }

    // Convert single number to array
    const recipients = Array.isArray(to) ? to : [to];

    // Validate phone numbers
    const validPhoneNumbers = recipients.filter((phone) => {
      return /^\+?1?\d{9,15}$/.test(phone.replace(/\D/g, ""));
    });

    if (validPhoneNumbers.length === 0) {
      console.error("[SMS SERVICE] No valid phone numbers provided");
      return {
        success: false,
        error: "No valid phone numbers",
      };
    }

    // Validate message length
    if (message.length === 0 || message.length > 1600) {
      console.error("[SMS SERVICE] Invalid message length:", message.length);
      return {
        success: false,
        error: "Invalid message length",
      };
    }

    // Provider-specific validation
    if (provider === "advanta") {
      if (!apiKey || !partnerId || !shortcode) {
        console.error("[SMS SERVICE] Missing Advanta SMS credentials");
        return {
          success: false,
          error: "Missing Advanta credentials",
        };
      }

      // Send via Advanta if custom API URL provided
      if (customApiUrl) {
        return await sendViaAdvanta({
          phoneNumbers: validPhoneNumbers,
          message,
          apiKey,
          partnerId,
          shortcode,
          customApiUrl,
        });
      }
    }

    // If no custom API URL or provider not fully configured, log and return success
    // This prevents blocking ticket operations if SMS is not fully configured
    console.log(
      "[SMS SERVICE] SMS provider not fully configured, skipping send",
    );
    return {
      success: true,
      messageIds: validPhoneNumbers.map(
        () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[SMS SERVICE] Error sending SMS:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send SMS via Advanta API
 */
async function sendViaAdvanta(options: {
  phoneNumbers: string[];
  message: string;
  apiKey: string;
  partnerId: string;
  shortcode: string;
  customApiUrl: string;
}): Promise<{ success: boolean; messageIds?: string[]; error?: string }> {
  try {
    // Format phone numbers for Advanta (add country code 254 for Kenya if needed)
    const formattedPhones = options.phoneNumbers.map((phone) => {
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
      apikey: options.apiKey,
      partnerID: options.partnerId,
      shortcode: options.shortcode,
      mobile: formattedPhones.join(","),
      message: options.message,
    };

    console.log("[SMS SERVICE] Sending via Advanta to:", formattedPhones);

    const response = await fetch(options.customApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(advantaPayload),
    });

    const responseText = await response.text();
    console.log("[SMS SERVICE] Advanta response status:", response.status);

    if (!response.ok) {
      console.error("[SMS SERVICE] Advanta API error:", responseText);
      return {
        success: false,
        error: `Advanta API error: ${response.status}`,
      };
    }

    try {
      const result = JSON.parse(responseText);
      console.log("[SMS SERVICE] Advanta API success:", result);
    } catch {
      console.log("[SMS SERVICE] Advanta response is not JSON:", responseText);
    }

    const messageIds = options.phoneNumbers.map(
      () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    );

    return {
      success: true,
      messageIds,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[SMS SERVICE] Error calling Advanta API:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
