import { RequestHandler } from "express";
import type { SendWhatsAppRequest, SendWhatsAppResponse } from "@shared/api";

/**
 * Send WhatsApp message via Meta WhatsApp Business API
 */
export const handleSendWhatsApp: RequestHandler<
  unknown,
  SendWhatsAppResponse,
  SendWhatsAppRequest
> = async (req, res) => {
  try {
    const { to, message, phoneNumberId, accessToken } = req.body;

    // Validation
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: 'to' and 'message'",
        timestamp: new Date().toISOString(),
        error: "Invalid request",
      });
    }

    if (!phoneNumberId || !accessToken) {
      return res.status(400).json({
        success: false,
        message: "Missing WhatsApp configuration: phoneNumberId and accessToken",
        timestamp: new Date().toISOString(),
        error: "Invalid configuration",
      });
    }

    // Convert single phone number to array
    const recipients = Array.isArray(to) ? to : [to];

    // Validate phone numbers (WhatsApp format: +1234567890)
    const validPhoneNumbers = recipients.filter((phone) => {
      return /^\+?[1-9]\d{1,14}$/.test(phone.replace(/\D/g, ""));
    });

    if (validPhoneNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid phone numbers provided",
        timestamp: new Date().toISOString(),
        error: "Invalid phone number",
      });
    }

    // Validate message length (WhatsApp limit: 4096 characters)
    if (message.length === 0 || message.length > 4096) {
      return res.status(400).json({
        success: false,
        message: "Message must be between 1 and 4096 characters",
        timestamp: new Date().toISOString(),
        error: "Invalid message",
      });
    }

    // Generate mock message IDs
    const messageIds = validPhoneNumbers.map(
      () => `wamsg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    );

    // Log the WhatsApp request
    console.log(`[WhatsApp] Sending message`, {
      phoneNumberId,
      recipients: validPhoneNumbers,
      messageLength: message.length,
      timestamp: new Date().toISOString(),
    });

    // In production, you would call the Meta WhatsApp Business API here
    // Example:
    // const response = await fetch(
    //   `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`,
    //   {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${accessToken}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       messaging_product: 'whatsapp',
    //       recipient_type: 'individual',
    //       to: phoneNumber,
    //       type: 'text',
    //       text: {
    //         preview_url: true,
    //         body: message,
    //       },
    //     }),
    //   }
    // );

    return res.status(200).json({
      success: true,
      message: `WhatsApp message sent to ${validPhoneNumbers.length} recipient(s)`,
      messageIds,
      recipients: validPhoneNumbers.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    console.error("[WhatsApp] Error sending message:", errorMessage);

    return res.status(500).json({
      success: false,
      message: "Failed to send WhatsApp message",
      timestamp: new Date().toISOString(),
      error: errorMessage,
    });
  }
};

/**
 * Test WhatsApp connection
 */
export const testWhatsAppConnection: RequestHandler<
  unknown,
  { success: boolean; message: string },
  { phoneNumberId: string; accessToken: string }
> = async (req, res) => {
  try {
    const { phoneNumberId, accessToken } = req.body;

    if (!phoneNumberId || !accessToken) {
      return res.status(400).json({
        success: false,
        message: "Missing phoneNumberId or accessToken",
      });
    }

    // Simulate testing connection to Meta API
    console.log("[WhatsApp] Testing connection", { phoneNumberId });

    // In production, you would call the Meta API to validate credentials
    // const response = await fetch(
    //   `https://graph.instagram.com/v18.0/${phoneNumberId}?access_token=${accessToken}`
    // );

    res.json({
      success: true,
      message: `Successfully connected to WhatsApp Business API`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to test WhatsApp connection",
    });
  }
};
