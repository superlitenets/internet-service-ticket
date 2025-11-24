import { RequestHandler } from "express";
import {
  MikrotikAccount,
  MikrotikPlan,
  MikrotikInvoice,
  MikrotikPayment,
  MikrotikUsage,
  MikrotikConfig,
  RADIUSConfig,
} from "@shared/api";
import {
  createRouterOSClient,
  RouterOSCredentials,
  RouterOSInterfaceStats,
} from "../lib/mikrotik-routeros";
import { getBandwidthMonitor } from "../lib/mikrotik-bandwidth-monitor";
import { getBillingAutomation } from "../lib/mikrotik-billing-automation";
import { getExpirationAutomation } from "../lib/mikrotik-expiration-automation";
import { getNotificationService } from "../lib/mikrotik-notifications";
import { getAnalyticsService } from "../lib/mikrotik-analytics";
import { getRADIUSClient, RADIUSUser, RADIUSResponse } from "../lib/radius-client";

// In-memory storage per instance (for demo purposes)
const instanceData: Record<string, {
  accounts: MikrotikAccount[];
  plans: MikrotikPlan[];
  invoices: MikrotikInvoice[];
  payments: MikrotikPayment[];
  usageRecords: MikrotikUsage[];
  radiusConfig?: RADIUSConfig;
}> = {};

// Default instance ID for backwards compatibility
const DEFAULT_INSTANCE_ID = "default";

/**
 * Get or initialize data for an instance
 */
function getInstanceData(instanceId?: string) {
  const id = instanceId || DEFAULT_INSTANCE_ID;
  if (!instanceData[id]) {
    instanceData[id] = {
      accounts: [],
      plans: [],
      invoices: [],
      payments: [],
      usageRecords: [],
    };
  }
  return instanceData[id];
}

/**
 * Generate secure PPPoE and Hotspot credentials based on account number
 */
function generatePPPoECredentials(accountNumber: string) {
  // Generate random password (alphanumeric, at least 8 characters)
  const generatePassword = (): string => {
    const length = 12;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  return {
    pppoeUsername: accountNumber, // Use account number as username
    pppoePassword: generatePassword(),
    hotspotUsername: `hs_${accountNumber}`, // Hotspot prefix
    hotspotPassword: generatePassword(),
  };
}

// Initialize default plans for an instance
function initializeDefaultPlans(instanceId?: string) {
  const data = getInstanceData(instanceId);
  if (data.plans.length === 0) {
    data.plans = [
      {
        id: "plan-1",
        planName: "Basic Residential",
        description: "Perfect for home users",
        planType: "flat-rate",
        monthlyFee: 1500,
        speed: { downloadMbps: 10, uploadMbps: 5 },
        setupFee: 0,
        activationFee: 500,
        discount: 0,
        features: ["10Mbps Download", "5Mbps Upload", "Unlimited Data"],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "plan-2",
        planName: "Premium Business",
        description: "For small businesses",
        planType: "flat-rate",
        monthlyFee: 5000,
        speed: { downloadMbps: 50, uploadMbps: 20 },
        setupFee: 1000,
        activationFee: 2000,
        discount: 5,
        features: ["50Mbps Download", "20Mbps Upload", "Priority Support"],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "plan-3",
        planName: "Quota Prepaid",
        description: "Pay as you use - 10GB",
        planType: "quota-based",
        monthlyFee: 500,
        dataQuota: 10,
        speed: { downloadMbps: 5, uploadMbps: 2 },
        setupFee: 0,
        activationFee: 0,
        discount: 0,
        features: ["10GB Monthly Data", "Pay Per Use"],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
}

/**
 * Get all Mikrotik accounts
 */
export const getMikrotikAccounts: RequestHandler = (req, res) => {
  try {
    const instanceId = req.query.instanceId as string | undefined;
    const data = getInstanceData(instanceId);
    initializeDefaultPlans(instanceId);
    return res.json(data.accounts);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch accounts",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Create new Mikrotik account
 */
export const createMikrotikAccount: RequestHandler = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      accountType,
      planId,
      prefix = "ACC",
      instanceId,
    } = req.body;

    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !accountType ||
      !planId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "Validation error",
      });
    }

    const data = getInstanceData(instanceId);
    initializeDefaultPlans(instanceId);

    const plan = data.plans.find((p) => p.id === planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
        error: "Invalid plan",
      });
    }

    const accountNumber = `${prefix}-${data.accounts.length + 1000}`;
    const credentials = generatePPPoECredentials(accountNumber);

    const newAccount: MikrotikAccount = {
      id: `ACC-${Date.now()}`,
      accountNumber,
      customerName,
      customerEmail,
      customerPhone,
      accountType,
      status: "active",
      planId,
      planName: plan.planName,
      monthlyFee: plan.monthlyFee,
      dataQuota: plan.dataQuota,
      balance: 0,
      totalPaid: 0,
      outstandingBalance: plan.monthlyFee + (plan.activationFee || 0),
      registrationDate: new Date().toISOString(),
      ...credentials,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.accounts.push(newAccount);

    // Sync to RADIUS if enabled
    let radiusSync: any = { skipped: true };
    if (data.radiusConfig?.enabled && data.radiusConfig.syncOnCreate) {
      const radiusClient = getRADIUSClient(data.radiusConfig);
      const users = [
        {
          username: newAccount.pppoeUsername,
          password: newAccount.pppoePassword,
          userType: "pppoe" as const,
        },
        {
          username: newAccount.hotspotUsername,
          password: newAccount.hotspotPassword,
          userType: "hotspot" as const,
        },
      ];
      radiusSync = await radiusClient.createUsers(users);
    }

    return res.json({
      success: true,
      message: "Account created successfully",
      account: newAccount,
      radiusSync,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create account",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get account by ID
 */
export const getMikrotikAccount: RequestHandler = (req, res) => {
  try {
    const { accountId } = req.params;
    const instanceId = req.query.instanceId as string | undefined;
    const data = getInstanceData(instanceId);

    const account = data.accounts.find((a) => a.id === accountId);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
        error: "Not found",
      });
    }

    return res.json(account);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch account",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Update Mikrotik account
 */
export const updateMikrotikAccount: RequestHandler = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { instanceId, ...updates } = req.body;
    const data = getInstanceData(instanceId);

    const accountIndex = data.accounts.findIndex((a) => a.id === accountId);

    if (accountIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
        error: "Not found",
      });
    }

    const oldAccount = data.accounts[accountIndex];
    const newAccount = {
      ...data.accounts[accountIndex],
      ...updates,
      id: data.accounts[accountIndex].id,
      accountNumber: data.accounts[accountIndex].accountNumber,
      createdAt: data.accounts[accountIndex].createdAt,
      updatedAt: new Date().toISOString(),
    };

    data.accounts[accountIndex] = newAccount;

    // Sync status changes to RADIUS if enabled
    let radiusSync: any = { skipped: true };
    if (data.radiusConfig?.enabled && updates.status && oldAccount.status !== updates.status) {
      const radiusClient = getRADIUSClient(data.radiusConfig);
      if (updates.status === "suspended" || updates.status === "closed") {
        const result1 = await radiusClient.disableUser(oldAccount.pppoeUsername);
        const result2 = await radiusClient.disableUser(oldAccount.hotspotUsername);
        radiusSync = {
          success: result1.success && result2.success,
          message: `Suspended PPPoE user: ${result1.message}, Hotspot user: ${result2.message}`,
        };
      } else if (updates.status === "active") {
        const result1 = await radiusClient.enableUser(oldAccount.pppoeUsername);
        const result2 = await radiusClient.enableUser(oldAccount.hotspotUsername);
        radiusSync = {
          success: result1.success && result2.success,
          message: `Resumed PPPoE user: ${result1.message}, Hotspot user: ${result2.message}`,
        };
      }
    }

    return res.json({
      success: true,
      message: "Account updated successfully",
      account: newAccount,
      radiusSync,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update account",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Delete Mikrotik account
 */
export const deleteMikrotikAccount: RequestHandler = async (req, res) => {
  try {
    const { accountId } = req.params;
    const instanceId = req.query.instanceId as string | undefined;
    const data = getInstanceData(instanceId);

    const accountIndex = data.accounts.findIndex((a) => a.id === accountId);

    if (accountIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
        error: "Not found",
      });
    }

    const deleted = data.accounts.splice(accountIndex, 1)[0];

    // Remove from RADIUS if enabled
    let radiusSync: any = { skipped: true };
    if (data.radiusConfig?.enabled && data.radiusConfig.syncOnDelete) {
      const radiusClient = getRADIUSClient(data.radiusConfig);
      const result1 = await radiusClient.deleteUser(deleted.pppoeUsername, "pppoe");
      const result2 = await radiusClient.deleteUser(deleted.hotspotUsername, "hotspot");
      radiusSync = {
        success: result1.success && result2.success,
        message: `Deleted PPPoE user: ${result1.message}, Hotspot user: ${result2.message}`,
      };
    }

    return res.json({
      success: true,
      message: "Account deleted successfully",
      account: deleted,
      radiusSync,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete account",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Regenerate PPPoE and Hotspot credentials for an account
 */
export const regenerateAccountCredentials: RequestHandler = (req, res) => {
  try {
    const { accountId } = req.params;
    const { instanceId } = req.body;
    const data = getInstanceData(instanceId);

    const accountIndex = data.accounts.findIndex((a) => a.id === accountId);

    if (accountIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
        error: "Not found",
      });
    }

    const account = data.accounts[accountIndex];
    const credentials = generatePPPoECredentials(account.accountNumber);

    data.accounts[accountIndex] = {
      ...data.accounts[accountIndex],
      ...credentials,
      updatedAt: new Date().toISOString(),
    };

    return res.json({
      success: true,
      message: "Account credentials regenerated successfully",
      account: data.accounts[accountIndex],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to regenerate credentials",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get all billing plans
 */
export const getMikrotikPlans: RequestHandler = (req, res) => {
  try {
    const instanceId = req.query.instanceId as string | undefined;
    const data = getInstanceData(instanceId);
    initializeDefaultPlans(instanceId);
    return res.json(data.plans);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch plans",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Create billing plan
 */
export const createMikrotikPlan: RequestHandler = (req, res) => {
  try {
    const { planName, planType, monthlyFee, description, instanceId } = req.body;

    if (!planName || !planType || monthlyFee === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "Validation error",
      });
    }

    const data = getInstanceData(instanceId);

    const newPlan: MikrotikPlan = {
      id: `PLAN-${Date.now()}`,
      planName,
      description: description || "",
      planType,
      monthlyFee,
      setupFee: req.body.setupFee || 0,
      activationFee: req.body.activationFee || 0,
      discount: req.body.discount || 0,
      features: req.body.features || [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (planType === "quota-based") {
      newPlan.dataQuota = req.body.dataQuota || 10;
    }

    if (req.body.speed) {
      newPlan.speed = req.body.speed;
    }

    data.plans.push(newPlan);

    return res.json({
      success: true,
      message: "Plan created successfully",
      plan: newPlan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create plan",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Generate invoice for account
 */
export const generateInvoice: RequestHandler = (req, res) => {
  try {
    const { accountId, billingPeriod, instanceId } = req.body;
    const data = getInstanceData(instanceId);

    const account = data.accounts.find((a) => a.id === accountId);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
        error: "Not found",
      });
    }

    const amount = account.monthlyFee;
    const discount = (amount * (account.monthlyFee * 0.05)) / 100; // 5% discount
    const tax = (amount * 0.16) / 100; // 16% VAT for Kenya
    const total = amount - discount + tax;

    const newInvoice: MikrotikInvoice = {
      id: `INV-${Date.now()}`,
      invoiceNumber: `INV-${data.invoices.length + 1000}`,
      accountId,
      accountNumber: account.accountNumber,
      customerName: account.customerName,
      planId: account.planId,
      planName: account.planName,
      billingPeriod: billingPeriod || new Date().toISOString().substring(0, 7),
      amount,
      discount,
      tax,
      total,
      status: "issued",
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.invoices.push(newInvoice);

    // Update account outstanding balance
    const accountIndex = data.accounts.findIndex((a) => a.id === accountId);
    if (accountIndex !== -1) {
      data.accounts[accountIndex].outstandingBalance += total;
      data.accounts[accountIndex].lastBillingDate = new Date().toISOString();
      data.accounts[accountIndex].nextBillingDate = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString();
    }

    return res.json({
      success: true,
      message: "Invoice generated successfully",
      invoice: newInvoice,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate invoice",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get invoices for account
 */
export const getAccountInvoices: RequestHandler = (req, res) => {
  try {
    const { accountId } = req.params;
    const instanceId = req.query.instanceId as string | undefined;
    const data = getInstanceData(instanceId);

    const accountInvoices = data.invoices.filter((i) => i.accountId === accountId);

    return res.json(accountInvoices);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Record payment for invoice
 */
export const recordPayment: RequestHandler = (req, res) => {
  try {
    const { accountId, invoiceId, amount, paymentMethod, mpesaReceiptNumber, instanceId } =
      req.body;

    if (!accountId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "Validation error",
      });
    }

    const data = getInstanceData(instanceId);
    const account = data.accounts.find((a) => a.id === accountId);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
        error: "Not found",
      });
    }

    const newPayment: MikrotikPayment = {
      id: `PAY-${Date.now()}`,
      paymentId: `PAY-${data.payments.length + 1000}`,
      accountId,
      accountNumber: account.accountNumber,
      invoiceId,
      amount,
      paymentMethod,
      mpesaReceiptNumber: mpesaReceiptNumber || undefined,
      status: "completed",
      paymentDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.payments.push(newPayment);

    // Update account balance
    const accountIndex = data.accounts.findIndex((a) => a.id === accountId);
    if (accountIndex !== -1) {
      data.accounts[accountIndex].balance += amount;
      data.accounts[accountIndex].totalPaid += amount;
      data.accounts[accountIndex].outstandingBalance = Math.max(
        0,
        data.accounts[accountIndex].outstandingBalance - amount
      );
      data.accounts[accountIndex].updatedAt = new Date().toISOString();
    }

    // Update invoice status if fully paid
    if (invoiceId) {
      const invoiceIndex = data.invoices.findIndex((i) => i.id === invoiceId);
      if (invoiceIndex !== -1) {
        data.invoices[invoiceIndex].status = "paid";
        data.invoices[invoiceIndex].paidDate = new Date().toISOString();
        data.invoices[invoiceIndex].paymentMethod = paymentMethod;
        data.invoices[invoiceIndex].updatedAt = new Date().toISOString();
      }
    }

    return res.json({
      success: true,
      message: "Payment recorded successfully",
      payment: newPayment,
      updatedAccount: data.accounts[accountIndex],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to record payment",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get account payments
 */
export const getAccountPayments: RequestHandler = (req, res) => {
  try {
    const { accountId } = req.params;
    const instanceId = req.query.instanceId as string | undefined;
    const data = getInstanceData(instanceId);

    const accountPayments = data.payments.filter((p) => p.accountId === accountId);

    return res.json(accountPayments);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get account usage records
 */
export const getAccountUsage: RequestHandler = (req, res) => {
  try {
    const { accountId } = req.params;
    const instanceId = req.query.instanceId as string | undefined;
    const data = getInstanceData(instanceId);

    const accountUsage = data.usageRecords.filter((u) => u.accountId === accountId);

    return res.json(accountUsage);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch usage records",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Record usage data
 */
export const recordUsage: RequestHandler = (req, res) => {
  try {
    const { accountId, uploadMB, downloadMB, sessionCount, instanceId } = req.body;

    if (!accountId || uploadMB === undefined || downloadMB === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "Validation error",
      });
    }

    const data = getInstanceData(instanceId);
    const account = data.accounts.find((a) => a.id === accountId);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
        error: "Not found",
      });
    }

    const totalMB = uploadMB + downloadMB;

    const newUsage: MikrotikUsage = {
      id: `USAGE-${Date.now()}`,
      accountId,
      accountNumber: account.accountNumber,
      date: new Date().toISOString().substring(0, 10),
      uploadMB,
      downloadMB,
      totalMB,
      sessionCount: sessionCount || 1,
      activeTime: req.body.activeTime || 0,
      createdAt: new Date().toISOString(),
    };

    data.usageRecords.push(newUsage);

    return res.json({
      success: true,
      message: "Usage recorded successfully",
      usage: newUsage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to record usage",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get all invoices
 */
export const getAllInvoices: RequestHandler = (req, res) => {
  try {
    const instanceId = req.query.instanceId as string | undefined;
    const data = getInstanceData(instanceId);
    return res.json(data.invoices);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get dashboard statistics
 */
export const getMikrotikStats: RequestHandler = (req, res) => {
  try {
    const instanceId = req.query.instanceId as string | undefined;
    const data = getInstanceData(instanceId);

    const totalAccounts = data.accounts.length;
    const activeAccounts = data.accounts.filter((a) => a.status === "active").length;
    const totalRevenue = data.invoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidRevenue = data.payments.reduce((sum, pay) => sum + pay.amount, 0);
    const pendingPayments = data.invoices.filter((i) => i.status === "issued").length;
    const overdueBills = data.invoices.filter((i) => i.status === "overdue").length;

    return res.json({
      totalAccounts,
      activeAccounts,
      totalRevenue,
      paidRevenue,
      pendingPayments,
      overdueBills,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * RouterOS Configuration Storage
 */
let routerOSConfig: MikrotikConfig = {
  enabled: false,
  apiUrl: "",
  username: "",
  password: "",
  port: 8728,
  useSsl: false,
  interfaceName: "ether1",
  enableDataMonitoring: false,
  autoGenerateBills: false,
  billingCycleDay: 1,
  gracePeriodDays: 3,
  suspensionDelay: 7,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Get RouterOS configuration
 */
export const getRouterOSConfig: RequestHandler = (_req, res) => {
  try {
    const config = { ...routerOSConfig };
    // Don't expose password
    delete (config as any).password;
    return res.json(config);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch configuration",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Update RouterOS configuration
 */
export const updateRouterOSConfig: RequestHandler = (req, res) => {
  try {
    const { apiUrl, username, password, port, useSsl, interfaceName } =
      req.body;

    if (apiUrl && username && password) {
      routerOSConfig = {
        ...routerOSConfig,
        ...req.body,
        updatedAt: new Date().toISOString(),
      };

      return res.json({
        success: true,
        message: "RouterOS configuration updated successfully",
        config: {
          ...routerOSConfig,
          password: undefined,
        },
      });
    }

    return res.status(400).json({
      success: false,
      message: "Missing required fields",
      error: "apiUrl, username, and password are required",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update configuration",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Test RouterOS connection
 */
export const testRouterOSConnection: RequestHandler = async (req, res) => {
  try {
    const config = req.body as RouterOSCredentials;

    if (!config.apiUrl || !config.username || !config.password) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "apiUrl, username, and password are required",
      });
    }

    const client = createRouterOSClient(config);
    const result = await client.testConnection();

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to test connection",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get RouterOS device information
 */
export const getRouterOSDeviceInfo: RequestHandler = async (req, res) => {
  try {
    if (!routerOSConfig.enabled || !routerOSConfig.apiUrl) {
      return res.status(400).json({
        success: false,
        message: "RouterOS connection not configured",
        error: "Please configure RouterOS connection first",
      });
    }

    const client = createRouterOSClient({
      apiUrl: routerOSConfig.apiUrl,
      username: routerOSConfig.username,
      password: routerOSConfig.password,
      useSsl: routerOSConfig.useSsl,
      port: routerOSConfig.port,
    });

    const deviceInfo = await client.getDeviceInfo();

    return res.json({
      success: true,
      deviceInfo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch device information",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get RouterOS interface statistics
 */
export const getRouterOSInterfaceStats: RequestHandler = async (req, res) => {
  try {
    if (!routerOSConfig.enabled || !routerOSConfig.apiUrl) {
      return res.status(400).json({
        success: false,
        message: "RouterOS connection not configured",
        error: "Please configure RouterOS connection first",
      });
    }

    const { interfaceName } = req.query;

    const client = createRouterOSClient({
      apiUrl: routerOSConfig.apiUrl,
      username: routerOSConfig.username,
      password: routerOSConfig.password,
      useSsl: routerOSConfig.useSsl,
      port: routerOSConfig.port,
    });

    const stats = await client.getInterfaceStats(interfaceName as string);

    return res.json({
      success: true,
      interfaces: stats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch interface statistics",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get RouterOS PPPoE active connections
 */
export const getRouterOSPPPoEConnections: RequestHandler = async (req, res) => {
  try {
    if (!routerOSConfig.enabled || !routerOSConfig.apiUrl) {
      return res.json({
        connections: [],
        message: "RouterOS not configured. Configure it in Settings to see active connections.",
      });
    }

    const client = createRouterOSClient({
      apiUrl: routerOSConfig.apiUrl,
      username: routerOSConfig.username,
      password: routerOSConfig.password,
      useSsl: routerOSConfig.useSsl,
      port: routerOSConfig.port,
    });

    const connections = await client.getPPPoEConnections();

    return res.json({
      success: true,
      connections,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch PPPoE connections",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get RouterOS Hotspot active users
 */
export const getRouterOSHotspotUsers: RequestHandler = async (req, res) => {
  try {
    if (!routerOSConfig.enabled || !routerOSConfig.apiUrl) {
      return res.status(400).json({
        success: false,
        message: "RouterOS connection not configured",
        error: "Please configure RouterOS connection first",
      });
    }

    const client = createRouterOSClient({
      apiUrl: routerOSConfig.apiUrl,
      username: routerOSConfig.username,
      password: routerOSConfig.password,
      useSsl: routerOSConfig.useSsl,
      port: routerOSConfig.port,
    });

    const users = await client.getHotspotUsers();

    return res.json({
      success: true,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Hotspot users",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get RouterOS queue information
 */
export const getRouterOSQueues: RequestHandler = async (req, res) => {
  try {
    if (!routerOSConfig.enabled || !routerOSConfig.apiUrl) {
      return res.status(400).json({
        success: false,
        message: "RouterOS connection not configured",
        error: "Please configure RouterOS connection first",
      });
    }

    const client = createRouterOSClient({
      apiUrl: routerOSConfig.apiUrl,
      username: routerOSConfig.username,
      password: routerOSConfig.password,
      useSsl: routerOSConfig.useSsl,
      port: routerOSConfig.port,
    });

    const queues = await client.getQueues();

    return res.json({
      success: true,
      queues,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch queue information",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Start bandwidth monitoring for an account
 */
export const startBandwidthMonitoring: RequestHandler = (req, res) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Missing account ID",
        error: "accountId is required",
      });
    }

    const account = accounts.find((a) => a.id === accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
        error: "Invalid account ID",
      });
    }

    const monitor = getBandwidthMonitor();
    const quotaMB = account.dataQuota ? account.dataQuota * 1024 : undefined; // Convert GB to MB
    monitor.startMonitoring(accountId, quotaMB);

    return res.json({
      success: true,
      message: `Bandwidth monitoring started for account ${accountId}`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to start bandwidth monitoring",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Stop bandwidth monitoring for an account
 */
export const stopBandwidthMonitoring: RequestHandler = (req, res) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Missing account ID",
        error: "accountId is required",
      });
    }

    const monitor = getBandwidthMonitor();
    monitor.stopMonitoring(accountId);

    return res.json({
      success: true,
      message: `Bandwidth monitoring stopped for account ${accountId}`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to stop bandwidth monitoring",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get bandwidth usage history for an account
 */
export const getBandwidthHistory: RequestHandler = (req, res) => {
  try {
    const { accountId } = req.params;
    const { hours = 24 } = req.query;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Missing account ID",
        error: "accountId is required",
      });
    }

    const monitor = getBandwidthMonitor();
    const history = monitor.getUsageHistory(accountId, parseInt(hours as string));

    return res.json({
      success: true,
      history,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bandwidth history",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get peak usage time for an account
 */
export const getPeakUsageTime: RequestHandler = (req, res) => {
  try {
    const { accountId } = req.params;
    const { hours = 24 } = req.query;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Missing account ID",
        error: "accountId is required",
      });
    }

    const monitor = getBandwidthMonitor();
    const peakUsage = monitor.getPeakUsageTime(accountId, parseInt(hours as string));

    return res.json({
      success: true,
      peakUsage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch peak usage time",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get average bandwidth usage for an account
 */
export const getAverageUsage: RequestHandler = (req, res) => {
  try {
    const { accountId } = req.params;
    const { hours = 24 } = req.query;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Missing account ID",
        error: "accountId is required",
      });
    }

    const monitor = getBandwidthMonitor();
    const average = monitor.getAverageUsage(accountId, parseInt(hours as string));

    return res.json({
      success: true,
      average,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch average usage",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get quota alerts
 */
export const getQuotaAlerts: RequestHandler = (req, res) => {
  try {
    const monitor = getBandwidthMonitor();
    const alerts = monitor.getQuotaAlerts();

    return res.json({
      success: true,
      alerts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quota alerts",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get account-specific quota alerts
 */
export const getAccountQuotaAlerts: RequestHandler = (req, res) => {
  try {
    const { accountId } = req.params;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Missing account ID",
        error: "accountId is required",
      });
    }

    const monitor = getBandwidthMonitor();
    const alerts = monitor.getAccountAlerts(accountId);

    return res.json({
      success: true,
      alerts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch account alerts",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get bandwidth monitoring status
 */
export const getMonitoringStatus: RequestHandler = (req, res) => {
  try {
    const monitor = getBandwidthMonitor();
    const status = monitor.getMonitoringStatus();

    return res.json({
      success: true,
      status,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch monitoring status",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Schedule automatic billing for an account
 */
export const scheduleBilling: RequestHandler = (req, res) => {
  try {
    const { accountId, billingCycleDay = 1 } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Missing account ID",
        error: "accountId is required",
      });
    }

    const account = accounts.find((a) => a.id === accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
        error: "Invalid account ID",
      });
    }

    const billing = getBillingAutomation();
    billing.scheduleBilling(accountId, billingCycleDay);

    return res.json({
      success: true,
      message: `Automatic billing scheduled for account ${accountId}`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to schedule billing",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Cancel automatic billing for an account
 */
export const cancelBilling: RequestHandler = (req, res) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Missing account ID",
        error: "accountId is required",
      });
    }

    const billing = getBillingAutomation();
    billing.cancelBilling(accountId);

    return res.json({
      success: true,
      message: `Automatic billing cancelled for account ${accountId}`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to cancel billing",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get billing automation status
 */
export const getBillingStatus: RequestHandler = (req, res) => {
  try {
    const billing = getBillingAutomation();
    const status = billing.getAutomationStatus();

    return res.json({
      success: true,
      status,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch billing status",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get automation logs
 */
export const getAutomationLogs: RequestHandler = (req, res) => {
  try {
    const { accountId, limit = 100 } = req.query;

    const billing = getBillingAutomation();
    const logs = billing.getAutomationLogs(
      accountId as string | undefined,
      parseInt(limit as string)
    );

    return res.json({
      success: true,
      logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch automation logs",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Test billing automation (generates test invoice)
 */
export const testBillingAutomation: RequestHandler = async (req, res) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Missing account ID",
        error: "accountId is required",
      });
    }

    const account = accounts.find((a) => a.id === accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
        error: "Invalid account ID",
      });
    }

    const billing = getBillingAutomation();
    const result = await billing.testBillingAutomation(accountId);

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to test billing automation",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Process overdue invoices
 */
export const processOverdueInvoices: RequestHandler = async (req, res) => {
  try {
    const { overdueDays = 7 } = req.body;

    const billing = getBillingAutomation();
    const result = await billing.processOverdueInvoices(overdueDays);

    return res.json({
      success: true,
      result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to process overdue invoices",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Auto-apply credits to invoices
 */
export const autoApplyCredits: RequestHandler = async (req, res) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Missing account ID",
        error: "accountId is required",
      });
    }

    const account = accounts.find((a) => a.id === accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
        error: "Invalid account ID",
      });
    }

    const billing = getBillingAutomation();
    const result = await billing.autoApplyCredits(accountId);

    return res.json({
      success: true,
      result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to apply credits",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Send invoice notification
 */
export const sendInvoiceNotification: RequestHandler = async (req, res) => {
  try {
    const { accountId, invoiceId } = req.body;

    if (!accountId || !invoiceId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "accountId and invoiceId are required",
      });
    }

    const account = accounts.find((a) => a.id === accountId);
    const invoice = invoices.find((i) => i.id === invoiceId);

    if (!account || !invoice) {
      return res.status(404).json({
        success: false,
        message: "Account or invoice not found",
        error: "Invalid IDs",
      });
    }

    const notificationService = getNotificationService();
    const success = await notificationService.sendInvoiceNotification(
      accountId,
      account.customerPhone,
      account.customerName,
      {
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.total,
        dueDate: new Date(invoice.dueDate).toLocaleDateString(),
        paybillNumber: "400123",
      }
    );

    return res.json({
      success,
      message: success
        ? "Invoice notification sent"
        : "Failed to send notification",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send invoice notification",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Send payment reminder notification
 */
export const sendPaymentReminderNotification: RequestHandler = async (req, res) => {
  try {
    const { accountId, invoiceId } = req.body;

    if (!accountId || !invoiceId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "accountId and invoiceId are required",
      });
    }

    const account = accounts.find((a) => a.id === accountId);
    const invoice = invoices.find((i) => i.id === invoiceId);

    if (!account || !invoice) {
      return res.status(404).json({
        success: false,
        message: "Account or invoice not found",
        error: "Invalid IDs",
      });
    }

    const notificationService = getNotificationService();
    const success = await notificationService.sendPaymentReminderNotification(
      accountId,
      account.customerPhone,
      account.customerName,
      {
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.total,
        dueDate: new Date(invoice.dueDate).toLocaleDateString(),
        paybillNumber: "400123",
      }
    );

    return res.json({
      success,
      message: success
        ? "Payment reminder sent"
        : "Failed to send reminder",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send payment reminder",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Send overdue invoice notification
 */
export const sendOverdueNotification: RequestHandler = async (req, res) => {
  try {
    const { accountId, invoiceId } = req.body;

    if (!accountId || !invoiceId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "accountId and invoiceId are required",
      });
    }

    const account = accounts.find((a) => a.id === accountId);
    const invoice = invoices.find((i) => i.id === invoiceId);

    if (!account || !invoice) {
      return res.status(404).json({
        success: false,
        message: "Account or invoice not found",
        error: "Invalid IDs",
      });
    }

    const daysOverdue = Math.floor(
      (Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const notificationService = getNotificationService();
    const success = await notificationService.sendOverdueNotification(
      accountId,
      account.customerPhone,
      account.customerName,
      {
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.total,
        overdueDays: Math.max(0, daysOverdue),
      }
    );

    return res.json({
      success,
      message: success
        ? "Overdue notification sent"
        : "Failed to send notification",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send overdue notification",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Send payment received notification
 */
export const sendPaymentReceivedNotification: RequestHandler = async (req, res) => {
  try {
    const { accountId, paymentId } = req.body;

    if (!accountId || !paymentId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "accountId and paymentId are required",
      });
    }

    const account = accounts.find((a) => a.id === accountId);
    const payment = payments.find((p) => p.id === paymentId);

    if (!account || !payment) {
      return res.status(404).json({
        success: false,
        message: "Account or payment not found",
        error: "Invalid IDs",
      });
    }

    const notificationService = getNotificationService();
    const success = await notificationService.sendPaymentReceivedNotification(
      accountId,
      account.customerPhone,
      account.customerName,
      {
        amount: payment.amount,
        paymentDate: new Date(payment.paymentDate).toLocaleDateString(),
        invoiceNumber: payment.invoiceId || "Multiple invoices",
        transactionRef: payment.mpesaReceiptNumber || payment.bankReference || payment.id,
      }
    );

    return res.json({
      success,
      message: success
        ? "Payment received notification sent"
        : "Failed to send notification",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send payment received notification",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Send quota alert notification
 */
export const sendQuotaAlertNotification: RequestHandler = async (req, res) => {
  try {
    const { accountId, percentageUsed, usedData, totalQuota } = req.body;

    if (!accountId || percentageUsed === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "accountId and percentageUsed are required",
      });
    }

    const account = accounts.find((a) => a.id === accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
        error: "Invalid account ID",
      });
    }

    const notificationService = getNotificationService();
    const success = await notificationService.sendQuotaAlertNotification(
      accountId,
      account.customerPhone,
      account.customerName,
      {
        percentageUsed: Math.round(percentageUsed),
        usedData: usedData || 0,
        totalQuota: totalQuota || account.dataQuota || 0,
      }
    );

    return res.json({
      success,
      message: success
        ? "Quota alert sent"
        : "Failed to send alert",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send quota alert",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get notification logs
 */
export const getNotificationLogs: RequestHandler = (req, res) => {
  try {
    const { accountId, limit = 100 } = req.query;

    const notificationService = getNotificationService();
    const logs = notificationService.getNotificationLogs(
      accountId as string | undefined,
      parseInt(limit as string)
    );

    return res.json({
      success: true,
      logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notification logs",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get notification templates
 */
export const getNotificationTemplates: RequestHandler = (req, res) => {
  try {
    const notificationService = getNotificationService();
    const templates = notificationService.getTemplates();

    return res.json({
      success: true,
      templates,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notification templates",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get notification statistics
 */
export const getNotificationStats: RequestHandler = (req, res) => {
  try {
    const notificationService = getNotificationService();
    const stats = notificationService.getNotificationStats();

    return res.json({
      success: true,
      stats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notification statistics",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get dashboard summary analytics
 */
export const getDashboardAnalytics: RequestHandler = (req, res) => {
  try {
    const analytics = getAnalyticsService();
    const summary = analytics.getDashboardSummary(
      accounts.length,
      invoices.length,
      payments.length
    );

    return res.json({
      success: true,
      summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard analytics",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get revenue analytics
 */
export const getRevenueAnalytics: RequestHandler = (req, res) => {
  try {
    const { startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate = new Date() } =
      req.query;

    const analytics = getAnalyticsService();
    const revenue = analytics.getRevenueAnalytics(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    return res.json({
      success: true,
      revenue,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch revenue analytics",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get monthly revenue trend
 */
export const getMonthlyRevenueTrend: RequestHandler = (req, res) => {
  try {
    const { months = 12 } = req.query;

    const analytics = getAnalyticsService();
    const trend = analytics.getMonthlyRevenueTrend(parseInt(months as string));

    return res.json({
      success: true,
      trend,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly revenue trend",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get account growth trend
 */
export const getAccountGrowthTrend: RequestHandler = (req, res) => {
  try {
    const { months = 12 } = req.query;

    const analytics = getAnalyticsService();
    const trend = analytics.getAccountGrowthTrend(parseInt(months as string));

    return res.json({
      success: true,
      trend,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch account growth trend",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get payment method distribution
 */
export const getPaymentMethodDistribution: RequestHandler = (req, res) => {
  try {
    const analytics = getAnalyticsService();
    const distribution = analytics.getPaymentMethodDistribution();

    return res.json({
      success: true,
      distribution,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment method distribution",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get service plan distribution
 */
export const getServicePlanDistribution: RequestHandler = (req, res) => {
  try {
    const analytics = getAnalyticsService();
    const distribution = analytics.getServicePlanDistribution();

    return res.json({
      success: true,
      distribution,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch service plan distribution",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get top customers by revenue
 */
export const getTopCustomers: RequestHandler = (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const analytics = getAnalyticsService();
    const topCustomers = analytics.getTopCustomersByRevenue(parseInt(limit as string));

    return res.json({
      success: true,
      topCustomers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch top customers",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Generate monthly billing report
 */
export const generateMonthlyBillingReport: RequestHandler = (req, res) => {
  try {
    const { month, year } = req.body;

    if (month === undefined || year === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "month and year are required",
      });
    }

    const analytics = getAnalyticsService();
    const report = analytics.generateMonthlyBillingReport(month, year);

    return res.json({
      success: true,
      report,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate monthly billing report",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get RADIUS configuration
 */
export const getRADIUSConfig: RequestHandler = (req, res) => {
  try {
    const instanceId = req.query.instanceId as string | undefined;
    const data = getInstanceData(instanceId);

    const config = data.radiusConfig || {
      enabled: false,
      host: "",
      port: 1812,
      sharedSecret: "",
      syncOnCreate: true,
      syncOnUpdate: true,
      syncOnDelete: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Don't expose shared secret
    const safeConfig = { ...config };
    delete (safeConfig as any).sharedSecret;

    return res.json(safeConfig);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch RADIUS configuration",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Update RADIUS configuration
 */
export const updateRADIUSConfig: RequestHandler = (req, res) => {
  try {
    const { instanceId, host, port, sharedSecret, syncOnCreate, syncOnUpdate, syncOnDelete } = req.body;
    const data = getInstanceData(instanceId);

    if (!host || !port || !sharedSecret) {
      return res.status(400).json({
        success: false,
        message: "Host, port, and shared secret are required",
        error: "Validation error",
      });
    }

    data.radiusConfig = {
      enabled: true,
      host,
      port,
      sharedSecret,
      syncOnCreate: syncOnCreate !== false,
      syncOnUpdate: syncOnUpdate !== false,
      syncOnDelete: syncOnDelete !== false,
      createdAt: data.radiusConfig?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const safeConfig = { ...data.radiusConfig };
    delete (safeConfig as any).sharedSecret;

    return res.json({
      success: true,
      message: "RADIUS configuration updated successfully",
      config: safeConfig,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update RADIUS configuration",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Test RADIUS connection
 */
export const testRADIUSConnection: RequestHandler = async (req, res) => {
  try {
    const { instanceId, host, port, sharedSecret } = req.body;

    if (!host || !port || !sharedSecret) {
      return res.status(400).json({
        success: false,
        message: "Host, port, and shared secret are required",
        error: "Validation error",
      });
    }

    const radiusClient = getRADIUSClient({
      enabled: true,
      host,
      port,
      sharedSecret,
    });

    const result = await radiusClient.testConnection();

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to test RADIUS connection",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Sync account to RADIUS (creates both PPPoE and Hotspot users)
 */
export const syncAccountToRADIUS: RequestHandler = async (req, res) => {
  try {
    const { accountId, instanceId } = req.body;
    const data = getInstanceData(instanceId);

    if (!data.radiusConfig?.enabled) {
      return res.json({
        success: false,
        message: "RADIUS is not enabled",
        skipped: true,
      });
    }

    const account = data.accounts.find((a) => a.id === accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
        error: "Not found",
      });
    }

    const radiusClient = getRADIUSClient(data.radiusConfig);

    const users: RADIUSUser[] = [
      {
        username: account.pppoeUsername,
        password: account.pppoePassword,
        userType: "pppoe",
      },
      {
        username: account.hotspotUsername,
        password: account.hotspotPassword,
        userType: "hotspot",
      },
    ];

    const result = await radiusClient.createUsers(users);

    return res.json({
      success: result.success,
      message: result.message,
      error: result.error,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to sync account to RADIUS",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Remove account from RADIUS
 */
export const removeAccountFromRADIUS: RequestHandler = async (req, res) => {
  try {
    const { accountId, instanceId } = req.body;
    const data = getInstanceData(instanceId);

    if (!data.radiusConfig?.enabled) {
      return res.json({
        success: false,
        message: "RADIUS is not enabled",
        skipped: true,
      });
    }

    const account = data.accounts.find((a) => a.id === accountId);
    if (!account) {
      return res.json({
        success: true,
        message: "Account not found in local database (may already be deleted)",
        skipped: true,
      });
    }

    const radiusClient = getRADIUSClient(data.radiusConfig);

    const result1 = await radiusClient.deleteUser(account.pppoeUsername, "pppoe");
    const result2 = await radiusClient.deleteUser(account.hotspotUsername, "hotspot");

    return res.json({
      success: result1.success && result2.success,
      message: `Deleted PPPoE user: ${result1.message}, Hotspot user: ${result2.message}`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to remove account from RADIUS",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Suspend account in RADIUS
 */
export const suspendAccountInRADIUS: RequestHandler = async (req, res) => {
  try {
    const { accountId, instanceId } = req.body;
    const data = getInstanceData(instanceId);

    if (!data.radiusConfig?.enabled) {
      return res.json({
        success: false,
        message: "RADIUS is not enabled",
        skipped: true,
      });
    }

    const account = data.accounts.find((a) => a.id === accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
        error: "Not found",
      });
    }

    const radiusClient = getRADIUSClient(data.radiusConfig);

    const result1 = await radiusClient.disableUser(account.pppoeUsername);
    const result2 = await radiusClient.disableUser(account.hotspotUsername);

    return res.json({
      success: result1.success && result2.success,
      message: `Suspended PPPoE user: ${result1.message}, Hotspot user: ${result2.message}`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to suspend account in RADIUS",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Resume account in RADIUS
 */
export const resumeAccountInRADIUS: RequestHandler = async (req, res) => {
  try {
    const { accountId, instanceId } = req.body;
    const data = getInstanceData(instanceId);

    if (!data.radiusConfig?.enabled) {
      return res.json({
        success: false,
        message: "RADIUS is not enabled",
        skipped: true,
      });
    }

    const account = data.accounts.find((a) => a.id === accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
        error: "Not found",
      });
    }

    const radiusClient = getRADIUSClient(data.radiusConfig);

    const result1 = await radiusClient.enableUser(account.pppoeUsername);
    const result2 = await radiusClient.enableUser(account.hotspotUsername);

    return res.json({
      success: result1.success && result2.success,
      message: `Resumed PPPoE user: ${result1.message}, Hotspot user: ${result2.message}`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to resume account in RADIUS",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Check account expiration status
 */
export const checkAccountExpirationStatus: RequestHandler = (req, res) => {
  try {
    const instanceId = req.query.instanceId as string | undefined;
    const { gracePeriodDays = 0 } = req.body;
    const data = getInstanceData(instanceId);
    const expirationAutomation = getExpirationAutomation(instanceId);

    const checks = expirationAutomation.checkAccountExpirations(
      data.accounts,
      gracePeriodDays
    );

    return res.json({
      success: true,
      message: "Expiration status checked",
      checks,
      summary: {
        totalAccounts: checks.length,
        expiredAccounts: checks.filter((c) => c.isExpired).length,
        activeExpiredAccounts: checks.filter((c) => c.shouldBeSuspended).length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to check expiration status",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Process account expirations (auto-suspend expired accounts)
 */
export const processAccountExpirations: RequestHandler = async (req, res) => {
  try {
    const instanceId = req.query.instanceId as string | undefined;
    const { gracePeriodDays = 0, autoSuspend = true } = req.body;
    const data = getInstanceData(instanceId);
    const expirationAutomation = getExpirationAutomation(instanceId);

    let suspendCallback: ((accountId: string, account: MikrotikAccount) => Promise<boolean>) | undefined;

    if (autoSuspend && data.radiusConfig?.enabled) {
      suspendCallback = async (accountId: string, account: MikrotikAccount) => {
        try {
          const radiusClient = getRADIUSClient(data.radiusConfig!);
          const result1 = await radiusClient.disableUser(account.pppoeUsername);
          const result2 = await radiusClient.disableUser(account.hotspotUsername);

          // Also update account status
          const accountIndex = data.accounts.findIndex((a) => a.id === accountId);
          if (accountIndex !== -1) {
            data.accounts[accountIndex] = {
              ...data.accounts[accountIndex],
              status: "suspended",
              updatedAt: new Date().toISOString(),
            };
          }

          return result1.success && result2.success;
        } catch (error) {
          console.error("Failed to suspend account in RADIUS:", error);
          return false;
        }
      };
    }

    const result = await expirationAutomation.processExpirations(
      data.accounts,
      gracePeriodDays,
      suspendCallback
    );

    return res.json({
      success: true,
      message: "Account expirations processed",
      result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to process expirations",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Process account renewal
 */
export const processAccountRenewal: RequestHandler = async (req, res) => {
  try {
    const { accountId, newNextBillingDate, instanceId } = req.body;
    const data = getInstanceData(instanceId);
    const expirationAutomation = getExpirationAutomation(instanceId);

    const account = data.accounts.find((a) => a.id === accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
        error: "Not found",
      });
    }

    // Determine resume callback if RADIUS is enabled
    let resumeCallback: ((accountId: string, account: MikrotikAccount) => Promise<boolean>) | undefined;

    if (data.radiusConfig?.enabled) {
      resumeCallback = async (accountId: string, account: MikrotikAccount) => {
        try {
          const radiusClient = getRADIUSClient(data.radiusConfig!);
          const result1 = await radiusClient.enableUser(account.pppoeUsername);
          const result2 = await radiusClient.enableUser(account.hotspotUsername);

          // Also update account status
          const accountIndex = data.accounts.findIndex((a) => a.id === accountId);
          if (accountIndex !== -1) {
            data.accounts[accountIndex] = {
              ...data.accounts[accountIndex],
              status: "active",
              nextBillingDate: newNextBillingDate,
              updatedAt: new Date().toISOString(),
            };
          }

          return result1.success && result2.success;
        } catch (error) {
          console.error("Failed to resume account in RADIUS:", error);
          return false;
        }
      };
    } else {
      // Just update the account status if RADIUS is not enabled
      const accountIndex = data.accounts.findIndex((a) => a.id === accountId);
      if (accountIndex !== -1) {
        data.accounts[accountIndex] = {
          ...data.accounts[accountIndex],
          status: "active",
          nextBillingDate: newNextBillingDate,
          updatedAt: new Date().toISOString(),
        };
      }
    }

    const result = await expirationAutomation.processRenewal(
      accountId,
      account,
      newNextBillingDate,
      resumeCallback
    );

    const updatedAccount = data.accounts.find((a) => a.id === accountId);

    return res.json({
      success: result.success,
      message: result.message,
      result,
      account: updatedAccount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to process renewal",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get expiration automation logs
 */
export const getExpirationAutomationLogs: RequestHandler = (req, res) => {
  try {
    const instanceId = req.query.instanceId as string | undefined;
    const accountId = req.query.accountId as string | undefined;
    const limit = parseInt(req.query.limit as string) || 100;
    const expirationAutomation = getExpirationAutomation(instanceId);

    const logs = expirationAutomation.getAutomationLogs(accountId, limit);

    return res.json({
      success: true,
      message: "Expiration automation logs retrieved",
      logs,
      totalLogs: logs.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch expiration logs",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * Get expiration automation status
 */
export const getExpirationAutomationStatus: RequestHandler = (req, res) => {
  try {
    const instanceId = req.query.instanceId as string | undefined;
    const expirationAutomation = getExpirationAutomation(instanceId);

    const status = expirationAutomation.getAutomationStatus();

    return res.json({
      success: true,
      message: "Expiration automation status retrieved",
      status,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch expiration automation status",
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};
