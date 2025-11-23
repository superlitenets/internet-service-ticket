import { RequestHandler } from "express";
import {
  MikrotikAccount,
  MikrotikPlan,
  MikrotikInvoice,
  MikrotikPayment,
  MikrotikUsage,
  MikrotikConfig,
} from "@shared/api";
import {
  createRouterOSClient,
  RouterOSCredentials,
  RouterOSInterfaceStats,
} from "../lib/mikrotik-routeros";

// In-memory storage (for demo purposes)
let accounts: MikrotikAccount[] = [];
let plans: MikrotikPlan[] = [];
let invoices: MikrotikInvoice[] = [];
let payments: MikrotikPayment[] = [];
let usageRecords: MikrotikUsage[] = [];

// Initialize default plans
function initializeDefaultPlans() {
  if (plans.length === 0) {
    plans = [
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
export const getMikrotikAccounts: RequestHandler = (_req, res) => {
  try {
    return res.json(accounts);
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
export const createMikrotikAccount: RequestHandler = (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      accountType,
      planId,
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

    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
        error: "Invalid plan",
      });
    }

    const newAccount: MikrotikAccount = {
      id: `ACC-${Date.now()}`,
      accountNumber: `ACC-${accounts.length + 1000}`,
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
      pppoeUsername: `user_${accounts.length + 1}`,
      pppoePassword: `pass_${Math.random().toString(36).substring(7)}`,
      hotspotUsername: `hotspot_${accounts.length + 1}`,
      hotspotPassword: `hpass_${Math.random().toString(36).substring(7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    accounts.push(newAccount);

    return res.json({
      success: true,
      message: "Account created successfully",
      account: newAccount,
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

    const account = accounts.find((a) => a.id === accountId);

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
export const updateMikrotikAccount: RequestHandler = (req, res) => {
  try {
    const { accountId } = req.params;
    const updates = req.body;

    const accountIndex = accounts.findIndex((a) => a.id === accountId);

    if (accountIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
        error: "Not found",
      });
    }

    accounts[accountIndex] = {
      ...accounts[accountIndex],
      ...updates,
      id: accounts[accountIndex].id,
      accountNumber: accounts[accountIndex].accountNumber,
      createdAt: accounts[accountIndex].createdAt,
      updatedAt: new Date().toISOString(),
    };

    return res.json({
      success: true,
      message: "Account updated successfully",
      account: accounts[accountIndex],
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
export const deleteMikrotikAccount: RequestHandler = (req, res) => {
  try {
    const { accountId } = req.params;

    const accountIndex = accounts.findIndex((a) => a.id === accountId);

    if (accountIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
        error: "Not found",
      });
    }

    const deleted = accounts.splice(accountIndex, 1)[0];

    return res.json({
      success: true,
      message: "Account deleted successfully",
      account: deleted,
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
 * Get all billing plans
 */
export const getMikrotikPlans: RequestHandler = (_req, res) => {
  try {
    initializeDefaultPlans();
    return res.json(plans);
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
    const { planName, planType, monthlyFee, description } = req.body;

    if (!planName || !planType || monthlyFee === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "Validation error",
      });
    }

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

    plans.push(newPlan);

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
    const { accountId, billingPeriod } = req.body;

    const account = accounts.find((a) => a.id === accountId);

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
      invoiceNumber: `INV-${invoices.length + 1000}`,
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

    invoices.push(newInvoice);

    // Update account outstanding balance
    const accountIndex = accounts.findIndex((a) => a.id === accountId);
    if (accountIndex !== -1) {
      accounts[accountIndex].outstandingBalance += total;
      accounts[accountIndex].lastBillingDate = new Date().toISOString();
      accounts[accountIndex].nextBillingDate = new Date(
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

    const accountInvoices = invoices.filter((i) => i.accountId === accountId);

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
    const { accountId, invoiceId, amount, paymentMethod, mpesaReceiptNumber } =
      req.body;

    if (!accountId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "Validation error",
      });
    }

    const account = accounts.find((a) => a.id === accountId);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
        error: "Not found",
      });
    }

    const newPayment: MikrotikPayment = {
      id: `PAY-${Date.now()}`,
      paymentId: `PAY-${payments.length + 1000}`,
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

    payments.push(newPayment);

    // Update account balance
    const accountIndex = accounts.findIndex((a) => a.id === accountId);
    if (accountIndex !== -1) {
      accounts[accountIndex].balance += amount;
      accounts[accountIndex].totalPaid += amount;
      accounts[accountIndex].outstandingBalance = Math.max(
        0,
        accounts[accountIndex].outstandingBalance - amount
      );
      accounts[accountIndex].updatedAt = new Date().toISOString();
    }

    // Update invoice status if fully paid
    if (invoiceId) {
      const invoiceIndex = invoices.findIndex((i) => i.id === invoiceId);
      if (invoiceIndex !== -1) {
        invoices[invoiceIndex].status = "paid";
        invoices[invoiceIndex].paidDate = new Date().toISOString();
        invoices[invoiceIndex].paymentMethod = paymentMethod;
        invoices[invoiceIndex].updatedAt = new Date().toISOString();
      }
    }

    return res.json({
      success: true,
      message: "Payment recorded successfully",
      payment: newPayment,
      updatedAccount: accounts[accountIndex],
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

    const accountPayments = payments.filter((p) => p.accountId === accountId);

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

    const accountUsage = usageRecords.filter((u) => u.accountId === accountId);

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
    const { accountId, uploadMB, downloadMB, sessionCount } = req.body;

    if (!accountId || uploadMB === undefined || downloadMB === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "Validation error",
      });
    }

    const account = accounts.find((a) => a.id === accountId);

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

    usageRecords.push(newUsage);

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
export const getAllInvoices: RequestHandler = (_req, res) => {
  try {
    return res.json(invoices);
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
export const getMikrotikStats: RequestHandler = (_req, res) => {
  try {
    const totalAccounts = accounts.length;
    const activeAccounts = accounts.filter((a) => a.status === "active").length;
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidRevenue = payments.reduce((sum, pay) => sum + pay.amount, 0);
    const pendingPayments = invoices.filter((i) => i.status === "issued").length;
    const overdueBills = invoices.filter((i) => i.status === "overdue").length;

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
