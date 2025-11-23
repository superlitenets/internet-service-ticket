/**
 * Mikrotik Account Expiration and Renewal Automation
 * Handles automatic disconnection of expired accounts and reconnection upon renewal
 */

import { MikrotikAccount } from "@shared/api";

export interface ExpirationLog {
  timestamp: string;
  accountId: string;
  accountNumber: string;
  customerName: string;
  action: "EXPIRATION_DETECTED" | "AUTO_SUSPENDED" | "RENEWAL_DETECTED" | "AUTO_RESUMED";
  status: "success" | "pending" | "failed";
  details: string;
  nextBillingDate?: string;
}

export interface ExpirationCheck {
  accountId: string;
  accountNumber: string;
  customerName: string;
  currentStatus: string;
  nextBillingDate: string;
  isExpired: boolean;
  daysOverdue: number;
  shouldBeSuspended: boolean;
  currentlyActive: boolean;
}

export class ExpirationAutomation {
  private automationLogs: ExpirationLog[] = [];
  private expirationChecks: Map<string, ExpirationCheck> = new Map();

  /**
   * Check if an account is expired
   */
  isAccountExpired(account: MikrotikAccount, gracePeriodDays: number = 0): boolean {
    if (!account.nextBillingDate) {
      return false;
    }

    const nextBillingDate = new Date(account.nextBillingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const gracePeriodMs = gracePeriodDays * 24 * 60 * 60 * 1000;
    const expirationDate = new Date(nextBillingDate.getTime() + gracePeriodMs);

    return today > expirationDate;
  }

  /**
   * Calculate days overdue for an account
   */
  calculateDaysOverdue(account: MikrotikAccount, gracePeriodDays: number = 0): number {
    if (!account.nextBillingDate) {
      return 0;
    }

    const nextBillingDate = new Date(account.nextBillingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const gracePeriodMs = gracePeriodDays * 24 * 60 * 60 * 1000;
    const expirationDate = new Date(nextBillingDate.getTime() + gracePeriodMs);

    if (today <= expirationDate) {
      return 0;
    }

    const diffMs = today.getTime() - expirationDate.getTime();
    return Math.floor(diffMs / (24 * 60 * 60 * 1000));
  }

  /**
   * Check expiration status for all accounts
   */
  checkAccountExpirations(
    accounts: MikrotikAccount[],
    gracePeriodDays: number = 0
  ): ExpirationCheck[] {
    const checks: ExpirationCheck[] = [];

    accounts.forEach((account) => {
      const isExpired = this.isAccountExpired(account, gracePeriodDays);
      const daysOverdue = this.calculateDaysOverdue(account, gracePeriodDays);
      const isActive = account.status === "active";
      const shouldBeSuspended = isExpired && isActive;

      const check: ExpirationCheck = {
        accountId: account.id,
        accountNumber: account.accountNumber,
        customerName: account.customerName,
        currentStatus: account.status,
        nextBillingDate: account.nextBillingDate || "N/A",
        isExpired,
        daysOverdue,
        shouldBeSuspended,
        currentlyActive: isActive,
      };

      checks.push(check);
      this.expirationChecks.set(account.id, check);
    });

    return checks;
  }

  /**
   * Process account expirations (suspend expired accounts)
   */
  async processExpirations(
    accounts: MikrotikAccount[],
    gracePeriodDays: number = 0,
    suspendCallback?: (accountId: string, account: MikrotikAccount) => Promise<boolean>
  ): Promise<{
    processedCount: number;
    suspendedCount: number;
    failedCount: number;
    skippedCount: number;
  }> {
    let processedCount = 0;
    let suspendedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const account of accounts) {
      const isExpired = this.isAccountExpired(account, gracePeriodDays);

      if (!isExpired) {
        skippedCount++;
        continue;
      }

      processedCount++;

      // Only suspend if currently active
      if (account.status === "active") {
        try {
          if (suspendCallback) {
            const success = await suspendCallback(account.id, account);
            if (success) {
              suspendedCount++;
              this.logAction(
                account.id,
                "AUTO_SUSPENDED",
                "success",
                `Account automatically suspended due to expiration. Days overdue: ${this.calculateDaysOverdue(account, gracePeriodDays)}`
              );
            } else {
              failedCount++;
              this.logAction(
                account.id,
                "AUTO_SUSPENDED",
                "failed",
                "Failed to suspend account in RADIUS/Mikrotik"
              );
            }
          } else {
            suspendedCount++;
            this.logAction(
              account.id,
              "AUTO_SUSPENDED",
              "success",
              "Account marked for suspension (callback not provided)"
            );
          }
        } catch (error) {
          failedCount++;
          this.logAction(
            account.id,
            "AUTO_SUSPENDED",
            "failed",
            error instanceof Error ? error.message : "Unknown error"
          );
        }
      } else {
        // Already suspended/inactive
        this.logAction(
          account.id,
          "EXPIRATION_DETECTED",
          "success",
          `Account already in ${account.status} status`
        );
      }
    }

    return {
      processedCount,
      suspendedCount,
      failedCount,
      skippedCount,
    };
  }

  /**
   * Process account renewal
   */
  async processRenewal(
    accountId: string,
    account: MikrotikAccount,
    newNextBillingDate: string,
    resumeCallback?: (accountId: string, account: MikrotikAccount) => Promise<boolean>
  ): Promise<{
    success: boolean;
    wasResumed: boolean;
    message: string;
  }> {
    try {
      const wasSuspended = account.status === "suspended" || account.status === "closed";

      if (wasSuspended && resumeCallback) {
        const resumeSuccess = await resumeCallback(accountId, account);
        if (resumeSuccess) {
          this.logAction(
            accountId,
            "AUTO_RESUMED",
            "success",
            `Account automatically resumed after renewal. New billing date: ${newNextBillingDate}`
          );
          return {
            success: true,
            wasResumed: true,
            message: "Account renewed and service resumed",
          };
        } else {
          this.logAction(
            accountId,
            "RENEWAL_DETECTED",
            "failed",
            "Failed to resume account in RADIUS/Mikrotik"
          );
          return {
            success: false,
            wasResumed: false,
            message: "Account renewed but failed to resume service",
          };
        }
      } else {
        this.logAction(
          accountId,
          "RENEWAL_DETECTED",
          "success",
          `Account renewal processed. New billing date: ${newNextBillingDate}`
        );
        return {
          success: true,
          wasResumed: wasSuspended && !resumeCallback,
          message: "Account renewal processed successfully",
        };
      }
    } catch (error) {
      this.logAction(
        accountId,
        "RENEWAL_DETECTED",
        "failed",
        error instanceof Error ? error.message : "Unknown error"
      );
      return {
        success: false,
        wasResumed: false,
        message: `Error processing renewal: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Detect accounts that need renewal based on recent payments or status changes
   */
  detectRenewals(
    accounts: MikrotikAccount[],
    previousStates: Map<string, MikrotikAccount>
  ): Array<{
    accountId: string;
    accountNumber: string;
    customerName: string;
    reason: "status_change" | "recent_payment";
  }> {
    const renewals: Array<{
      accountId: string;
      accountNumber: string;
      customerName: string;
      reason: "status_change" | "recent_payment";
    }> = [];

    accounts.forEach((account) => {
      const previousState = previousStates.get(account.id);

      if (!previousState) {
        return; // Account is new, skip
      }

      // Check if status changed from suspended/closed/paused to active
      const wasNotActive =
        previousState.status === "suspended" ||
        previousState.status === "closed" ||
        previousState.status === "paused";
      const isNowActive = account.status === "active";

      if (wasNotActive && isNowActive) {
        renewals.push({
          accountId: account.id,
          accountNumber: account.accountNumber,
          customerName: account.customerName,
          reason: "status_change",
        });
      }

      // Check if balance/paid amount increased significantly (recent payment)
      const balanceIncreased = account.balance > previousState.balance;
      const paidIncreased = account.totalPaid > previousState.totalPaid;

      if ((balanceIncreased || paidIncreased) && account.status === "active") {
        renewals.push({
          accountId: account.id,
          accountNumber: account.accountNumber,
          customerName: account.customerName,
          reason: "recent_payment",
        });
      }
    });

    return renewals;
  }

  /**
   * Get expiration automation logs
   */
  getAutomationLogs(accountId?: string, limit: number = 100): ExpirationLog[] {
    let logs = this.automationLogs;

    if (accountId) {
      logs = logs.filter((log) => log.accountId === accountId);
    }

    return logs.slice(-limit);
  }

  /**
   * Log expiration action
   */
  private logAction(
    accountId: string,
    action:
      | "EXPIRATION_DETECTED"
      | "AUTO_SUSPENDED"
      | "RENEWAL_DETECTED"
      | "AUTO_RESUMED",
    status: "success" | "pending" | "failed",
    details: string
  ): void {
    const log: ExpirationLog = {
      timestamp: new Date().toISOString(),
      accountId,
      accountNumber: "ACC-" + accountId.slice(-4),
      customerName: "Customer",
      action,
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
    totalChecks: number;
    expiredAccounts: number;
    activeExpiredAccounts: number;
    totalLogs: number;
    successCount: number;
    failureCount: number;
  } {
    const checks = Array.from(this.expirationChecks.values());
    const logs = this.automationLogs;

    const expiredCount = checks.filter((c) => c.isExpired).length;
    const activeExpiredCount = checks.filter((c) => c.shouldBeSuspended).length;
    const successCount = logs.filter((log) => log.status === "success").length;
    const failureCount = logs.filter((log) => log.status === "failed").length;

    return {
      totalChecks: checks.length,
      expiredAccounts: expiredCount,
      activeExpiredAccounts: activeExpiredCount,
      totalLogs: logs.length,
      successCount,
      failureCount,
    };
  }

  /**
   * Clear logs (for memory management)
   */
  clearLogs(): void {
    this.automationLogs = [];
    this.expirationChecks.clear();
  }
}

// Singleton instance per instance ID
const expirationAutomationInstances: Map<string, ExpirationAutomation> = new Map();

export function getExpirationAutomation(instanceId: string = "default"): ExpirationAutomation {
  if (!expirationAutomationInstances.has(instanceId)) {
    expirationAutomationInstances.set(instanceId, new ExpirationAutomation());
  }
  return expirationAutomationInstances.get(instanceId)!;
}
