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
export async function getMikrotikAccounts(): Promise<MikrotikAccount[]> {
  try {
    const response = await fetch("/api/mikrotik/accounts");

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
  accountId: string
): Promise<MikrotikAccount> {
  try {
    const response = await fetch(`/api/mikrotik/accounts/${accountId}`);

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
  data: Partial<MikrotikAccount>
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
export async function deleteMikrotikAccount(accountId: string): Promise<void> {
  try {
    const response = await fetch(`/api/mikrotik/accounts/${accountId}`, {
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
 * Get all billing plans
 */
export async function getMikrotikPlans(): Promise<MikrotikPlan[]> {
  try {
    const response = await fetch("/api/mikrotik/plans");

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
  accountId: string
): Promise<MikrotikInvoice[]> {
  try {
    const response = await fetch(`/api/mikrotik/accounts/${accountId}/invoices`);

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
export async function getAllInvoices(): Promise<MikrotikInvoice[]> {
  try {
    const response = await fetch("/api/mikrotik/invoices");

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
  accountId: string
): Promise<MikrotikPayment[]> {
  try {
    const response = await fetch(`/api/mikrotik/accounts/${accountId}/payments`);

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
export async function getAccountUsage(accountId: string): Promise<MikrotikUsage[]> {
  try {
    const response = await fetch(`/api/mikrotik/accounts/${accountId}/usage`);

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
export async function getMikrotikStats(): Promise<{
  totalAccounts: number;
  activeAccounts: number;
  totalRevenue: number;
  paidRevenue: number;
  pendingPayments: number;
  overdueBills: number;
}> {
  try {
    const response = await fetch("/api/mikrotik/stats");

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
