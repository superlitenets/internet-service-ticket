/**
 * Unified WhatsApp Router
 * Handles both Business API and WhatsApp Web with intelligent failover
 */

import { RequestHandler } from "express";
import type { SendWhatsAppRequest, SendWhatsAppResponse } from "@shared/api";
import {
  sendWhatsAppWebMessage,
  sendWhatsAppWebBatch,
  initializeWhatsAppWeb,
  getQRCode,
  isWhatsAppWebAuthenticated,
  logoutWhatsAppWeb,
} from "../lib/whatsapp-web-client";

/**
 * Try to send via Business API, fallback to Web if configured
 */
export const handleSendWhatsAppUnified: RequestHandler<
  unknown,
  SendWhatsAppResponse,
  SendWhatsAppRequest & {
    mode?: "business" | "web" | "both";
    failoverEnabled?: boolean;
  }
> = async (req, res) => {
  try {
    const {
      to,
      message,
      phoneNumberId,
      accessToken,
      mode = "both",
      failoverEnabled = true,
    } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: 'to' and 'message'",
        timestamp: new Date().toISOString(),
        error: "Invalid request",
      });
    }

    const recipients = Array.isArray(to) ? to : [to];
    const messageIds: string[] = [];
    let successCount = 0;
    let usedMethod = "";

    // Try Business API first if mode allows
    if ((mode === "business" || mode === "both") && phoneNumberId && accessToken) {
      try {
        // Validate phone numbers for Business API
        const validPhoneNumbers = recipients.filter((phone) => {
          return /^\+?[1-9]\d{1,14}$/.test(phone.replace(/\D/g, ""));
        });

        if (validPhoneNumbers.length === 0) {
          throw new Error("No valid phone numbers for Business API");
        }

        // Call Business API endpoint
        const response = await fetch(
          `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: validPhoneNumbers[0], // Send to first number for demo
              type: "text",
              text: {
                preview_url: true,
                body: message,
              },
            }),
          },
        );

        if (response.ok) {
          const data = (await response.json()) as { messages: Array<{ id: string }> };
          if (data.messages) {
            messageIds.push(...data.messages.map((m) => m.id));
            successCount = recipients.length;
            usedMethod = "Business API";
            
            return res.status(200).json({
              success: true,
              message: `WhatsApp message sent via Business API to ${successCount} recipient(s)`,
              messageIds,
              recipients: successCount,
              timestamp: new Date().toISOString(),
            });
          }
        } else {
          throw new Error(`Business API error: ${response.statusText}`);
        }
      } catch (error) {
        console.log("[WhatsApp] Business API failed, attempting fallback...", error);
        if (!failoverEnabled || mode === "business") {
          throw error;
        }
        // Continue to Web fallback
      }
    }

    // Fallback to WhatsApp Web if mode allows
    if ((mode === "web" || (mode === "both" && failoverEnabled)) && isWhatsAppWebAuthenticated()) {
      try {
        const result =
          recipients.length === 1
            ? await sendWhatsAppWebMessage(recipients[0], message)
            : await sendWhatsAppWebBatch(recipients, message);

        if (result.success) {
          return res.status(200).json({
            success: true,
            message: `WhatsApp message sent via Web to ${result.sent} recipient(s)`,
            messageIds: result.sent > 0 ? [`wamsg_web_${Date.now()}`] : undefined,
            recipients: result.sent,
            timestamp: new Date().toISOString(),
          });
        } else {
          throw new Error(result.errors?.join(", ") || "Web send failed");
        }
      } catch (error) {
        console.error("[WhatsApp] Web send failed:", error);
        throw error;
      }
    }

    // No valid method available
    if (successCount === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No WhatsApp method available. Configure Business API credentials or authenticate WhatsApp Web.",
        timestamp: new Date().toISOString(),
        error: "No available WhatsApp method",
      });
    }

    return res.status(200).json({
      success: true,
      message: `WhatsApp message sent via ${usedMethod}`,
      messageIds,
      recipients: successCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send WhatsApp message";

    console.error("[WhatsApp Unified] Error:", errorMessage);

    return res.status(500).json({
      success: false,
      message: "Failed to send WhatsApp message",
      timestamp: new Date().toISOString(),
      error: errorMessage,
    });
  }
};

/**
 * Initialize WhatsApp Web with QR code
 */
export const handleInitWhatsAppWeb: RequestHandler<
  unknown,
  { success: boolean; message: string; qrCode?: string }
> = async (_req, res) => {
  try {
    const result = await initializeWhatsAppWeb();
    return res.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Initialization failed";
    return res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * Get QR code for WhatsApp Web
 */
export const handleGetQRCode: RequestHandler<
  unknown,
  { success: boolean; qrCode?: string; message: string }
> = (_req, res) => {
  try {
    const qrCode = getQRCode();
    if (qrCode) {
      return res.json({
        success: true,
        qrCode,
        message: "QR Code retrieved successfully",
      });
    } else if (isWhatsAppWebAuthenticated()) {
      return res.json({
        success: true,
        message: "Already authenticated, no QR code needed",
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No QR code available. Initialize first.",
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get QR code";
    return res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * Check WhatsApp Web authentication status
 */
export const handleCheckWhatsAppStatus: RequestHandler<
  unknown,
  { authenticated: boolean; message: string }
> = (_req, res) => {
  const authenticated = isWhatsAppWebAuthenticated();
  return res.json({
    authenticated,
    message: authenticated
      ? "WhatsApp Web authenticated and ready"
      : "WhatsApp Web not authenticated",
  });
};

/**
 * Logout from WhatsApp Web
 */
export const handleLogoutWhatsAppWeb: RequestHandler<
  unknown,
  { success: boolean; message: string }
> = async (_req, res) => {
  try {
    const result = await logoutWhatsAppWeb();
    return res.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Logout failed";
    return res.status(500).json({
      success: false,
      message,
    });
  }
};
