/**
 * Client library for account expiration and renewal automation
 */

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

export interface ExpirationStatus {
  totalChecks: number;
  expiredAccounts: number;
  activeExpiredAccounts: number;
  totalLogs: number;
  successCount: number;
  failureCount: number;
}

export interface CheckExpirationStatusRequest {
  gracePeriodDays?: number;
}

export interface CheckExpirationStatusResponse {
  success: boolean;
  message: string;
  checks: ExpirationCheck[];
  summary: {
    totalAccounts: number;
    expiredAccounts: number;
    activeExpiredAccounts: number;
  };
}

export interface ProcessExpirationRequest {
  gracePeriodDays?: number;
  autoSuspend?: boolean;
}

export interface ProcessExpirationResponse {
  success: boolean;
  message: string;
  result: {
    processedCount: number;
    suspendedCount: number;
    failedCount: number;
    skippedCount: number;
  };
}

export interface ProcessRenewalRequest {
  accountId: string;
  newNextBillingDate: string;
}

export interface ProcessRenewalResponse {
  success: boolean;
  message: string;
  result: {
    success: boolean;
    wasResumed: boolean;
    message: string;
  };
  account?: any;
}

export interface GetLogsRequest {
  accountId?: string;
  limit?: number;
}

export interface GetLogsResponse {
  success: boolean;
  message: string;
  logs: ExpirationLog[];
  totalLogs: number;
}

export interface GetStatusResponse {
  success: boolean;
  message: string;
  status: ExpirationStatus;
}

class ExpirationClient {
  private baseUrl: string;

  constructor(baseUrl: string = "/api") {
    this.baseUrl = baseUrl;
  }

  /**
   * Check account expiration status
   */
  async checkExpirationStatus(
    instanceId?: string,
    gracePeriodDays: number = 0
  ): Promise<CheckExpirationStatusResponse> {
    const url = new URL(this.baseUrl + "/mikrotik/expiration/check-status", window.location.origin);
    if (instanceId) {
      url.searchParams.append("instanceId", instanceId);
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gracePeriodDays }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Process account expirations
   */
  async processExpirations(
    instanceId?: string,
    gracePeriodDays: number = 0,
    autoSuspend: boolean = true
  ): Promise<ProcessExpirationResponse> {
    const url = new URL(this.baseUrl + "/mikrotik/expiration/process", window.location.origin);
    if (instanceId) {
      url.searchParams.append("instanceId", instanceId);
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gracePeriodDays, autoSuspend }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Process account renewal
   */
  async processRenewal(
    accountId: string,
    newNextBillingDate: string,
    instanceId?: string
  ): Promise<ProcessRenewalResponse> {
    const url = new URL(this.baseUrl + "/mikrotik/expiration/renew", window.location.origin);
    if (instanceId) {
      url.searchParams.append("instanceId", instanceId);
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountId,
        newNextBillingDate,
        instanceId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get expiration automation logs
   */
  async getLogs(
    instanceId?: string,
    accountId?: string,
    limit: number = 100
  ): Promise<GetLogsResponse> {
    const url = new URL(this.baseUrl + "/mikrotik/expiration/logs", window.location.origin);
    if (instanceId) {
      url.searchParams.append("instanceId", instanceId);
    }
    if (accountId) {
      url.searchParams.append("accountId", accountId);
    }
    url.searchParams.append("limit", limit.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get expiration automation status
   */
  async getStatus(instanceId?: string): Promise<GetStatusResponse> {
    const url = new URL(this.baseUrl + "/mikrotik/expiration/status", window.location.origin);
    if (instanceId) {
      url.searchParams.append("instanceId", instanceId);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

// Singleton instance
let expirationClient: ExpirationClient | null = null;

export function getExpirationClient(baseUrl?: string): ExpirationClient {
  if (!expirationClient) {
    expirationClient = new ExpirationClient(baseUrl);
  }
  return expirationClient;
}
