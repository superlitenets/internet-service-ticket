import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleSendSms } from "./routes/sms";
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
} from "./routes/hrm";
import {
  handleSendWhatsApp,
  testWhatsAppConnection,
} from "./routes/whatsapp";
import {
  handleSendWhatsAppUnified,
  handleInitWhatsAppWeb,
  handleGetQRCode,
  handleCheckWhatsAppStatus,
  handleLogoutWhatsAppWeb,
} from "./routes/whatsapp-unified";
import {
  handleMpesaC2B,
  handleMpesaB2B,
  handleMpesaStkPush,
  getMpesaTransactions,
  getMpesaTransaction,
  handleMpesaCallback,
  handleMpesaValidation,
} from "./routes/mpesa";
import {
  getMikrotikAccounts,
  createMikrotikAccount,
  getMikrotikAccount,
  updateMikrotikAccount,
  deleteMikrotikAccount,
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
} from "./routes/mikrotik";

export function createServer() {
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

  app.get("/api/demo", handleDemo);

  // SMS API endpoints
  app.post("/api/sms/send", handleSendSms);

  // HRM API endpoints
  // Employees
  app.get("/api/hrm/employees", getEmployees);
  app.post("/api/hrm/employees", createEmployee);

  // Attendance
  app.get("/api/hrm/attendance", getAttendance);

  // Leave
  app.get("/api/hrm/leave", getLeaveRequests);

  // Payroll
  app.get("/api/hrm/payroll", getPayroll);

  // Performance
  app.get("/api/hrm/performance", getPerformance);

  // ZKteco Integration
  app.post("/api/hrm/zkteco/test", testZKtecoConnection);
  app.post("/api/hrm/zkteco/sync", syncZKtecoAttendance);
  app.get("/api/hrm/zkteco/realtime/:deviceId", getZKtecoRealtime);

  // WhatsApp API endpoints
  app.post("/api/whatsapp/send", handleSendWhatsApp);
  app.post("/api/whatsapp/test", testWhatsAppConnection);

  // Unified WhatsApp endpoints (Business API + Web with failover)
  app.post("/api/whatsapp/send-unified", handleSendWhatsAppUnified);
  app.post("/api/whatsapp/web/init", handleInitWhatsAppWeb);
  app.get("/api/whatsapp/web/qrcode", handleGetQRCode);
  app.get("/api/whatsapp/web/status", handleCheckWhatsAppStatus);
  app.post("/api/whatsapp/web/logout", handleLogoutWhatsAppWeb);

  // MPESA Payment endpoints
  app.post("/api/mpesa/c2b", handleMpesaC2B);
  app.post("/api/mpesa/b2b", handleMpesaB2B);
  app.post("/api/mpesa/stk-push", handleMpesaStkPush);
  app.get("/api/mpesa/transactions", getMpesaTransactions);
  app.get("/api/mpesa/transactions/:transactionId", getMpesaTransaction);
  app.post("/api/mpesa/callback", handleMpesaCallback);
  app.post("/api/mpesa/validation", handleMpesaValidation);

  // Mikrotik ISP Billing endpoints
  // Accounts
  app.get("/api/mikrotik/accounts", getMikrotikAccounts);
  app.post("/api/mikrotik/accounts", createMikrotikAccount);
  app.get("/api/mikrotik/accounts/:accountId", getMikrotikAccount);
  app.put("/api/mikrotik/accounts/:accountId", updateMikrotikAccount);
  app.delete("/api/mikrotik/accounts/:accountId", deleteMikrotikAccount);

  // Plans
  app.get("/api/mikrotik/plans", getMikrotikPlans);
  app.post("/api/mikrotik/plans", createMikrotikPlan);

  // Invoicing
  app.post("/api/mikrotik/invoices", generateInvoice);
  app.get("/api/mikrotik/invoices", getAllInvoices);
  app.get("/api/mikrotik/accounts/:accountId/invoices", getAccountInvoices);

  // Payments
  app.post("/api/mikrotik/payments", recordPayment);
  app.get("/api/mikrotik/accounts/:accountId/payments", getAccountPayments);

  // Usage
  app.get("/api/mikrotik/accounts/:accountId/usage", getAccountUsage);
  app.post("/api/mikrotik/usage", recordUsage);

  // Statistics
  app.get("/api/mikrotik/stats", getMikrotikStats);

  // RouterOS Integration
  app.get("/api/mikrotik/routeros/config", getRouterOSConfig);
  app.put("/api/mikrotik/routeros/config", updateRouterOSConfig);
  app.post("/api/mikrotik/routeros/test", testRouterOSConnection);
  app.get("/api/mikrotik/routeros/device-info", getRouterOSDeviceInfo);
  app.get("/api/mikrotik/routeros/interfaces", getRouterOSInterfaceStats);
  app.get("/api/mikrotik/routeros/pppoe", getRouterOSPPPoEConnections);
  app.get("/api/mikrotik/routeros/hotspot", getRouterOSHotspotUsers);
  app.get("/api/mikrotik/routeros/queues", getRouterOSQueues);

  // Bandwidth Monitoring
  app.post("/api/mikrotik/bandwidth/start", startBandwidthMonitoring);
  app.post("/api/mikrotik/bandwidth/stop", stopBandwidthMonitoring);
  app.get("/api/mikrotik/bandwidth/history/:accountId", getBandwidthHistory);
  app.get("/api/mikrotik/bandwidth/peak/:accountId", getPeakUsageTime);
  app.get("/api/mikrotik/bandwidth/average/:accountId", getAverageUsage);
  app.get("/api/mikrotik/bandwidth/alerts", getQuotaAlerts);
  app.get("/api/mikrotik/bandwidth/alerts/:accountId", getAccountQuotaAlerts);
  app.get("/api/mikrotik/bandwidth/status", getMonitoringStatus);

  return app;
}
