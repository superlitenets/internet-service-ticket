/**
 * Mikrotik Bandwidth Monitoring Service
 * Tracks usage for accounts and enforces quotas/limits
 */

export interface BandwidthUsageRecord {
  accountId: string;
  timestamp: string;
  downloadMBps: number; // Current download speed in Mbps
  uploadMBps: number; // Current upload speed in Mbps
  totalDownloadMB: number; // Total downloaded today in MB
  totalUploadMB: number; // Total uploaded today in MB
  percentageOfQuota?: number; // If quota-based
  status: "normal" | "warning" | "exceeded";
}

export interface BandwidthQuotaAlert {
  accountId: string;
  accountNumber: string;
  customerName: string;
  currentUsageMB: number;
  quotaMB: number;
  percentageUsed: number;
  alertLevel: "info" | "warning" | "critical";
  timestamp: string;
}

export class BandwidthMonitor {
  private usageHistory: Map<string, BandwidthUsageRecord[]> = new Map();
  private quotaAlerts: BandwidthQuotaAlert[] = [];
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Start monitoring an account
   */
  startMonitoring(
    accountId: string,
    quotaMB?: number,
    interval: number = 60000 // Default 1 minute
  ): void {
    if (this.monitoringIntervals.has(accountId)) {
      return; // Already monitoring
    }

    const intervalId = setInterval(async () => {
      await this.checkAccountUsage(accountId, quotaMB);
    }, interval);

    this.monitoringIntervals.set(accountId, intervalId);
    this.usageHistory.set(accountId, []);
  }

  /**
   * Stop monitoring an account
   */
  stopMonitoring(accountId: string): void {
    const intervalId = this.monitoringIntervals.get(accountId);
    if (intervalId) {
      clearInterval(intervalId);
      this.monitoringIntervals.delete(accountId);
    }
  }

  /**
   * Check usage for a specific account
   */
  async checkAccountUsage(
    accountId: string,
    quotaMB?: number
  ): Promise<BandwidthUsageRecord | null> {
    try {
      // Simulate getting usage from RouterOS
      const usage = await this.getAccountBandwidthUsage(accountId);

      if (!usage) {
        return null;
      }

      // Store in history
      const history = this.usageHistory.get(accountId) || [];
      history.push(usage);

      // Keep only last 24 hours of data
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const filtered = history.filter(
        (record) => new Date(record.timestamp).getTime() > oneDayAgo
      );
      this.usageHistory.set(accountId, filtered);

      // Check quota and trigger alerts
      if (quotaMB) {
        await this.checkQuotaExceeded(accountId, usage, quotaMB);
      }

      return usage;
    } catch (error) {
      console.error(
        `Failed to check usage for account ${accountId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Get current bandwidth usage for account
   */
  private async getAccountBandwidthUsage(
    accountId: string
  ): Promise<BandwidthUsageRecord> {
    // In production, query RouterOS for actual data
    // For now, return simulated data
    const usage: BandwidthUsageRecord = {
      accountId,
      timestamp: new Date().toISOString(),
      downloadMBps: Math.random() * 50, // 0-50 Mbps
      uploadMBps: Math.random() * 20, // 0-20 Mbps
      totalDownloadMB: Math.random() * 5000, // 0-5GB
      totalUploadMB: Math.random() * 2000, // 0-2GB
      status: "normal",
    };

    return usage;
  }

  /**
   * Check if quota is exceeded and trigger alerts
   */
  private async checkQuotaExceeded(
    accountId: string,
    usage: BandwidthUsageRecord,
    quotaMB: number
  ): Promise<void> {
    const totalUsage = usage.totalDownloadMB + usage.totalUploadMB;
    const percentageUsed = (totalUsage / quotaMB) * 100;

    let alertLevel: "info" | "warning" | "critical" = "info";
    if (percentageUsed >= 100) {
      alertLevel = "critical";
    } else if (percentageUsed >= 80) {
      alertLevel = "warning";
    }

    // Remove old alerts for this account
    this.quotaAlerts = this.quotaAlerts.filter(
      (alert) => alert.accountId !== accountId
    );

    // Add new alert if needed
    if (percentageUsed >= 80) {
      this.quotaAlerts.push({
        accountId,
        accountNumber: "ACC-" + accountId.slice(-4), // Placeholder
        customerName: "Customer", // Would be fetched in production
        currentUsageMB: totalUsage,
        quotaMB,
        percentageUsed: Math.round(percentageUsed),
        alertLevel,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get usage history for account
   */
  getUsageHistory(accountId: string, hours: number = 24): BandwidthUsageRecord[] {
    const history = this.usageHistory.get(accountId) || [];
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;

    return history.filter(
      (record) => new Date(record.timestamp).getTime() > cutoffTime
    );
  }

  /**
   * Get peak usage time
   */
  getPeakUsageTime(
    accountId: string,
    hours: number = 24
  ): { time: string; downloadMBps: number; uploadMBps: number } | null {
    const history = this.getUsageHistory(accountId, hours);

    if (history.length === 0) {
      return null;
    }

    const maxRecord = history.reduce((max, record) => {
      const maxSpeed = max.downloadMBps + max.uploadMBps;
      const currentSpeed = record.downloadMBps + record.uploadMBps;
      return currentSpeed > maxSpeed ? record : max;
    });

    return {
      time: maxRecord.timestamp,
      downloadMBps: maxRecord.downloadMBps,
      uploadMBps: maxRecord.uploadMBps,
    };
  }

  /**
   * Get average bandwidth usage
   */
  getAverageUsage(
    accountId: string,
    hours: number = 24
  ): { downloadMBps: number; uploadMBps: number } {
    const history = this.getUsageHistory(accountId, hours);

    if (history.length === 0) {
      return { downloadMBps: 0, uploadMBps: 0 };
    }

    const sumDownload = history.reduce((sum, r) => sum + r.downloadMBps, 0);
    const sumUpload = history.reduce((sum, r) => sum + r.uploadMBps, 0);

    return {
      downloadMBps: sumDownload / history.length,
      uploadMBps: sumUpload / history.length,
    };
  }

  /**
   * Get all active quota alerts
   */
  getQuotaAlerts(): BandwidthQuotaAlert[] {
    return this.quotaAlerts;
  }

  /**
   * Get alerts for specific account
   */
  getAccountAlerts(accountId: string): BandwidthQuotaAlert[] {
    return this.quotaAlerts.filter((alert) => alert.accountId === accountId);
  }

  /**
   * Clear alerts for account
   */
  clearAccountAlerts(accountId: string): void {
    this.quotaAlerts = this.quotaAlerts.filter(
      (alert) => alert.accountId !== accountId
    );
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): {
    activeAccounts: number;
    totalRecords: number;
    totalAlerts: number;
  } {
    let totalRecords = 0;
    this.usageHistory.forEach((history) => {
      totalRecords += history.length;
    });

    return {
      activeAccounts: this.monitoringIntervals.size,
      totalRecords,
      totalAlerts: this.quotaAlerts.length,
    };
  }
}

// Singleton instance
let monitor: BandwidthMonitor | null = null;

export function getBandwidthMonitor(): BandwidthMonitor {
  if (!monitor) {
    monitor = new BandwidthMonitor();
  }
  return monitor;
}
