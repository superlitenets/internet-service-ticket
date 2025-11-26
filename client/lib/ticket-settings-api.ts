/**
 * Get ticket prefix setting
 */
export async function getTicketPrefix(): Promise<string> {
  try {
    const response = await fetch("/api/settings/ticket_prefix");
    if (!response.ok) {
      return "TKT";
    }
    const data = await response.json();
    return data.setting?.value || "TKT";
  } catch (error) {
    console.error("Error fetching ticket prefix:", error);
    return "TKT";
  }
}

/**
 * Set ticket prefix setting
 */
export async function setTicketPrefix(prefix: string): Promise<string> {
  try {
    const response = await fetch("/api/settings/ticket_prefix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        value: prefix,
        category: "ticket",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save ticket prefix");
    }

    const data = await response.json();
    return data.setting?.value || prefix;
  } catch (error) {
    console.error("Error setting ticket prefix:", error);
    throw error;
  }
}
