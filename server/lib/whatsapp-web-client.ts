/**
 * WhatsApp Web Client
 * Uses whatsapp-web.js to connect to WhatsApp Web
 * Note: This requires whatsapp-web.js npm package: npm install whatsapp-web.js
 */

// Type definitions (since whatsapp-web.js may not have full types)
interface WhatsAppWebMessage {
  from: string;
  body: string;
  timestamp: number;
}

interface WhatsAppWebClient {
  initialize(): Promise<void>;
  destroy(): Promise<void>;
  sendMessage(chatId: string, message: string): Promise<void>;
  getState(): string;
  on(event: string, callback: (...args: any[]) => void): void;
}

let client: any = null;
let qrCode: string = "";
let isAuthenticated = false;
let sessionData: Map<string, any> = new Map();

/**
 * Initialize WhatsApp Web client
 */
export async function initializeWhatsAppWeb(): Promise<{
  success: boolean;
  message: string;
  qrCode?: string;
}> {
  try {
    // Dynamically import whatsapp-web.js only if available
    let WhatsappWeb;
    try {
      WhatsappWeb = require("whatsapp-web.js");
    } catch (error) {
      return {
        success: false,
        message:
          "whatsapp-web.js not installed. Run: npm install whatsapp-web.js puppeteer",
      };
    }

    if (client) {
      return {
        success: true,
        message: "WhatsApp Web client already initialized",
      };
    }

    // Create client with local session storage
    client = new WhatsappWeb.Client({
      authStrategy: new WhatsappWeb.LocalAuth({ clientId: "netflow-crm" }),
      puppeteer: {
        headless: true,
        args: ["--no-sandbox"],
      },
    });

    // Handle QR code
    client.on("qr", (qr: string) => {
      qrCode = qr;
      console.log("[WhatsApp Web] QR Code generated, scan with your phone");
    });

    // Handle authentication
    client.on("authenticated", () => {
      isAuthenticated = true;
      console.log("[WhatsApp Web] Successfully authenticated");
    });

    // Handle ready state
    client.on("ready", () => {
      console.log("[WhatsApp Web] Client is ready");
      isAuthenticated = true;
    });

    // Handle disconnection
    client.on("disconnected", () => {
      isAuthenticated = false;
      client = null;
      console.log("[WhatsApp Web] Client disconnected");
    });

    // Initialize the client
    await client.initialize();

    return {
      success: true,
      message: "WhatsApp Web client initialized",
      qrCode: qrCode,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to initialize WhatsApp Web";
    console.error("[WhatsApp Web] Initialization error:", message);
    return {
      success: false,
      message,
    };
  }
}

/**
 * Get QR code for authentication
 */
export function getQRCode(): string | null {
  return qrCode || null;
}

/**
 * Check if WhatsApp Web is authenticated
 */
export function isWhatsAppWebAuthenticated(): boolean {
  return isAuthenticated && client !== null;
}

/**
 * Send WhatsApp Web message
 */
export async function sendWhatsAppWebMessage(
  phoneNumber: string,
  message: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!client || !isAuthenticated) {
      return {
        success: false,
        error: "WhatsApp Web not authenticated. Please scan QR code first.",
      };
    }

    if (!message || message.length === 0 || message.length > 4096) {
      return {
        success: false,
        error: "Message must be between 1 and 4096 characters",
      };
    }

    // Format phone number to WhatsApp format
    let chatId = phoneNumber.replace(/\D/g, "");
    if (!chatId.startsWith("1")) {
      chatId = "1" + chatId; // Add country code if missing
    }
    chatId = chatId + "@c.us"; // WhatsApp Web format

    // Send message
    await client.sendMessage(chatId, message);

    console.log("[WhatsApp Web] Message sent to", phoneNumber);

    return {
      success: true,
      messageId: `wamsg_web_${Date.now()}`,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send WhatsApp message";
    console.error("[WhatsApp Web] Send error:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send batch messages via WhatsApp Web
 */
export async function sendWhatsAppWebBatch(
  phoneNumbers: string[],
  message: string,
): Promise<{ success: boolean; sent: number; failed: number; errors?: string[] }> {
  try {
    if (!client || !isAuthenticated) {
      return {
        success: false,
        sent: 0,
        failed: phoneNumbers.length,
        errors: ["WhatsApp Web not authenticated"],
      };
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const phoneNumber of phoneNumbers) {
      const result = await sendWhatsAppWebMessage(phoneNumber, message);
      if (result.success) {
        sent++;
      } else {
        failed++;
        errors.push(`${phoneNumber}: ${result.error}`);
      }
      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return {
      success: failed === 0,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Batch send failed";
    return {
      success: false,
      sent: 0,
      failed: phoneNumbers.length,
      errors: [errorMessage],
    };
  }
}

/**
 * Logout WhatsApp Web
 */
export async function logoutWhatsAppWeb(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    if (client) {
      await client.destroy();
      client = null;
      isAuthenticated = false;
      qrCode = "";
      return {
        success: true,
        message: "Logged out from WhatsApp Web",
      };
    }
    return {
      success: true,
      message: "Not logged in",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to logout";
    return {
      success: false,
      message,
    };
  }
}
