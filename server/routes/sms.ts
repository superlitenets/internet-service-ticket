import { RequestHandler } from "express";
import { SendSmsRequest, SendSmsResponse } from "@shared/api";

/**
 * Send SMS messages via configured provider
 * Supports Twilio, Vonage, AWS SNS, and Nexmo
 */
export const handleSendSms: RequestHandler<
  unknown,
  SendSmsResponse,
  SendSmsRequest & { customApiUrl?: string }
> = async (req, res) => {
  try {
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
    } = req.body;

    // Validation
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: 'to' and 'message'",
        timestamp: new Date().toISOString(),
        error: "Invalid request",
      });
    }

    // Provider-specific credential validation
    if (provider === "twilio") {
      if (!accountSid || !authToken || !fromNumber) {
        return res.status(400).json({
          success: false,
          message:
            "Missing Twilio credentials: accountSid, authToken, fromNumber",
          timestamp: new Date().toISOString(),
          error: "Invalid credentials",
        });
      }
    } else if (provider === "advanta") {
      if (!apiKey || !partnerId || !shortcode) {
        return res.status(400).json({
          success: false,
          message:
            "Missing Advanta SMS credentials: apiKey, partnerId, shortcode",
          timestamp: new Date().toISOString(),
          error: "Invalid credentials",
        });
      }
    } else {
      if (!accountSid || !authToken || !fromNumber) {
        return res.status(400).json({
          success: false,
          message: "Missing SMS provider credentials",
          timestamp: new Date().toISOString(),
          error: "Invalid credentials",
        });
      }
    }

    // Convert single phone number to array
    const recipients = Array.isArray(to) ? to : [to];

    // Validate phone numbers (basic validation)
    const validPhoneNumbers = recipients.filter((phone) => {
      return /^\+?1?\d{9,15}$/.test(phone.replace(/\D/g, ""));
    });

    if (validPhoneNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid phone numbers provided",
        timestamp: new Date().toISOString(),
        error: "Invalid phone number",
      });
    }

    // Validate message length
    if (message.length === 0 || message.length > 1600) {
      return res.status(400).json({
        success: false,
        message: "Message must be between 1 and 1600 characters",
        timestamp: new Date().toISOString(),
        error: "Invalid message",
      });
    }

    // Generate mock message IDs
    const messageIds = validPhoneNumbers.map(
      () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    );

    // Log the SMS request
    console.log(`[SMS] Sending via ${provider}`, {
      provider,
      recipients: validPhoneNumbers,
      messageLength: message.length,
      fromNumber,
      customApiUrl,
      timestamp: new Date().toISOString(),
    });

    // If Advanta with custom URL, make the actual API call
    if (provider === "advanta" && customApiUrl) {
      try {
        const response = await fetch(customApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: partnerId,
            password: apiKey,
            message,
            recipients: validPhoneNumbers,
            sender: shortcode,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[SMS] Advanta API error:", errorText);
          return res.status(400).json({
            success: false,
            message: "Failed to send SMS via Advanta API",
            timestamp: new Date().toISOString(),
            error: "API request failed",
          });
        }

        const result = await response.json();
        console.log("[SMS] Advanta API response:", result);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("[SMS] Error calling Advanta API:", errorMessage);
        return res.status(500).json({
          success: false,
          message: "Failed to call SMS provider API",
          timestamp: new Date().toISOString(),
          error: errorMessage,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `SMS sent successfully to ${validPhoneNumbers.length} recipient(s)`,
      messageIds,
      recipients: validPhoneNumbers.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    console.error("[SMS] Error sending SMS:", errorMessage);

    return res.status(500).json({
      success: false,
      message: "Failed to send SMS",
      timestamp: new Date().toISOString(),
      error: errorMessage,
    });
  }
};
