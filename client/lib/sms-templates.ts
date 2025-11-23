/**
 * SMS Message Templates for different ticket events
 * Supports variable placeholders: {{customerName}}, {{technicianName}}, {{ticketId}}, etc.
 */

export interface SmsTemplate {
  id: string;
  eventType: "ticket_created" | "ticket_assigned" | "ticket_status_change";
  recipientType: "customer" | "technician";
  name: string;
  message: string;
  variables: string[];
}

const SMS_TEMPLATES_KEY = "sms_templates";

const DEFAULT_TEMPLATES: SmsTemplate[] = [
  {
    id: "template_ticket_created_customer",
    eventType: "ticket_created",
    recipientType: "customer",
    name: "Ticket Created - Customer",
    message:
      "Hi {{customerName}}, your support ticket #{{ticketId}} has been created. Issue: {{title}}. A technician will assist you shortly.",
    variables: ["customerName", "ticketId", "title"],
  },
  {
    id: "template_ticket_created_technician",
    eventType: "ticket_created",
    recipientType: "technician",
    name: "Ticket Created - Technician",
    message:
      "New ticket #{{ticketId}} assigned to you. Customer: {{customerName}}, Priority: {{priority}}, Issue: {{title}}.",
    variables: ["ticketId", "customerName", "priority", "title"],
  },
  {
    id: "template_ticket_assigned_customer",
    eventType: "ticket_assigned",
    recipientType: "customer",
    name: "Ticket Assigned - Customer",
    message:
      "Hi {{customerName}}, your ticket #{{ticketId}} has been assigned to {{technicianName}}. They will contact you shortly.",
    variables: ["customerName", "ticketId", "technicianName"],
  },
  {
    id: "template_ticket_assigned_technician",
    eventType: "ticket_assigned",
    recipientType: "technician",
    name: "Ticket Assigned - Technician",
    message:
      "You have been assigned ticket #{{ticketId}} for {{customerName}}. Priority: {{priority}}. Issue: {{title}}.",
    variables: ["ticketId", "customerName", "priority", "title"],
  },
  {
    id: "template_ticket_status_change_customer",
    eventType: "ticket_status_change",
    recipientType: "customer",
    name: "Status Change - Customer",
    message:
      "Hi {{customerName}}, your ticket #{{ticketId}} status has been updated to {{status}}. We'll keep you posted.",
    variables: ["customerName", "ticketId", "status"],
  },
  {
    id: "template_ticket_status_change_technician",
    eventType: "ticket_status_change",
    recipientType: "technician",
    name: "Status Change - Technician",
    message:
      "Ticket #{{ticketId}} status changed to {{status}} by {{updatedBy}}.",
    variables: ["ticketId", "status", "updatedBy"],
  },
];

/**
 * Get all SMS templates from localStorage
 */
export function getSmsTemplates(): SmsTemplate[] {
  try {
    const stored = localStorage.getItem(SMS_TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_TEMPLATES;
  } catch (error) {
    console.error("Failed to retrieve SMS templates:", error);
    return DEFAULT_TEMPLATES;
  }
}

/**
 * Save SMS templates to localStorage
 */
export function saveSmsTemplates(templates: SmsTemplate[]): void {
  try {
    localStorage.setItem(SMS_TEMPLATES_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error("Failed to save SMS templates:", error);
    throw new Error("Failed to save SMS templates");
  }
}

/**
 * Reset templates to defaults
 */
export function resetSmsTemplates(): void {
  try {
    localStorage.setItem(SMS_TEMPLATES_KEY, JSON.stringify(DEFAULT_TEMPLATES));
  } catch (error) {
    console.error("Failed to reset SMS templates:", error);
    throw new Error("Failed to reset SMS templates");
  }
}

/**
 * Get template by event type and recipient
 */
export function getTemplate(
  eventType: SmsTemplate["eventType"],
  recipientType: SmsTemplate["recipientType"],
): SmsTemplate | undefined {
  const templates = getSmsTemplates();
  return templates.find(
    (t) => t.eventType === eventType && t.recipientType === recipientType,
  );
}

/**
 * Replace placeholders in template with actual values
 */
export function renderTemplate(
  template: SmsTemplate,
  variables: Record<string, string>,
): string {
  let message = template.message;
  Object.entries(variables).forEach(([key, value]) => {
    message = message.replace(new RegExp(`{{${key}}}`, "g"), value);
  });
  return message;
}

/**
 * Update a specific template
 */
export function updateTemplate(updatedTemplate: SmsTemplate): void {
  const templates = getSmsTemplates();
  const index = templates.findIndex((t) => t.id === updatedTemplate.id);
  if (index !== -1) {
    templates[index] = updatedTemplate;
    saveSmsTemplates(templates);
  }
}
