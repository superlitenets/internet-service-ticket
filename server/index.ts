import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { handleDemo } from "./routes/demo";
import {
  handleLogin,
  handleLogout,
  getCurrentUser,
  verifyTokenEndpoint,
  handleRegister,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from "./routes/auth";
import {
  createTestUser,
  getTestUsers,
  deleteTestUsers,
  checkDatabaseConnection,
} from "./routes/test";
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
import { handleSendWhatsApp, testWhatsAppConnection } from "./routes/whatsapp";
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
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  convertLeadToTicket,
} from "./routes/leads";
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  getTicketsByCustomer,
  assignTicket,
  getTicketStats,
} from "./routes/tickets";
import {
  getChartOfAccounts,
  createChartOfAccount,
  updateChartOfAccount,
  getJournalEntries,
  createJournalEntry,
  reverseJournalEntry,
  getExpenseCategories,
  createExpenseCategory,
  getExpenses,
  createExpense,
  updateExpense,
  getPOSItems,
  createPOSItem,
  createPOSTransaction,
  getPOSTransactions,
  getAccountingSummary,
  getTrialBalance,
} from "./routes/accounting";

export function createServer() {
  const app = express();

  // Serve static files from dist/spa in production
  const distPath = path.join(process.cwd(), "dist/spa");
  app.use(express.static(distPath));

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

  // Authentication endpoints
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/logout", handleLogout);
  app.post("/api/auth/register", handleRegister);
  app.get("/api/auth/verify", verifyTokenEndpoint);
  app.get("/api/auth/me", getCurrentUser);

  // User management endpoints
  app.get("/api/auth/users", getAllUsers);
  app.post("/api/auth/users", createUser);
  app.put("/api/auth/users/:id", updateUser);
  app.delete("/api/auth/users/:id", deleteUser);

  // Database test endpoints (for development/debugging)
  app.get("/api/test/health", checkDatabaseConnection);
  app.post("/api/test/users", createTestUser);
  app.get("/api/test/users", getTestUsers);
  app.delete("/api/test/users", deleteTestUsers);

  // MPESA Payment endpoints
  app.post("/api/mpesa/c2b", handleMpesaC2B);
  app.post("/api/mpesa/b2b", handleMpesaB2B);
  app.post("/api/mpesa/stk-push", handleMpesaStkPush);
  app.get("/api/mpesa/transactions", getMpesaTransactions);
  app.get("/api/mpesa/transactions/:transactionId", getMpesaTransaction);
  app.post("/api/mpesa/callback", handleMpesaCallback);
  app.post("/api/mpesa/validation", handleMpesaValidation);

  // Sales Leads endpoints
  app.post("/api/leads", createLead);
  app.get("/api/leads", getLeads);
  app.get("/api/leads/:id", getLeadById);
  app.put("/api/leads/:id", updateLead);
  app.delete("/api/leads/:id", deleteLead);
  app.post("/api/leads/:id/convert-to-ticket", convertLeadToTicket);

  // Support Tickets endpoints
  app.post("/api/tickets", createTicket);
  app.get("/api/tickets", getTickets);
  app.get("/api/tickets/stats", getTicketStats);
  app.get("/api/tickets/customer/:customerId", getTicketsByCustomer);
  app.get("/api/tickets/:id", getTicketById);
  app.put("/api/tickets/:id", updateTicket);
  app.delete("/api/tickets/:id", deleteTicket);
  app.post("/api/tickets/:id/assign", assignTicket);

  // Accounting Routes
  // Chart of Accounts
  app.get("/api/accounting/accounts", getChartOfAccounts);
  app.post("/api/accounting/accounts", createChartOfAccount);
  app.put("/api/accounting/accounts/:id", updateChartOfAccount);

  // General Ledger / Journal Entries
  app.get("/api/accounting/ledger", getJournalEntries);
  app.post("/api/accounting/ledger", createJournalEntry);
  app.post("/api/accounting/ledger/:id/reverse", reverseJournalEntry);

  // Expense Management
  app.get("/api/accounting/expense-categories", getExpenseCategories);
  app.post("/api/accounting/expense-categories", createExpenseCategory);
  app.get("/api/accounting/expenses", getExpenses);
  app.post("/api/accounting/expenses", createExpense);
  app.put("/api/accounting/expenses/:id", updateExpense);

  // POS System
  app.get("/api/pos/items", getPOSItems);
  app.post("/api/pos/items", createPOSItem);
  app.post("/api/pos/transactions", createPOSTransaction);
  app.get("/api/pos/transactions", getPOSTransactions);

  // Financial Reports
  app.get("/api/accounting/summary", getAccountingSummary);
  app.get("/api/accounting/trial-balance", getTrialBalance);

  // SPA catch-all route - serve index.html for all non-API routes
  // This must be after all API routes
  app.use((req, res, next) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(process.cwd(), "dist/spa/index.html"));
    } else {
      next();
    }
  });

  return app;
}
