import { MpesaConfig } from "@shared/api";

const MPESA_SETTINGS_KEY = "mpesa_settings";

export type { MpesaConfig };

export function getMpesaSettings(): MpesaConfig {
  try {
    const stored = localStorage.getItem(MPESA_SETTINGS_KEY);
    if (!stored) {
      return getDefaultMpesaConfig();
    }
    return JSON.parse(stored) as MpesaConfig;
  } catch {
    return getDefaultMpesaConfig();
  }
}

export function saveMpesaSettings(config: MpesaConfig): void {
  try {
    const updatedConfig: MpesaConfig = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(MPESA_SETTINGS_KEY, JSON.stringify(updatedConfig));
  } catch (error) {
    throw new Error("Failed to save MPESA settings");
  }
}

export function resetMpesaSettings(): void {
  try {
    localStorage.removeItem(MPESA_SETTINGS_KEY);
  } catch {
    throw new Error("Failed to reset MPESA settings");
  }
}

function getDefaultMpesaConfig(): MpesaConfig {
  return {
    enabled: false,
    consumerKey: "",
    consumerSecret: "",
    businessShortCode: "",
    passkey: "",
    initiatorPassword: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function isMpesaConfigured(): boolean {
  const config = getMpesaSettings();
  return (
    config.enabled &&
    !!config.consumerKey &&
    !!config.consumerSecret &&
    !!config.businessShortCode &&
    !!config.passkey
  );
}
