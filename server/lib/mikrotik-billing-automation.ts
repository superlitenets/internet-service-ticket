/**
 * Mikrotik Automated Billing Service
 * Handles automatic invoice generation, payment processing, and billing cycles
 */

export interface BillingScheduleEntry {
  accountId: string;
  accountNumber: string;
  customerName: string;
  nextBillingDate: string;
  billingCycleDay: number;
  monthlyFee: number;
  autoRenew: boolean;
}

export interface AutomationLog {
  timestamp: string;
  action: string;
  accountId: string;
  accountNumber: string;
  status: "success" | "pending" | "failed";
  details: string;
}

export class BillingAutomation {
  private scheduledTasks: Map<string, NodeJS.Timeout> = new Map();
  private automationLogs: AutomationLog[] = [];
  private billingSchedules: Map<string, BillingScheduleEntry> = new Map();

  /**
   * Schedule automatic billing for an account
   */
  scheduleBilling(
    accountId: string,
    billingCycleDay: number = 1,
    timezone: string = "Africa/Nairobi"
  ): void {
    if (this.scheduledTasks.has(accountId)) {
      return; // Already scheduled
    }

    // Calculate next billing time
    const nextBillingTime = this.calculateNextBillingTime(billingCycleDay);
    const timeUntilBilling = nextBillingTime.getTime() - Date.now();

    // Schedule the billing task
    const timeoutId = setTimeout(async () => {
      await this.processBillingCycle(accountId);
      // Reschedule for next month
      this.scheduleBilling(accountId, billingCycleDay, timezone);
    }, Math.max(0, timeUntilBilling));

    this.scheduledTasks.set(accountId, timeoutId);

    this.logAction(accountId, "BILLING_SCHEDULED", "success", "Billing schedule activated");
  }

  /**
   * Cancel automatic billing for an account
   */
  cancelBilling(accountId: string): void {
    const timeoutId = this.scheduledTasks.get(accountId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledTasks.delete(accountId);
      this.logAction(accountId, "BILLING_CANCELLED", "success", "Billing schedule deactivated");
    }
  }

  /**
   * Process billing cycle for an account
   */
  async processBillingCycle(accountId: string): Promise<{
    success: boolean;
    invoiceId?: string;
    message: string;
  }> {
    try {
      // Generate invoice
      const invoiceId = await this.generateAutomaticInvoice(accountId);

      if (invoiceId) {
        this.logAction(accountId, "INVOICE_GENERATED", "success", `Invoice created: ${invoiceId}`);
        return {
          success: true,
          invoiceId,
          message: "Invoice generated automatically",
        };
      }

      return {
        success: false,
        message: "Failed to generate invoice",
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      this.logAction(accountId, "BILLING_FAILED", "failed", errorMsg);

      return {
        success: false,
        message: `Billing failed: ${errorMsg}`,
      };
    }
  }

  /**
   * Generate automatic invoice
   */
  private async generateAutomaticInvoice(accountId: string): Promise<string | null> {
    // In production, this would:
    // 1. Fetch account details
    // 2. Calculate invoice amount with adjustments
    // 3. Create invoice in database
    // 4. Send notification to customer
    // 5. Return invoice ID

    // For now, simulate invoice generation
    const invoiceId = `INV-AUTO-${Date.now()}`;
    return invoiceId;
  }

  /**
   * Calculate next billing time based on cycle day
   */
  private calculateNextBillingTime(billingCycleDay: number): Date {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Create date for this month's billing cycle
    let billingDate = new Date(currentYear, currentMonth, billingCycleDay);

    // If billing date has passed, schedule for next month
    if (billingDate < now) {
      billingDate = new Date(currentYear, currentMonth + 1, billingCycleDay);
    }

    // Set to midnight in the specified timezone (default: Africa/Nairobi)
    billingDate.setHours(0, 0, 0, 0);

    return billingDate;
  }

  /**
   * Process overdue invoices
   */
  async processOverdueInvoices(
    overdueDays: number = 7
  ): Promise<{
    processedCount: number;
    suspendedCount: number;
  }> {
    // In production, this would:
    // 1. Query all overdue invoices
    // 2. Update account status
    // 3. Suspend service access
    // 4. Send notifications

    return {
      processedCount: 0,
      suspendedCount: 0,
    };
  }

  /**
   * Auto-apply credits/payments to invoices
   */
  async autoApplyCredits(
    accountId: string
  ): Promise<{
    success: boolean;
    appliedAmount: number;
    invoicesCleared: number;
  }> {
    // In production, this would:
    // 1. Fetch account balance
    // 2. Find outstanding invoices
    // 3. Apply balance to invoices
    // 4. Update payment status

    return {
      success: true,
      appliedAmount: 0,
      invoicesCleared: 0,
    };
  }

  /**
   * Get all scheduled billing accounts
   */
  getScheduledAccounts(): BillingScheduleEntry[] {
    return Array.from(this.billingSchedules.values());
  }

  /**
   * Get automation logs
   */
  getAutomationLogs(
    accountId?: string,
    limit: number = 100
  ): AutomationLog[] {
    let logs = this.automationLogs;

    if (accountId) {
      logs = logs.filter((log) => log.accountId === accountId);
    }

    return logs.slice(-limit);
  }

  /**
   * Log automation action
   */
  private logAction(
    accountId: string,
    action: string,
    status: "success" | "pending" | "failed",
    details: string
  ): void {
    const log: AutomationLog = {
      timestamp: new Date().toISOString(),
      action,
      accountId,
      accountNumber: "ACC-" + accountId.slice(-4), // Placeholder
      status,
      details,
    };

    this.automationLogs.push(log);

    // Keep only last 1000 logs
    if (this.automationLogs.length > 1000) {
      this.automationLogs = this.automationLogs.slice(-1000);
    }
  }

  /**
   * Get automation status
   */
  getAutomationStatus(): {
    scheduledAccounts: number;
    totalLogs: number;
    successCount: number;
    failureCount: number;
  } {
    const logs = this.automationLogs;
    const successCount = logs.filter((log) => log.status === "success").length;
    const failureCount = logs.filter((log) => log.status === "failed").length;

    return {
      scheduledAccounts: this.scheduledTasks.size,
      totalLogs: logs.length,
      successCount,
      failureCount,
    };
  }

  /**
   * Test billing automation (generates test invoice)
   */
  async testBillingAutomation(accountId: string): Promise<{
    success: boolean;
    message: string;
    nextBillingDate?: string;
  }> {
    try {
      const result = await this.processBillingCycle(accountId);
      const nextDate = this.calculateNextBillingTime(1).toISOString();

      return {
        success: result.success,
        message: result.message,
        nextBillingDate: nextDate,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Test failed",
      };
    }
  }
}

// Singleton instance
let billingAutomation: BillingAutomation | null = null;

export function getBillingAutomation(): BillingAutomation {
  if (!billingAutomation) {
    billingAutomation = new BillingAutomation();
  }
  return billingAutomation;
}
