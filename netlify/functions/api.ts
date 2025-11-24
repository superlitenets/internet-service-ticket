import serverless from "serverless-http";
import express from "express";
import cors from "cors";
import {
  handleLogin,
  handleLogout,
  getCurrentUser,
  verifyToken,
  handleRegister,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../server/routes/auth";
import { handleSendSms } from "../../server/routes/sms";
import {
  getEmployees,
  createEmployee,
  getAttendance,
  getLeaveRequests,
  getPayroll,
  getPerformance,
  testZKtecoConnection,
  syncZKtecoAttendance,
  getZKtecoRealtime,
} from "../../server/routes/hrm";
import { handleSendWhatsApp, testWhatsAppConnection } from "../../server/routes/whatsapp";
import {
  handleSendWhatsAppUnified,
  handleInitWhatsAppWeb,
  handleGetQRCode,
  handleCheckWhatsAppStatus,
  handleLogoutWhatsAppWeb,
} from "../../server/routes/whatsapp-unified";
import {
  handleMpesaC2B,
  handleMpesaB2B,
  handleMpesaStkPush,
  getMpesaTransactions,
  getMpesaTransaction,
  handleMpesaCallback,
  handleMpesaValidation,
} from "../../server/routes/mpesa";
import {
  getMikrotikAccounts,
  createMikrotikAccount,
  getMikrotikAccount,
  updateMikrotikAccount,
  deleteMikrotikAccount,
  regenerateAccountCredentials,
  getMikrotikPlans,
  createMikrotikPlan,
  generateInvoice,
  getAccountInvoices,
  recordPayment,
  getAccountPayments,
  getAccountUsage,
  recordUsage,
  getAllInvoices,
  getMikrotikStats,
  getRouterOSConfig,
  updateRouterOSConfig,
  testRouterOSConnection,
  getRouterOSDeviceInfo,
  getRouterOSInterfaceStats,
  getRouterOSPPPoEConnections,
  getRouterOSHotspotUsers,
  getRouterOSQueues,
  startBandwidthMonitoring,
  stopBandwidthMonitoring,
  getBandwidthHistory,
  getPeakUsageTime,
  getAverageUsage,
  getQuotaAlerts,
  getAccountQuotaAlerts,
  getMonitoringStatus,
  scheduleBilling,
  cancelBilling,
  getBillingStatus,
  getAutomationLogs,
  testBillingAutomation,
  processOverdueInvoices,
  autoApplyCredits,
  sendInvoiceNotification,
  sendPaymentReminderNotification,
  sendOverdueNotification,
  sendPaymentReceivedNotification,
  sendQuotaAlertNotification,
  getNotificationLogs,
  getNotificationTemplates,
  getNotificationStats,
  getDashboardAnalytics,
  getRevenueAnalytics,
  getMonthlyRevenueTrend,
  getAccountGrowthTrend,
  getPaymentMethodDistribution,
  getServicePlanDistribution,
  getTopCustomers,
  generateMonthlyBillingReport,
  suspendAccountInRADIUS,
  resumeAccountInRADIUS,
  checkAccountExpirationStatus,
  processAccountExpirations,
  processAccountRenewal,
  getExpirationAutomationLogs,
  getExpirationAutomationStatus,
} from "../../server/routes/mikrotik";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Example API routes
app.get("/api/ping", (_req, res) => {
  const ping = process.env.PING_MESSAGE ?? "ping";
  res.json({ message: ping });
});

// SMS API endpoints
app.post("/api/sms/send", handleSendSms);

// HRM API endpoints
app.get("/api/hrm/employees", getEmployees);
app.post("/api/hrm/employees", createEmployee);
app.get("/api/hrm/attendance", getAttendance);
app.get("/api/hrm/leave", getLeaveRequests);
app.get("/api/hrm/payroll", getPayroll);
app.get("/api/hrm/performance", getPerformance);
app.post("/api/hrm/zkteco/test", testZKtecoConnection);
app.post("/api/hrm/zkteco/sync", syncZKtecoAttendance);
app.get("/api/hrm/zkteco/realtime/:deviceId", getZKtecoRealtime);

// WhatsApp API endpoints
app.post("/api/whatsapp/send", handleSendWhatsApp);
app.post("/api/whatsapp/test", testWhatsAppConnection);
app.post("/api/whatsapp/send-unified", handleSendWhatsAppUnified);
app.post("/api/whatsapp/web/init", handleInitWhatsAppWeb);
app.get("/api/whatsapp/web/qrcode", handleGetQRCode);
app.get("/api/whatsapp/web/status", handleCheckWhatsAppStatus);
app.post("/api/whatsapp/web/logout", handleLogoutWhatsAppWeb);

// Authentication endpoints
app.post("/api/auth/login", handleLogin);
app.post("/api/auth/logout", handleLogout);
app.post("/api/auth/register", handleRegister);
app.get("/api/auth/verify", verifyToken);
app.get("/api/auth/me", getCurrentUser);

// User management endpoints
app.get("/api/auth/users", getAllUsers);
app.post("/api/auth/users", createUser);
app.put("/api/auth/users/:id", updateUser);
app.delete("/api/auth/users/:id", deleteUser);

// MPESA Payment endpoints
app.post("/api/mpesa/c2b", handleMpesaC2B);
app.post("/api/mpesa/b2b", handleMpesaB2B);
app.post("/api/mpesa/stk-push", handleMpesaStkPush);
app.get("/api/mpesa/transactions", getMpesaTransactions);
app.get("/api/mpesa/transactions/:transactionId", getMpesaTransaction);
app.post("/api/mpesa/callback", handleMpesaCallback);
app.post("/api/mpesa/validation", handleMpesaValidation);

// Mikrotik ISP Billing endpoints
app.get("/api/mikrotik/accounts", getMikrotikAccounts);
app.post("/api/mikrotik/accounts", createMikrotikAccount);
app.get("/api/mikrotik/accounts/:accountId", getMikrotikAccount);
app.put("/api/mikrotik/accounts/:accountId", updateMikrotikAccount);
app.delete("/api/mikrotik/accounts/:accountId", deleteMikrotikAccount);
app.post("/api/mikrotik/accounts/:accountId/regenerate-credentials", regenerateAccountCredentials);

app.get("/api/mikrotik/plans", getMikrotikPlans);
app.post("/api/mikrotik/plans", createMikrotikPlan);

app.post("/api/mikrotik/invoices", generateInvoice);
app.get("/api/mikrotik/invoices", getAllInvoices);
app.get("/api/mikrotik/accounts/:accountId/invoices", getAccountInvoices);

app.post("/api/mikrotik/payments", recordPayment);
app.get("/api/mikrotik/accounts/:accountId/payments", getAccountPayments);

app.get("/api/mikrotik/accounts/:accountId/usage", getAccountUsage);
app.post("/api/mikrotik/usage", recordUsage);

app.get("/api/mikrotik/stats", getMikrotikStats);

app.get("/api/mikrotik/routeros/config", getRouterOSConfig);
app.put("/api/mikrotik/routeros/config", updateRouterOSConfig);
app.post("/api/mikrotik/routeros/test", testRouterOSConnection);
app.get("/api/mikrotik/routeros/device-info", getRouterOSDeviceInfo);
app.get("/api/mikrotik/routeros/interfaces", getRouterOSInterfaceStats);
app.get("/api/mikrotik/routeros/pppoe", getRouterOSPPPoEConnections);
app.get("/api/mikrotik/routeros/hotspot", getRouterOSHotspotUsers);
app.get("/api/mikrotik/routeros/queues", getRouterOSQueues);

app.post("/api/mikrotik/bandwidth/start", startBandwidthMonitoring);
app.post("/api/mikrotik/bandwidth/stop", stopBandwidthMonitoring);
app.get("/api/mikrotik/bandwidth/history/:accountId", getBandwidthHistory);
app.get("/api/mikrotik/bandwidth/peak/:accountId", getPeakUsageTime);
app.get("/api/mikrotik/bandwidth/average/:accountId", getAverageUsage);
app.get("/api/mikrotik/bandwidth/alerts", getQuotaAlerts);
app.get("/api/mikrotik/bandwidth/alerts/:accountId", getAccountQuotaAlerts);
app.get("/api/mikrotik/bandwidth/status", getMonitoringStatus);

app.post("/api/mikrotik/billing/schedule", scheduleBilling);
app.post("/api/mikrotik/billing/cancel", cancelBilling);
app.post("/api/mikrotik/billing/test", testBillingAutomation);
app.post("/api/mikrotik/billing/process-overdue", processOverdueInvoices);
app.post("/api/mikrotik/billing/apply-credits", autoApplyCredits);
app.get("/api/mikrotik/billing/status", getBillingStatus);
app.get("/api/mikrotik/billing/logs", getAutomationLogs);

app.post("/api/mikrotik/radius/suspend", suspendAccountInRADIUS);
app.post("/api/mikrotik/radius/resume", resumeAccountInRADIUS);

app.post("/api/mikrotik/expiration/check-status", checkAccountExpirationStatus);
app.post("/api/mikrotik/expiration/process", processAccountExpirations);
app.post("/api/mikrotik/expiration/renew", processAccountRenewal);
app.get("/api/mikrotik/expiration/logs", getExpirationAutomationLogs);
app.get("/api/mikrotik/expiration/status", getExpirationAutomationStatus);

app.post("/api/mikrotik/notifications/send-invoice", sendInvoiceNotification);
app.post("/api/mikrotik/notifications/send-reminder", sendPaymentReminderNotification);
app.post("/api/mikrotik/notifications/send-overdue", sendOverdueNotification);
app.post("/api/mikrotik/notifications/send-payment-received", sendPaymentReceivedNotification);
app.post("/api/mikrotik/notifications/send-quota-alert", sendQuotaAlertNotification);
app.get("/api/mikrotik/notifications/logs", getNotificationLogs);
app.get("/api/mikrotik/notifications/templates", getNotificationTemplates);
app.get("/api/mikrotik/notifications/stats", getNotificationStats);

app.get("/api/mikrotik/analytics/dashboard", getDashboardAnalytics);
app.get("/api/mikrotik/analytics/revenue", getRevenueAnalytics);
app.get("/api/mikrotik/analytics/revenue-trend", getMonthlyRevenueTrend);
app.get("/api/mikrotik/analytics/account-trend", getAccountGrowthTrend);
app.get("/api/mikrotik/analytics/payment-methods", getPaymentMethodDistribution);
app.get("/api/mikrotik/analytics/service-plans", getServicePlanDistribution);
app.get("/api/mikrotik/analytics/top-customers", getTopCustomers);
app.post("/api/mikrotik/analytics/monthly-report", generateMonthlyBillingReport);

export const handler = serverless(app);
