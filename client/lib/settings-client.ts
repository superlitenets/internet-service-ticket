export interface Setting {
  id: string;
  key: string;
  value: any;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get a specific setting by key
 */
export async function getSetting(key: string): Promise<any> {
  const response = await fetch(`/api/settings/${key}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch setting: ${key}`);
  }

  const result = await response.json();
  return result.setting ? result.setting.value : null;
}

/**
 * Get all settings
 */
export async function getAllSettings(): Promise<Setting[]> {
  const response = await fetch("/api/settings");

  if (!response.ok) {
    throw new Error("Failed to fetch settings");
  }

  const result = await response.json();
  return result.settings || [];
}

/**
 * Save or update a setting
 */
export async function saveSetting(
  key: string,
  value: any,
  category?: string,
): Promise<Setting> {
  const response = await fetch(`/api/settings/${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value, category }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save setting: ${key}`);
  }

  const result = await response.json();
  return result.setting;
}

/**
 * Delete a setting
 */
export async function deleteSetting(key: string): Promise<void> {
  const response = await fetch(`/api/settings/${key}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete setting: ${key}`);
  }
}

/**
 * Save SMS settings
 */
export async function saveSmsSettingsApi(smsSettings: any): Promise<void> {
  await saveSetting("sms_config", smsSettings, "sms");
}

/**
 * Get SMS settings
 */
export async function getSmsSettingsApi(): Promise<any> {
  try {
    return await getSetting("sms_config");
  } catch {
    return null;
  }
}

/**
 * Save SMS templates
 */
export async function saveSmsTemplatesApi(templates: any[]): Promise<void> {
  await saveSetting("sms_templates", templates, "sms");
}

/**
 * Get SMS templates
 */
export async function getSmsTemplatesApi(): Promise<any[]> {
  try {
    const result = await getSetting("sms_templates");
    return result || [];
  } catch {
    return [];
  }
}

/**
 * Save WhatsApp settings
 */
export async function saveWhatsAppSettingsApi(config: any): Promise<void> {
  await saveSetting("whatsapp_config", config, "whatsapp");
}

/**
 * Get WhatsApp settings
 */
export async function getWhatsAppSettingsApi(): Promise<any> {
  try {
    return await getSetting("whatsapp_config");
  } catch {
    return null;
  }
}

/**
 * Save MPESA settings
 */
export async function saveMpesaSettingsApi(config: any): Promise<void> {
  await saveSetting("mpesa_config", config, "mpesa");
}

/**
 * Get MPESA settings
 */
export async function getMpesaSettingsApi(): Promise<any> {
  try {
    return await getSetting("mpesa_config");
  } catch {
    return null;
  }
}

/**
 * Save company settings
 */
export async function saveCompanySettingsApi(config: any): Promise<void> {
  await saveSetting("company_settings", config, "company");
}

/**
 * Get company settings
 */
export async function getCompanySettingsApi(): Promise<any> {
  try {
    return await getSetting("company_settings");
  } catch {
    return null;
  }
}

/**
 * Save deduction settings
 */
export async function saveDeductionSettingsApi(config: any): Promise<void> {
  await saveSetting("deduction_settings", config, "system");
}

/**
 * Get deduction settings
 */
export async function getDeductionSettingsApi(): Promise<any> {
  try {
    return await getSetting("deduction_settings");
  } catch {
    return null;
  }
}

/**
 * Save notification preferences
 */
export async function saveNotificationPrefsApi(prefs: any): Promise<void> {
  await saveSetting("notification_preferences", prefs, "system");
}

/**
 * Get notification preferences
 */
export async function getNotificationPrefsApi(): Promise<any> {
  try {
    return await getSetting("notification_preferences");
  } catch {
    return null;
  }
}
