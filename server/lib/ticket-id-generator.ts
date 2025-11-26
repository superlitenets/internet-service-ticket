import { db } from "./db";

/**
 * Get the current ticket prefix from AppSettings
 */
export async function getTicketPrefix(): Promise<string> {
  try {
    const setting = await db.appSettings.findUnique({
      where: { key: "ticket_prefix" },
    });
    return setting?.value || "TKT";
  } catch (error) {
    console.error("Error fetching ticket prefix:", error);
    return "TKT";
  }
}

/**
 * Set the ticket prefix in AppSettings
 */
export async function setTicketPrefix(prefix: string): Promise<void> {
  try {
    await db.appSettings.upsert({
      where: { key: "ticket_prefix" },
      update: { value: prefix },
      create: {
        key: "ticket_prefix",
        value: prefix,
        category: "ticket",
      },
    });
  } catch (error) {
    console.error("Error setting ticket prefix:", error);
  }
}

/**
 * Get the next ticket number counter
 */
export async function getNextTicketNumber(): Promise<number> {
  try {
    const setting = await db.appSettings.findUnique({
      where: { key: "ticket_counter" },
    });
    let currentNumber = setting?.value ? parseInt(setting.value, 10) : 0;
    currentNumber++;

    // Cap at 1,000,000
    if (currentNumber > 1000000) {
      currentNumber = 1;
    }

    await db.appSettings.upsert({
      where: { key: "ticket_counter" },
      update: { value: String(currentNumber) },
      create: {
        key: "ticket_counter",
        value: String(currentNumber),
        category: "ticket",
      },
    });

    return currentNumber;
  } catch (error) {
    console.error("Error getting next ticket number:", error);
    return 1;
  }
}

/**
 * Generate a new ticket ID with format: PREFIX + padded number
 * Example: TKT000001, TKT000002, ..., TKT999999
 */
export async function generateTicketId(): Promise<string> {
  const prefix = await getTicketPrefix();
  const number = await getNextTicketNumber();
  const paddedNumber = String(number).padStart(6, "0");
  return `${prefix}${paddedNumber}`;
}

/**
 * Convert old ticket ID format to new format
 * This is used for migrating existing tickets
 */
export async function convertOldTicketIdToNew(oldTicketId: string): Promise<string> {
  const prefix = await getTicketPrefix();
  const number = await getNextTicketNumber();
  const paddedNumber = String(number).padStart(6, "0");
  return `${prefix}${paddedNumber}`;
}
