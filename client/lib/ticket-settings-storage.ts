/**
 * Get ticket settings from localStorage and API
 */
export interface TicketSettings {
  prefix: string;
  nextNumber: number;
}

const TICKET_SETTINGS_KEY = "ticket_settings";
const DEFAULT_PREFIX = "TKT";

export function getTicketSettings(): TicketSettings {
  try {
    const stored = localStorage.getItem(TICKET_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to parse ticket settings from localStorage:", error);
  }

  return {
    prefix: DEFAULT_PREFIX,
    nextNumber: 1,
  };
}

export function setTicketSettings(settings: TicketSettings): void {
  try {
    localStorage.setItem(TICKET_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save ticket settings to localStorage:", error);
  }
}

export function updateTicketPrefix(newPrefix: string): void {
  const current = getTicketSettings();
  setTicketSettings({
    ...current,
    prefix: newPrefix,
  });
}

export function incrementTicketNumber(): number {
  const current = getTicketSettings();
  const nextNumber = (current.nextNumber % 1000000) + 1;
  setTicketSettings({
    ...current,
    nextNumber,
  });
  return current.nextNumber;
}

/**
 * Generate a new ticket ID with format: PREFIX + 2-digit number (01-99) or counter
 */
export function generateTicketId(): string {
  const settings = getTicketSettings();
  const number = incrementTicketNumber();
  const paddedNumber = String(number).padStart(6, "0");
  return `${settings.prefix}${paddedNumber}`;
}
