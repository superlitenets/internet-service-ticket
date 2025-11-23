/**
 * SMS Settings Storage - Manage SMS provider configuration
 * Stores settings in localStorage for persistence across sessions
 */

export interface SmsSettings {
  provider: string;
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  apiKey?: string;
  partnerId?: string;
  shortcode?: string;
  enabled: boolean;
}

const SMS_SETTINGS_KEY = "sms_settings";

/**
 * Get saved SMS settings from localStorage
 */
export function getSmsSettings(): SmsSettings | null {
  try {
    const stored = localStorage.getItem(SMS_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Failed to retrieve SMS settings:", error);
    return null;
  }
}

/**
 * Save SMS settings to localStorage
 */
export function saveSmsSettings(settings: SmsSettings): void {
  try {
    localStorage.setItem(SMS_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save SMS settings:", error);
    throw new Error("Failed to save SMS settings");
  }
}

/**
 * Clear SMS settings from localStorage
 */
export function clearSmsSettings(): void {
  try {
    localStorage.removeItem(SMS_SETTINGS_KEY);
  } catch (error) {
    console.error("Failed to clear SMS settings:", error);
  }
}

/**
 * Check if SMS settings are properly configured
 */
export function isSmsConfigured(): boolean {
  const settings = getSmsSettings();
  return !!(
    settings &&
    settings.accountSid &&
    settings.authToken &&
    settings.fromNumber &&
    settings.enabled
  );
}
