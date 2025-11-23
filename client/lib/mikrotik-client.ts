import {
  MikrotikAccount,
  MikrotikPlan,
  MikrotikInvoice,
  MikrotikPayment,
  MikrotikUsage,
} from "@shared/api";

/**
 * Get all accounts
 */
export async function getMikrotikAccounts(instanceId?: string): Promise<MikrotikAccount[]> {
  try {
    const url = new URL("/api/mikrotik/accounts", window.location.origin);
    if (instanceId) {
      url.searchParams.append("instanceId", instanceId);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch accounts");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch accounts"
    );
  }
}

/**
 * Create new account
 */
export async function createMikrotikAccount(data: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  accountType: string;
  planId: string;
  prefix?: string;
  instanceId?: string;
}): Promise<MikrotikAccount> {
  try {
    const response = await fetch("/api/mikrotik/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create account");
    }

    const result = await response.json();
    return result.account;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to create account"
    );
  }
}

/**
 * Get account by ID
 */
export async function getMikrotikAccount(
  accountId: string,
  instanceId?: string
): Promise<MikrotikAccount> {
  try {
    const url = new URL(`/api/mikrotik/accounts/${accountId}`, window.location.origin);
    if (instanceId) {
      url.searchParams.append("instanceId", instanceId);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch account");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch account"
    );
  }
}

/**
 * Update account
 */
export async function updateMikrotikAccount(
  accountId: string,
  data: Partial<MikrotikAccount> & { instanceId?: string }
): Promise<MikrotikAccount> {
  try {
    const response = await fetch(`/api/mikrotik/accounts/${accountId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update account");
    }

    const result = await response.json();
    return result.account;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to update account"
    );
  }
}

/**
 * Delete account
 */
export async function deleteMikrotikAccount(accountId: string, instanceId?: string): Promise<void> {
  try {
    const url = new URL(`/api/mikrotik/accounts/${accountId}`, window.location.origin);
    if (instanceId) {
      url.searchParams.append("instanceId", instanceId);
    }

    const response = await fetch(url.toString(), {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete account");
    }
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to delete account"
    );
  }
}

/**
 * Regenerate PPPoE and Hotspot credentials for an account
 */
export async function regenerateAccountCredentials(
  accountId: string,
  instanceId?: string
): Promise<MikrotikAccount> {
  try {
    const response = await fetch(
      `/api/mikrotik/accounts/${accountId}/regenerate-credentials`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceId }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to regenerate credentials");
    }

    const result = await response.json();
    return result.account;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to regenerate credentials"
    );
  }
}

/**
 * Get all billing plans
 */
export async function getMikrotikPlans(instanceId?: string): Promise<MikrotikPlan[]> {
  try {
    const url = new URL("/api/mikrotik/plans", window.location.origin);
    if (instanceId) {
      url.searchParams.append("instanceId", instanceId);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch plans");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch plans"
    );
  }
}

/**
 * Create billing plan
 */
export async function createMikrotikPlan(data: {
  planName: string;
  planType: string;
  monthlyFee: number;
  description?: string;
  setupFee?: number;
  activationFee?: number;
  features?: string[];
  instanceId?: string;
}): Promise<MikrotikPlan> {
  try {
    const response = await fetch("/api/mikrotik/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create plan");
    }

    const result = await response.json();
    return result.plan;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to create plan"
    );
  }
}

/**
 * Generate invoice
 */
export async function generateInvoice(data: {
  accountId: string;
  billingPeriod?: string;
  instanceId?: string;
}): Promise<MikrotikInvoice> {
  try {
    const response = await fetch("/api/mikrotik/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to generate invoice");
    }

    const result = await response.json();
    return result.invoice;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to generate invoice"
    );
  }
}

/**
 * Get invoices for account
 */
export async function getAccountInvoices(
  accountId: string,
  instanceId?: string
): Promise<MikrotikInvoice[]> {
  try {
    const url = new URL(`/api/mikrotik/accounts/${accountId}/invoices`, window.location.origin);
    if (instanceId) {
      url.searchParams.append("instanceId", instanceId);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch invoices");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch invoices"
    );
  }
}

/**
 * Get all invoices
 */
export async function getAllInvoices(instanceId?: string): Promise<MikrotikInvoice[]> {
  try {
    const url = new URL("/api/mikrotik/invoices", window.location.origin);
    if (instanceId) {
      url.searchParams.append("instanceId", instanceId);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch invoices");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch invoices"
    );
  }
}

/**
 * Record payment
 */
export async function recordPayment(data: {
  accountId: string;
  invoiceId?: string;
  amount: number;
  paymentMethod: string;
  mpesaReceiptNumber?: string;
  instanceId?: string;
}): Promise<MikrotikPayment> {
  try {
    const response = await fetch("/api/mikrotik/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to record payment");
    }

    const result = await response.json();
    return result.payment;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to record payment"
    );
  }
}

/**
 * Get payments for account
 */
export async function getAccountPayments(
  accountId: string,
  instanceId?: string
): Promise<MikrotikPayment[]> {
  try {
    const url = new URL(`/api/mikrotik/accounts/${accountId}/payments`, window.location.origin);
    if (instanceId) {
      url.searchParams.append("instanceId", instanceId);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch payments");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch payments"
    );
  }
}

/**
 * Get usage for account
 */
export async function getAccountUsage(accountId: string, instanceId?: string): Promise<MikrotikUsage[]> {
  try {
    const url = new URL(`/api/mikrotik/accounts/${accountId}/usage`, window.location.origin);
    if (instanceId) {
      url.searchParams.append("instanceId", instanceId);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch usage");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch usage"
    );
  }
}

/**
 * Record usage
 */
export async function recordUsage(data: {
  accountId: string;
  uploadMB: number;
  downloadMB: number;
  sessionCount?: number;
  activeTime?: number;
  instanceId?: string;
}): Promise<MikrotikUsage> {
  try {
    const response = await fetch("/api/mikrotik/usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to record usage");
    }

    const result = await response.json();
    return result.usage;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to record usage"
    );
  }
}

/**
 * Get dashboard statistics
 */
export async function getMikrotikStats(instanceId?: string): Promise<{
  totalAccounts: number;
  activeAccounts: number;
  totalRevenue: number;
  paidRevenue: number;
  pendingPayments: number;
  overdueBills: number;
}> {
  try {
    const url = new URL("/api/mikrotik/stats", window.location.origin);
    if (instanceId) {
      url.searchParams.append("instanceId", instanceId);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch statistics");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch statistics"
    );
  }
}

/**
 * Get RouterOS configuration
 */
export async function getRouterOSConfig(): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/routeros/config");

    if (!response.ok) {
      throw new Error("Failed to fetch RouterOS configuration");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to fetch RouterOS configuration"
    );
  }
}

/**
 * Update RouterOS configuration
 */
export async function updateRouterOSConfig(data: {
  apiUrl: string;
  username: string;
  password: string;
  port?: number;
  useSsl?: boolean;
  interfaceName?: string;
}): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/routeros/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update RouterOS configuration");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to update RouterOS configuration"
    );
  }
}

/**
 * Test RouterOS connection
 */
export async function testRouterOSConnection(data: {
  apiUrl: string;
  username: string;
  password: string;
  port?: number;
  useSsl?: boolean;
}): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/routeros/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to test RouterOS connection");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to test RouterOS connection"
    );
  }
}

/**
 * Get RouterOS device information
 */
export async function getRouterOSDeviceInfo(): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/routeros/device-info");

    if (!response.ok) {
      throw new Error("Failed to fetch device information");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to fetch device information"
    );
  }
}

/**
 * Get RouterOS interface statistics
 */
export async function getRouterOSInterfaceStats(
  interfaceName?: string
): Promise<any> {
  try {
    const url = new URL("/api/mikrotik/routeros/interfaces", window.location.origin);
    if (interfaceName) {
      url.searchParams.append("interfaceName", interfaceName);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch interface statistics");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to fetch interface statistics"
    );
  }
}

/**
 * Get RouterOS PPPoE connections
 */
export async function getRouterOSPPPoEConnections(): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/routeros/pppoe");

    if (!response.ok) {
      throw new Error("Failed to fetch PPPoE connections");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to fetch PPPoE connections"
    );
  }
}

/**
 * Get RouterOS Hotspot users
 */
export async function getRouterOSHotspotUsers(): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/routeros/hotspot");

    if (!response.ok) {
      throw new Error("Failed to fetch Hotspot users");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch Hotspot users"
    );
  }
}

/**
 * Get RouterOS queues
 */
export async function getRouterOSQueues(): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/routeros/queues");

    if (!response.ok) {
      throw new Error("Failed to fetch queues");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch queues"
    );
  }
}

/**
 * Start bandwidth monitoring for an account
 */
export async function startBandwidthMonitoring(accountId: string): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/bandwidth/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    });

    if (!response.ok) {
      throw new Error("Failed to start bandwidth monitoring");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to start bandwidth monitoring"
    );
  }
}

/**
 * Stop bandwidth monitoring for an account
 */
export async function stopBandwidthMonitoring(accountId: string): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/bandwidth/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    });

    if (!response.ok) {
      throw new Error("Failed to stop bandwidth monitoring");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to stop bandwidth monitoring"
    );
  }
}

/**
 * Get bandwidth usage history for an account
 */
export async function getBandwidthHistory(
  accountId: string,
  hours: number = 24
): Promise<any> {
  try {
    const url = new URL(
      `/api/mikrotik/bandwidth/history/${accountId}`,
      window.location.origin
    );
    url.searchParams.append("hours", hours.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch bandwidth history");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch bandwidth history"
    );
  }
}

/**
 * Get peak usage time for an account
 */
export async function getPeakUsageTime(
  accountId: string,
  hours: number = 24
): Promise<any> {
  try {
    const url = new URL(
      `/api/mikrotik/bandwidth/peak/${accountId}`,
      window.location.origin
    );
    url.searchParams.append("hours", hours.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch peak usage time");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch peak usage time"
    );
  }
}

/**
 * Get average bandwidth usage for an account
 */
export async function getAverageBandwidthUsage(
  accountId: string,
  hours: number = 24
): Promise<any> {
  try {
    const url = new URL(
      `/api/mikrotik/bandwidth/average/${accountId}`,
      window.location.origin
    );
    url.searchParams.append("hours", hours.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch average usage");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch average usage"
    );
  }
}

/**
 * Get all quota alerts
 */
export async function getAllQuotaAlerts(): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/bandwidth/alerts");

    if (!response.ok) {
      throw new Error("Failed to fetch quota alerts");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch quota alerts"
    );
  }
}

/**
 * Get quota alerts for a specific account
 */
export async function getAccountQuotaAlerts(accountId: string): Promise<any> {
  try {
    const response = await fetch(`/api/mikrotik/bandwidth/alerts/${accountId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch account alerts");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch account alerts"
    );
  }
}

/**
 * Get bandwidth monitoring status
 */
export async function getMonitoringStatus(): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/bandwidth/status");

    if (!response.ok) {
      throw new Error("Failed to fetch monitoring status");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch monitoring status"
    );
  }
}

/**
 * Schedule automatic billing for an account
 */
export async function scheduleBilling(
  accountId: string,
  billingCycleDay: number = 1
): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/billing/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, billingCycleDay }),
    });

    if (!response.ok) {
      throw new Error("Failed to schedule billing");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to schedule billing"
    );
  }
}

/**
 * Cancel automatic billing for an account
 */
export async function cancelBillingAutomation(accountId: string): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/billing/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    });

    if (!response.ok) {
      throw new Error("Failed to cancel billing");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to cancel billing"
    );
  }
}

/**
 * Get billing automation status
 */
export async function getBillingAutomationStatus(): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/billing/status");

    if (!response.ok) {
      throw new Error("Failed to fetch billing status");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch billing status"
    );
  }
}

/**
 * Get automation logs
 */
export async function fetchAutomationLogs(
  accountId?: string,
  limit: number = 100
): Promise<any> {
  try {
    const url = new URL("/api/mikrotik/billing/logs", window.location.origin);
    if (accountId) {
      url.searchParams.append("accountId", accountId);
    }
    url.searchParams.append("limit", limit.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch automation logs");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch automation logs"
    );
  }
}

/**
 * Test billing automation
 */
export async function testBillingAutomation(accountId: string): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/billing/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    });

    if (!response.ok) {
      throw new Error("Failed to test billing automation");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to test billing automation"
    );
  }
}

/**
 * Process overdue invoices
 */
export async function processOverdueInvoices(overdueDays: number = 7): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/billing/process-overdue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overdueDays }),
    });

    if (!response.ok) {
      throw new Error("Failed to process overdue invoices");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to process overdue invoices"
    );
  }
}

/**
 * Auto-apply credits to invoices
 */
export async function autoApplyCreditsToInvoices(accountId: string): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/billing/apply-credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    });

    if (!response.ok) {
      throw new Error("Failed to apply credits");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to apply credits"
    );
  }
}

/**
 * Send invoice notification
 */
export async function sendInvoiceNotificationAPI(
  accountId: string,
  invoiceId: string
): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/notifications/send-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, invoiceId }),
    });

    if (!response.ok) {
      throw new Error("Failed to send invoice notification");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to send invoice notification"
    );
  }
}

/**
 * Send payment reminder notification
 */
export async function sendPaymentReminderNotificationAPI(
  accountId: string,
  invoiceId: string
): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/notifications/send-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, invoiceId }),
    });

    if (!response.ok) {
      throw new Error("Failed to send payment reminder");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to send payment reminder"
    );
  }
}

/**
 * Send overdue notification
 */
export async function sendOverdueNotificationAPI(
  accountId: string,
  invoiceId: string
): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/notifications/send-overdue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, invoiceId }),
    });

    if (!response.ok) {
      throw new Error("Failed to send overdue notification");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to send overdue notification"
    );
  }
}

/**
 * Send payment received notification
 */
export async function sendPaymentReceivedNotificationAPI(
  accountId: string,
  paymentId: string
): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/notifications/send-payment-received", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, paymentId }),
    });

    if (!response.ok) {
      throw new Error("Failed to send payment received notification");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to send payment received notification"
    );
  }
}

/**
 * Send quota alert notification
 */
export async function sendQuotaAlertNotificationAPI(
  accountId: string,
  percentageUsed: number,
  usedData?: number,
  totalQuota?: number
): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/notifications/send-quota-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, percentageUsed, usedData, totalQuota }),
    });

    if (!response.ok) {
      throw new Error("Failed to send quota alert");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to send quota alert"
    );
  }
}

/**
 * Get notification logs
 */
export async function getNotificationLogsAPI(
  accountId?: string,
  limit: number = 100
): Promise<any> {
  try {
    const url = new URL("/api/mikrotik/notifications/logs", window.location.origin);
    if (accountId) {
      url.searchParams.append("accountId", accountId);
    }
    url.searchParams.append("limit", limit.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch notification logs");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch notification logs"
    );
  }
}

/**
 * Get notification templates
 */
export async function getNotificationTemplatesAPI(): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/notifications/templates");

    if (!response.ok) {
      throw new Error("Failed to fetch notification templates");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch notification templates"
    );
  }
}

/**
 * Get notification statistics
 */
export async function getNotificationStatsAPI(): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/notifications/stats");

    if (!response.ok) {
      throw new Error("Failed to fetch notification statistics");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch notification statistics"
    );
  }
}

/**
 * Get dashboard analytics
 */
export async function getDashboardAnalytics(): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/analytics/dashboard");

    if (!response.ok) {
      throw new Error("Failed to fetch dashboard analytics");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch dashboard analytics"
    );
  }
}

/**
 * Get revenue analytics
 */
export async function getRevenueAnalytics(startDate?: string, endDate?: string): Promise<any> {
  try {
    const url = new URL("/api/mikrotik/analytics/revenue", window.location.origin);
    if (startDate) url.searchParams.append("startDate", startDate);
    if (endDate) url.searchParams.append("endDate", endDate);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch revenue analytics");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch revenue analytics"
    );
  }
}

/**
 * Get monthly revenue trend
 */
export async function getMonthlyRevenueTrend(months: number = 12): Promise<any> {
  try {
    const url = new URL("/api/mikrotik/analytics/revenue-trend", window.location.origin);
    url.searchParams.append("months", months.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch revenue trend");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch revenue trend"
    );
  }
}

/**
 * Get account growth trend
 */
export async function getAccountGrowthTrend(months: number = 12): Promise<any> {
  try {
    const url = new URL("/api/mikrotik/analytics/account-trend", window.location.origin);
    url.searchParams.append("months", months.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch account trend");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch account trend"
    );
  }
}

/**
 * Get payment method distribution
 */
export async function getPaymentMethodDistribution(): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/analytics/payment-methods");

    if (!response.ok) {
      throw new Error("Failed to fetch payment methods");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch payment methods"
    );
  }
}

/**
 * Get service plan distribution
 */
export async function getServicePlanDistribution(): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/analytics/service-plans");

    if (!response.ok) {
      throw new Error("Failed to fetch service plans");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch service plans"
    );
  }
}

/**
 * Get top customers by revenue
 */
export async function getTopCustomersByRevenue(limit: number = 10): Promise<any> {
  try {
    const url = new URL("/api/mikrotik/analytics/top-customers", window.location.origin);
    url.searchParams.append("limit", limit.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch top customers");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch top customers"
    );
  }
}

/**
 * Generate monthly billing report
 */
export async function generateMonthlyBillingReport(month: number, year: number): Promise<any> {
  try {
    const response = await fetch("/api/mikrotik/analytics/monthly-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, year }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate monthly report");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to generate monthly report"
    );
  }
}
