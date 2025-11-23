/**
 * WhatsApp Settings Storage
 * Manages WhatsApp Business API configuration
 */

import type { WhatsAppConfig } from "@shared/api";

const WHATSAPP_CONFIG_KEY = "whatsapp_config";

const DEFAULT_CONFIG: WhatsAppConfig = {
  enabled: false,
  phoneNumberId: "",
  accessToken: "",
  businessAccountId: "",
  webhookToken: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Get WhatsApp configuration from localStorage
 */
export function getWhatsAppConfig(): WhatsAppConfig {
  try {
    const stored = localStorage.getItem(WHATSAPP_CONFIG_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
  } catch (error) {
    console.error("Failed to retrieve WhatsApp config:", error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Save WhatsApp configuration to localStorage
 */
export function saveWhatsAppConfig(config: WhatsAppConfig): void {
  try {
    const updatedConfig = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(WHATSAPP_CONFIG_KEY, JSON.stringify(updatedConfig));
  } catch (error) {
    console.error("Failed to save WhatsApp config:", error);
    throw new Error("Failed to save WhatsApp configuration");
  }
}

/**
 * Clear WhatsApp configuration
 */
export function clearWhatsAppConfig(): void {
  try {
    localStorage.removeItem(WHATSAPP_CONFIG_KEY);
  } catch (error) {
    console.error("Failed to clear WhatsApp config:", error);
    throw new Error("Failed to clear WhatsApp configuration");
  }
}

/**
 * Check if WhatsApp is properly configured
 */
export function isWhatsAppConfigured(): boolean {
  const config = getWhatsAppConfig();
  return !!(
    config.enabled &&
    config.phoneNumberId &&
    config.accessToken &&
    config.businessAccountId
  );
}
