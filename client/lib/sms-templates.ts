/**
 * SMS Message Templates for different ticket events
 * Supports variable placeholders: {{customerName}}, {{technicianName}}, {{ticketId}}, etc.
 */

export interface SmsTemplate {
  id: string;
  eventType:
    | "ticket_created"
    | "ticket_assigned"
    | "ticket_status_change"
    | "lead_created"
    | "lead_converted";
  recipientType: "customer" | "technician" | "sales";
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
      "Hi {{customerName}}, your support ticket #{{ticketId}} has been created. Issue: {{title}}. Your technician {{technicianName}} will contact you at {{technicianPhone}}. Thank you!",
    variables: [
      "customerName",
      "ticketId",
      "title",
      "technicianName",
      "technicianPhone",
    ],
  },
  {
    id: "template_ticket_created_technician",
    eventType: "ticket_created",
    recipientType: "technician",
    name: "Ticket Created - Technician",
    message:
      "New ticket #{{ticketId}} for you. Customer: {{customerName}} ({{customerPhone}}) at {{customerLocation}}. Priority: {{priority}}. Issue: {{title}}.",
    variables: [
      "ticketId",
      "customerName",
      "customerPhone",
      "customerLocation",
      "priority",
      "title",
    ],
  },
  {
    id: "template_ticket_assigned_customer",
    eventType: "ticket_assigned",
    recipientType: "customer",
    name: "Ticket Assigned - Customer",
    message:
      "Hi {{customerName}}, your ticket #{{ticketId}} has been assigned to {{technicianName}}. Contact: {{technicianPhone}}. They will reach out shortly.",
    variables: [
      "customerName",
      "ticketId",
      "technicianName",
      "technicianPhone",
    ],
  },
  {
    id: "template_ticket_assigned_technician",
    eventType: "ticket_assigned",
    recipientType: "technician",
    name: "Ticket Assigned - Technician",
    message:
      "Assigned ticket #{{ticketId}} - {{customerName}} ({{customerPhone}}) at {{customerLocation}}. Priority: {{priority}}. {{title}}.",
    variables: [
      "ticketId",
      "customerName",
      "customerPhone",
      "customerLocation",
      "priority",
      "title",
    ],
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
      "Ticket #{{ticketId}} for {{customerName}} ({{customerPhone}}) status changed to {{status}}.",
    variables: ["ticketId", "customerName", "customerPhone", "status"],
  },
  {
    id: "template_lead_created_customer",
    eventType: "lead_created",
    recipientType: "customer",
    name: "Lead Created - Customer",
    message:
      "Hi {{customerName}}, thank you for your interest in {{package}}. Your lead has been registered. Our sales team will contact you at {{phone}} shortly. Thank you!",
    variables: ["customerName", "package", "phone"],
  },
  {
    id: "template_lead_created_sales",
    eventType: "lead_created",
    recipientType: "sales",
    name: "Lead Created - Sales",
    message:
      "New lead: {{customerName}} ({{phone}}) at {{location}}. Package: {{package}}. Install fee: {{agreedInstallAmount}}. Notes: {{notes}}",
    variables: [
      "customerName",
      "phone",
      "location",
      "package",
      "agreedInstallAmount",
      "notes",
    ],
  },
  {
    id: "template_lead_converted_customer",
    eventType: "lead_converted",
    recipientType: "customer",
    name: "Lead Converted - Customer",
    message:
      "Hi {{customerName}}, your lead has been converted to ticket #{{ticketId}}. Your technician {{technicianName}} will contact you soon at {{technicianPhone}}. Thank you!",
    variables: [
      "customerName",
      "ticketId",
      "technicianName",
      "technicianPhone",
    ],
  },
  {
    id: "template_lead_converted_sales",
    eventType: "lead_converted",
    recipientType: "sales",
    name: "Lead Converted - Sales",
    message:
      "Lead {{customerName}} converted to ticket #{{ticketId}}. Assigned to: {{technicianName}}. Priority: {{priority}}.",
    variables: ["customerName", "ticketId", "technicianName", "priority"],
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
