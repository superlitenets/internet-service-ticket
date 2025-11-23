export interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  timezone: string;
  prefix: string;
  slaResponse: string;
  slaResolution: string;
}

const COMPANY_SETTINGS_KEY = "company_settings";

export function getCompanySettings(): CompanySettings {
  try {
    const stored = localStorage.getItem(COMPANY_SETTINGS_KEY);
    if (!stored) {
      return getDefaultCompanySettings();
    }
    return JSON.parse(stored) as CompanySettings;
  } catch {
    return getDefaultCompanySettings();
  }
}

export function saveCompanySettings(settings: CompanySettings): void {
  try {
    localStorage.setItem(COMPANY_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    throw new Error("Failed to save company settings");
  }
}

export function resetCompanySettings(): void {
  try {
    localStorage.removeItem(COMPANY_SETTINGS_KEY);
  } catch {
    throw new Error("Failed to reset company settings");
  }
}

function getDefaultCompanySettings(): CompanySettings {
  return {
    name: "NetFlow ISP",
    email: "support@netflow-isp.com",
    phone: "+1 (555) 123-4567",
    address: "123 Tech Street, San Francisco, CA 94105",
    website: "https://netflow-isp.com",
    timezone: "America/Los_Angeles",
    prefix: "ACC",
    slaResponse: "4",
    slaResolution: "24",
  };
}

export function getCompanyPrefix(): string {
  const settings = getCompanySettings();
  return settings.prefix || "ACC";
}
