/**
 * Mikrotik Notification Service
 * Sends SMS/WhatsApp notifications for bills, payments, and quota alerts
 */

export interface NotificationTemplate {
  id: string;
  type: "invoice" | "payment-reminder" | "overdue" | "payment-received" | "quota-alert";
  smsTemplate: string;
  whatsappTemplate: string;
  enabled: boolean;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  accountId: string;
  customerPhone: string;
  notificationType: string;
  channel: "sms" | "whatsapp" | "both";
  status: "sent" | "failed" | "pending";
  message: string;
  error?: string;
}

export class NotificationService {
  private templates: Map<string, NotificationTemplate> = new Map();
  private notificationLogs: NotificationLog[] = [];
  private smsProvider: "twilio" | "africastalking" = "africastalking";
  private whatsappEnabled: boolean = true;

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize default notification templates
   */
  private initializeTemplates(): void {
    this.templates.set("invoice", {
      id: "invoice",
      type: "invoice",
      smsTemplate:
        "Dear {{customerName}}, Your ISP invoice {{invoiceNumber}} for KES {{amount}} is ready. Due: {{dueDate}}. Pay via M-Pesa: {{paybillNumber}}",
      whatsappTemplate: `Hi {{customerName}},

Your invoice {{invoiceNumber}} has been generated.

Amount: KES {{amount}}
Due Date: {{dueDate}}

Please settle this invoice to maintain uninterrupted service.

Thank you!`,
      enabled: true,
    });

    this.templates.set("payment-reminder", {
      id: "payment-reminder",
      type: "payment-reminder",
      smsTemplate:
        "Reminder: Invoice {{invoiceNumber}} (KES {{amount}}) is due on {{dueDate}}. Pay via M-Pesa {{paybillNumber}}",
      whatsappTemplate: `Payment Reminder

Invoice: {{invoiceNumber}}
Amount: KES {{amount}}
Due: {{dueDate}}

Please complete payment to avoid service suspension.`,
      enabled: true,
    });

    this.templates.set("overdue", {
      id: "overdue",
      type: "overdue",
      smsTemplate:
        "URGENT: Invoice {{invoiceNumber}} is {{overdueDays}} days overdue. Pay immediately to avoid service suspension.",
      whatsappTemplate: `⚠️ IMPORTANT: Service at Risk

Your invoice {{invoiceNumber}} is {{overdueDays}} days overdue.

Please pay KES {{amount}} immediately to avoid service disconnection.

Contact us for assistance.`,
      enabled: true,
    });

    this.templates.set("payment-received", {
      id: "payment-received",
      type: "payment-received",
      smsTemplate:
        "Thank you! Payment of KES {{amount}} received on {{paymentDate}}. Invoice {{invoiceNumber}} is now paid. Ref: {{transactionRef}}",
      whatsappTemplate: `✓ Payment Received

Amount: KES {{amount}}
Date: {{paymentDate}}
Invoice: {{invoiceNumber}}
Reference: {{transactionRef}}

Thank you for your business!`,
      enabled: true,
    });

    this.templates.set("quota-alert", {
      id: "quota-alert",
      type: "quota-alert",
      smsTemplate:
        "Alert: You have used {{percentageUsed}}% of your data quota ({{usedData}}GB of {{totalQuota}}GB). Upgrade or manage usage.",
      whatsappTemplate: `📊 Data Usage Alert

You've used {{percentageUsed}}% of your quota

Used: {{usedData}}GB / {{totalQuota}}GB

Upgrade your plan or manage your usage to avoid throttling.`,
      enabled: true,
    });
  }

  /**
   * Send invoice notification
   */
  async sendInvoiceNotification(
    accountId: string,
    customerPhone: string,
    customerName: string,
    invoiceData: {
      invoiceNumber: string;
      amount: number;
      dueDate: string;
      paybillNumber?: string;
    }
  ): Promise<boolean> {
    try {
      const template = this.templates.get("invoice");
      if (!template || !template.enabled) {
        return false;
      }

      const smsMessage = this.interpolateTemplate(template.smsTemplate, {
        customerName,
        ...invoiceData,
      });

      const whatsappMessage = this.interpolateTemplate(template.whatsappTemplate, {
        customerName,
        ...invoiceData,
      });

      return await this.sendNotification(
        accountId,
        customerPhone,
        "invoice",
        smsMessage,
        whatsappMessage
      );
    } catch (error) {
      console.error("Failed to send invoice notification:", error);
      return false;
    }
  }

  /**
   * Send payment reminder notification
   */
  async sendPaymentReminderNotification(
    accountId: string,
    customerPhone: string,
    customerName: string,
    invoiceData: {
      invoiceNumber: string;
      amount: number;
      dueDate: string;
      paybillNumber?: string;
    }
  ): Promise<boolean> {
    try {
      const template = this.templates.get("payment-reminder");
      if (!template || !template.enabled) {
        return false;
      }

      const smsMessage = this.interpolateTemplate(template.smsTemplate, {
        customerName,
        ...invoiceData,
      });

      const whatsappMessage = this.interpolateTemplate(template.whatsappTemplate, {
        customerName,
        ...invoiceData,
      });

      return await this.sendNotification(
        accountId,
        customerPhone,
        "payment-reminder",
        smsMessage,
        whatsappMessage
      );
    } catch (error) {
      console.error("Failed to send payment reminder:", error);
      return false;
    }
  }

  /**
   * Send overdue invoice notification
   */
  async sendOverdueNotification(
    accountId: string,
    customerPhone: string,
    customerName: string,
    invoiceData: {
      invoiceNumber: string;
      amount: number;
      overdueDays: number;
    }
  ): Promise<boolean> {
    try {
      const template = this.templates.get("overdue");
      if (!template || !template.enabled) {
        return false;
      }

      const smsMessage = this.interpolateTemplate(template.smsTemplate, {
        customerName,
        ...invoiceData,
      });

      const whatsappMessage = this.interpolateTemplate(template.whatsappTemplate, {
        customerName,
        ...invoiceData,
      });

      return await this.sendNotification(
        accountId,
        customerPhone,
        "overdue",
        smsMessage,
        whatsappMessage
      );
    } catch (error) {
      console.error("Failed to send overdue notification:", error);
      return false;
    }
  }

  /**
   * Send payment received notification
   */
  async sendPaymentReceivedNotification(
    accountId: string,
    customerPhone: string,
    customerName: string,
    paymentData: {
      amount: number;
      paymentDate: string;
      invoiceNumber: string;
      transactionRef: string;
    }
  ): Promise<boolean> {
    try {
      const template = this.templates.get("payment-received");
      if (!template || !template.enabled) {
        return false;
      }

      const smsMessage = this.interpolateTemplate(template.smsTemplate, {
        customerName,
        ...paymentData,
      });

      const whatsappMessage = this.interpolateTemplate(template.whatsappTemplate, {
        customerName,
        ...paymentData,
      });

      return await this.sendNotification(
        accountId,
        customerPhone,
        "payment-received",
        smsMessage,
        whatsappMessage
      );
    } catch (error) {
      console.error("Failed to send payment received notification:", error);
      return false;
    }
  }

  /**
   * Send quota alert notification
   */
  async sendQuotaAlertNotification(
    accountId: string,
    customerPhone: string,
    customerName: string,
    quotaData: {
      percentageUsed: number;
      usedData: number;
      totalQuota: number;
    }
  ): Promise<boolean> {
    try {
      const template = this.templates.get("quota-alert");
      if (!template || !template.enabled) {
        return false;
      }

      const smsMessage = this.interpolateTemplate(template.smsTemplate, {
        customerName,
        ...quotaData,
      });

      const whatsappMessage = this.interpolateTemplate(template.whatsappTemplate, {
        customerName,
        ...quotaData,
      });

      return await this.sendNotification(
        accountId,
        customerPhone,
        "quota-alert",
        smsMessage,
        whatsappMessage
      );
    } catch (error) {
      console.error("Failed to send quota alert notification:", error);
      return false;
    }
  }

  /**
   * Send generic notification via SMS/WhatsApp
   */
  private async sendNotification(
    accountId: string,
    phone: string,
    notificationType: string,
    smsMessage: string,
    whatsappMessage: string,
    channel: "sms" | "whatsapp" | "both" = "both"
  ): Promise<boolean> {
    try {
      const log: NotificationLog = {
        id: `NOTIF-${Date.now()}`,
        timestamp: new Date().toISOString(),
        accountId,
        customerPhone: phone,
        notificationType,
        channel,
        status: "pending",
        message: smsMessage,
      };

      // In production, these would make actual API calls to SMS/WhatsApp providers
      // For now, we simulate sending
      const smsSuccess = channel === "sms" || channel === "both" ? await this.sendSMS(phone, smsMessage) : true;
      const whatsappSuccess = channel === "whatsapp" || channel === "both" ? await this.sendWhatsApp(phone, whatsappMessage) : true;

      if (smsSuccess || whatsappSuccess) {
        log.status = "sent";
        this.notificationLogs.push(log);
        return true;
      } else {
        log.status = "failed";
        log.error = "Failed to send via SMS and WhatsApp";
        this.notificationLogs.push(log);
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Send SMS (integration point with SMS service)
   */
  private async sendSMS(phone: string, message: string): Promise<boolean> {
    // In production, integrate with actual SMS provider
    // For now, log and return success
    console.log(`[SMS] To: ${phone}`, message);
    return true;
  }

  /**
   * Send WhatsApp (integration point with WhatsApp service)
   */
  private async sendWhatsApp(phone: string, message: string): Promise<boolean> {
    if (!this.whatsappEnabled) {
      return false;
    }

    // In production, integrate with actual WhatsApp provider
    // For now, log and return success
    console.log(`[WhatsApp] To: ${phone}`, message);
    return true;
  }

  /**
   * Interpolate template with variables
   */
  private interpolateTemplate(
    template: string,
    variables: Record<string, any>
  ): string {
    let message = template;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      message = message.replace(new RegExp(placeholder, "g"), String(value));
    }

    return message;
  }

  /**
   * Get notification logs
   */
  getNotificationLogs(
    accountId?: string,
    limit: number = 100
  ): NotificationLog[] {
    let logs = this.notificationLogs;

    if (accountId) {
      logs = logs.filter((log) => log.accountId === accountId);
    }

    return logs.slice(-limit);
  }

  /**
   * Get notification templates
   */
  getTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Update notification template
   */
  updateTemplate(templateId: string, updates: Partial<NotificationTemplate>): boolean {
    const template = this.templates.get(templateId);
    if (template) {
      this.templates.set(templateId, { ...template, ...updates });
      return true;
    }
    return false;
  }

  /**
   * Get notification statistics
   */
  getNotificationStats(): {
    totalSent: number;
    totalFailed: number;
    todaySent: number;
  } {
    const now = new Date();
    const today = now.toISOString().substring(0, 10);

    const totalSent = this.notificationLogs.filter((log) => log.status === "sent").length;
    const totalFailed = this.notificationLogs.filter((log) => log.status === "failed").length;
    const todaySent = this.notificationLogs.filter(
      (log) => log.status === "sent" && log.timestamp.substring(0, 10) === today
    ).length;

    return {
      totalSent,
      totalFailed,
      todaySent,
    };
  }
}

// Singleton instance
let notificationService: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (!notificationService) {
    notificationService = new NotificationService();
  }
  return notificationService;
}
