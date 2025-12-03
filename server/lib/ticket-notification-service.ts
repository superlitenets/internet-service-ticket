import fetch from "node-fetch";
import { db } from "./db";

export interface TicketEventData {
  ticketId: string;
  ticketNumber: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  subject: string;
  priority: string;
  status: string;
  assignedTechnicianName?: string;
  assignedTechnicianPhone?: string;
  previousStatus?: string;
  resolution?: string;
}

/**
 * Send SMS notification for ticket events
 * Supports: ticket_created, ticket_assigned, ticket_status_change, ticket_closed
 */
export async function sendTicketNotificationSms(
  eventType: "ticket_created" | "ticket_assigned" | "ticket_status_change" | "ticket_closed",
  data: TicketEventData,
  notifyCustomer: boolean = true,
  notifyTechnician: boolean = true,
): Promise<void> {
  try {
    // Get SMS configuration from database
    const smsConfig = await db.smsConfig.findFirst({
      where: { enabled: true },
    });

    if (!smsConfig) {
      console.log("[TICKET SMS] SMS not enabled or configured");
      return;
    }

    const apiKey = smsConfig.apiKey;
    const partnerId = smsConfig.partnerId;
    const shortcode = smsConfig.shortcode;
    const customApiUrl = smsConfig.customApiUrl;

    // Validate SMS config has required fields
    if (!apiKey || !partnerId || !shortcode) {
      console.log("[TICKET SMS] SMS configuration incomplete");
      return;
    }

    const phoneNumbers: string[] = [];

    // Add customer phone if notifying customer
    if (notifyCustomer && data.customerPhone) {
      phoneNumbers.push(data.customerPhone);
    }

    // Add technician phone if notifying technician
    if (notifyTechnician && data.assignedTechnicianPhone) {
      phoneNumbers.push(data.assignedTechnicianPhone);
    }

    if (phoneNumbers.length === 0) {
      console.log("[TICKET SMS] No valid phone numbers to notify");
      return;
    }

    // Generate SMS message based on event type
    const message = generateTicketSmsMessage(eventType, data, notifyCustomer);

    if (!message) {
      console.log("[TICKET SMS] Could not generate SMS message");
      return;
    }

    // Send SMS via API endpoint
    await sendTicketSmsViaApi({
      phoneNumbers,
      message,
      apiKey,
      partnerId,
      shortcode,
      customApiUrl,
      eventType,
      ticketId: data.ticketId,
    });
  } catch (error) {
    console.error("[TICKET SMS] Error sending ticket notification SMS:", error);
  }
}

/**
 * Generate SMS message for ticket events
 */
function generateTicketSmsMessage(
  eventType: "ticket_created" | "ticket_assigned" | "ticket_status_change" | "ticket_closed",
  data: TicketEventData,
  isCustomerNotification: boolean,
): string {
  const ticketRef = `#${data.ticketNumber}`;
  const customerName = data.customerName || "Valued Customer";

  switch (eventType) {
    case "ticket_created":
      if (isCustomerNotification) {
        return `Hi ${customerName}, your support ticket ${ticketRef} has been created. Issue: ${data.subject}. ${data.assignedTechnicianName ? `Technician: ${data.assignedTechnicianName}` : "Our team will contact you shortly"}.`;
      } else {
        return `New ticket ${ticketRef} for ${customerName}. Priority: ${data.priority}. Issue: ${data.subject}. Contact: ${data.customerPhone}`;
      }

    case "ticket_assigned":
      if (isCustomerNotification) {
        return `Hi ${customerName}, your ticket ${ticketRef} has been assigned to ${data.assignedTechnicianName || "our technician"}. They will contact you at ${data.assignedTechnicianPhone || "your registered number"} shortly.`;
      } else {
        return `Ticket ${ticketRef} assigned to you. Customer: ${customerName} (${data.customerPhone}). Priority: ${data.priority}. Issue: ${data.subject}`;
      }

    case "ticket_status_change":
      if (isCustomerNotification) {
        return `Hi ${customerName}, your ticket ${ticketRef} status has been updated to ${data.status}. We'll keep you posted on the progress.`;
      } else {
        return `Ticket ${ticketRef} for ${customerName} status changed to ${data.status}.`;
      }

    case "ticket_closed":
      if (isCustomerNotification) {
        const resolutionText = data.resolution ? ` Resolution: ${data.resolution}` : "";
        return `Hi ${customerName}, your ticket ${ticketRef} has been resolved and closed.${resolutionText} Thank you for choosing us!`;
      } else {
        return `Ticket ${ticketRef} for ${customerName} has been closed.`;
      }

    default:
      return "";
  }
}

/**
 * Send SMS via the internal SMS API endpoint
 */
async function sendTicketSmsViaApi(options: {
  phoneNumbers: string[];
  message: string;
  apiKey: string;
  partnerId: string;
  shortcode: string;
  customApiUrl?: string;
  eventType: string;
  ticketId: string;
}): Promise<void> {
  try {
    const smsRequest = {
      to: options.phoneNumbers,
      message: options.message,
      provider: "advanta",
      apiKey: options.apiKey,
      partnerId: options.partnerId,
      shortcode: options.shortcode,
      customApiUrl: options.customApiUrl,
    };

    const response = await fetch("http://localhost:9000/api/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(smsRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `SMS API error: ${response.status} - ${errorText}`,
      );
    }

    const result = (await response.json()) as { success: boolean; messageIds?: string[] };

    if (result.success) {
      console.log(
        `[TICKET SMS] Successfully sent ${options.eventType} SMS for ticket ${options.ticketId}`,
      );
    } else {
      console.error(
        `[TICKET SMS] SMS API returned failure for ticket ${options.ticketId}`,
      );
    }
  } catch (error) {
    console.error(
      `[TICKET SMS] Failed to send SMS for ticket ${options.ticketId}:`,
      error,
    );
  }
}

/**
 * Prepare customer data for SMS notification
 */
export async function getCustomerDetailsForNotification(customerId: string) {
  try {
    const customer = await db.customer.findUnique({
      where: { id: customerId },
    });

    return customer
      ? {
          name: customer.name,
          phone: customer.phone,
        }
      : null;
  } catch (error) {
    console.error("[TICKET SMS] Error fetching customer details:", error);
    return null;
  }
}

/**
 * Prepare technician data for SMS notification
 */
export async function getTechnicianDetailsForNotification(
  teamMemberId?: string,
  userId?: string,
) {
  try {
    if (teamMemberId) {
      const teamMember = await db.teamMember.findUnique({
        where: { id: teamMemberId },
      });

      if (teamMember && teamMember.employeeId) {
        const employee = await db.employee.findUnique({
          where: { id: teamMember.employeeId },
        });

        if (employee) {
          return {
            name: `${employee.firstName} ${employee.lastName}`,
            phone: employee.phone,
          };
        }
      }
    }

    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
      });

      if (user) {
        return {
          name: user.name || "Support Team",
          phone: user.phone,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("[TICKET SMS] Error fetching technician details:", error);
    return null;
  }
}
