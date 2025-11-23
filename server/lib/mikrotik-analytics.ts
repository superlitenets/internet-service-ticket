/**
 * Mikrotik Analytics and Reporting Service
 * Provides comprehensive analytics and reporting capabilities
 */

export interface RevenueAnalytics {
  period: string;
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  averageTransaction: number;
}

export interface AccountAnalytics {
  totalAccounts: number;
  activeAccounts: number;
  inactiveAccounts: number;
  suspendedAccounts: number;
  growthRate: number; // percentage
  accountsByType: Record<string, number>;
}

export interface PaymentAnalytics {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  successRate: number; // percentage
  paymentsByMethod: Record<string, number>;
  averagePaymentAmount: number;
}

export interface BandwidthAnalytics {
  totalBandwidthUsed: number; // in GB
  averageUserBandwidth: number; // in GB
  peakBandwidthTime: string;
  bandwidthTrend: number[]; // last 7 days
}

export interface CustomReport {
  id: string;
  name: string;
  type: "revenue" | "accounts" | "payments" | "bandwidth" | "custom";
  startDate: string;
  endDate: string;
  data: any;
  createdAt: string;
}

export class AnalyticsService {
  private reports: Map<string, CustomReport> = new Map();
  private reportCounter: number = 0;

  /**
   * Get revenue analytics for a period
   */
  getRevenueAnalytics(
    startDate: Date,
    endDate: Date
  ): RevenueAnalytics {
    // In production, query database for actual data
    const totalRevenue = Math.random() * 1000000;
    const paidRevenue = totalRevenue * (0.7 + Math.random() * 0.2); // 70-90% paid
    const pendingRevenue = totalRevenue - paidRevenue;

    return {
      period: `${startDate.toDateString()} to ${endDate.toDateString()}`,
      totalRevenue: Math.round(totalRevenue),
      paidRevenue: Math.round(paidRevenue),
      pendingRevenue: Math.round(pendingRevenue),
      averageTransaction: Math.round(totalRevenue / (Math.random() * 100 + 50)),
    };
  }

  /**
   * Get account analytics
   */
  getAccountAnalytics(totalAccounts: number): AccountAnalytics {
    const activeAccounts = Math.floor(totalAccounts * (0.85 + Math.random() * 0.1));
    const suspendedAccounts = Math.floor(totalAccounts * (0.05 + Math.random() * 0.05));
    const inactiveAccounts = totalAccounts - activeAccounts - suspendedAccounts;

    return {
      totalAccounts,
      activeAccounts,
      inactiveAccounts,
      suspendedAccounts,
      growthRate: parseFloat((Math.random() * 15 + 5).toFixed(2)),
      accountsByType: {
        residential: Math.floor(totalAccounts * 0.6),
        business: Math.floor(totalAccounts * 0.25),
        prepaid: Math.floor(totalAccounts * 0.1),
        postpaid: Math.floor(totalAccounts * 0.05),
      },
    };
  }

  /**
   * Get payment analytics
   */
  getPaymentAnalytics(totalPayments: number): PaymentAnalytics {
    const successfulPayments = Math.floor(totalPayments * (0.92 + Math.random() * 0.05));
    const failedPayments = totalPayments - successfulPayments;

    return {
      totalPayments,
      successfulPayments,
      failedPayments,
      successRate: parseFloat(((successfulPayments / totalPayments) * 100).toFixed(2)),
      paymentsByMethod: {
        mpesa: Math.floor(totalPayments * 0.7),
        "bank-transfer": Math.floor(totalPayments * 0.15),
        cash: Math.floor(totalPayments * 0.1),
        cheque: Math.floor(totalPayments * 0.05),
      },
      averagePaymentAmount: Math.round(Math.random() * 50000 + 10000),
    };
  }

  /**
   * Get bandwidth analytics
   */
  getBandwidthAnalytics(): BandwidthAnalytics {
    const totalBandwidthUsed = Math.random() * 10000; // 0-10TB
    const averageUserBandwidth = Math.random() * 500; // 0-500GB per user

    const bandwidthTrend = Array.from({ length: 7 }, () =>
      Math.round(Math.random() * 1500)
    );

    return {
      totalBandwidthUsed: Math.round(totalBandwidthUsed),
      averageUserBandwidth: Math.round(averageUserBandwidth),
      peakBandwidthTime: "14:00-16:00 (2PM-4PM)",
      bandwidthTrend,
    };
  }

  /**
   * Generate custom report
   */
  generateCustomReport(
    name: string,
    type: "revenue" | "accounts" | "payments" | "bandwidth" | "custom",
    startDate: Date,
    endDate: Date,
    filters?: Record<string, any>
  ): CustomReport {
    let data: any = {};

    switch (type) {
      case "revenue":
        data = this.getRevenueAnalytics(startDate, endDate);
        break;
      case "accounts":
        data = this.getAccountAnalytics(Math.floor(Math.random() * 500) + 100);
        break;
      case "payments":
        data = this.getPaymentAnalytics(Math.floor(Math.random() * 1000) + 100);
        break;
      case "bandwidth":
        data = this.getBandwidthAnalytics();
        break;
      default:
        data = { custom: true, filters };
    }

    const report: CustomReport = {
      id: `REPORT-${++this.reportCounter}`,
      name,
      type,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      data,
      createdAt: new Date().toISOString(),
    };

    this.reports.set(report.id, report);
    return report;
  }

  /**
   * Get all generated reports
   */
  getReports(): CustomReport[] {
    return Array.from(this.reports.values());
  }

  /**
   * Get report by ID
   */
  getReport(reportId: string): CustomReport | undefined {
    return this.reports.get(reportId);
  }

  /**
   * Delete report
   */
  deleteReport(reportId: string): boolean {
    return this.reports.delete(reportId);
  }

  /**
   * Export report as JSON
   */
  exportReportAsJSON(reportId: string): string | null {
    const report = this.reports.get(reportId);
    if (!report) {
      return null;
    }
    return JSON.stringify(report, null, 2);
  }

  /**
   * Get dashboard summary
   */
  getDashboardSummary(
    totalAccounts: number,
    totalInvoices: number,
    totalPayments: number
  ): {
    revenue: RevenueAnalytics;
    accounts: AccountAnalytics;
    payments: PaymentAnalytics;
    bandwidth: BandwidthAnalytics;
  } {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      revenue: this.getRevenueAnalytics(startOfMonth, now),
      accounts: this.getAccountAnalytics(totalAccounts),
      payments: this.getPaymentAnalytics(totalPayments),
      bandwidth: this.getBandwidthAnalytics(),
    };
  }

  /**
   * Get monthly revenue trend
   */
  getMonthlyRevenueTrend(months: number = 12): Array<{
    month: string;
    revenue: number;
    growth: number;
  }> {
    const trend = [];
    let prevRevenue = Math.random() * 100000;

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const revenue = prevRevenue * (0.95 + Math.random() * 0.15); // 95-110% growth
      const growth = ((revenue - prevRevenue) / prevRevenue) * 100;

      trend.push({
        month: date.toLocaleDateString("en-US", { year: "numeric", month: "short" }),
        revenue: Math.round(revenue),
        growth: parseFloat(growth.toFixed(2)),
      });

      prevRevenue = revenue;
    }

    return trend;
  }

  /**
   * Get account growth trend
   */
  getAccountGrowthTrend(months: number = 12): Array<{
    month: string;
    activeAccounts: number;
    totalAccounts: number;
  }> {
    const trend = [];
    let totalAccounts = Math.floor(Math.random() * 200) + 100;

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const activeAccounts = Math.floor(totalAccounts * (0.8 + Math.random() * 0.1));

      trend.push({
        month: date.toLocaleDateString("en-US", { year: "numeric", month: "short" }),
        activeAccounts,
        totalAccounts,
      });

      totalAccounts = Math.floor(totalAccounts * (0.98 + Math.random() * 0.05)); // Slight growth or decay
    }

    return trend;
  }

  /**
   * Get payment method distribution
   */
  getPaymentMethodDistribution(): Record<string, number> {
    return {
      mpesa: Math.floor(Math.random() * 1000) + 500,
      "bank-transfer": Math.floor(Math.random() * 300) + 100,
      cash: Math.floor(Math.random() * 200) + 50,
      cheque: Math.floor(Math.random() * 100) + 20,
    };
  }

  /**
   * Get service plan distribution
   */
  getServicePlanDistribution(): Record<string, number> {
    return {
      "Basic Residential": Math.floor(Math.random() * 300) + 100,
      "Premium Business": Math.floor(Math.random() * 150) + 50,
      "Quota Prepaid": Math.floor(Math.random() * 100) + 30,
      "Enterprise": Math.floor(Math.random() * 50) + 10,
    };
  }

  /**
   * Get top customers by revenue
   */
  getTopCustomersByRevenue(limit: number = 10): Array<{
    customerName: string;
    totalSpent: number;
    accountCount: number;
  }> {
    const customers = [];
    for (let i = 0; i < Math.min(limit, 10); i++) {
      customers.push({
        customerName: `Customer ${i + 1}`,
        totalSpent: Math.floor(Math.random() * 500000) + 50000,
        accountCount: Math.floor(Math.random() * 5) + 1,
      });
    }
    return customers.sort((a, b) => b.totalSpent - a.totalSpent);
  }

  /**
   * Generate monthly billing report
   */
  generateMonthlyBillingReport(month: number, year: number): any {
    return {
      period: `${month}/${year}`,
      totalInvoices: Math.floor(Math.random() * 500) + 100,
      totalAmount: Math.floor(Math.random() * 5000000) + 500000,
      paidAmount: Math.floor(Math.random() * 4000000) + 400000,
      pendingAmount: Math.floor(Math.random() * 1000000) + 100000,
      overdue: Math.floor(Math.random() * 50) + 10,
      averagePaymentTime: Math.floor(Math.random() * 10) + 3, // days
    };
  }
}

// Singleton instance
let analyticsService: AnalyticsService | null = null;

export function getAnalyticsService(): AnalyticsService {
  if (!analyticsService) {
    analyticsService = new AnalyticsService();
  }
  return analyticsService;
}
