import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
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
import { handleSendSms } from "./routes/sms";
import {
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
  createTicketReply,
  getTicketReplies,
  getTicketReplyById,
  deleteTicketReply,
} from "./routes/ticket-replies";
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  logTime,
  getTimeLogs,
  deleteTimeLog,
  getActivityLog,
  addComment,
  getComments,
  getSLAPolicies,
  getPerformanceMetrics,
  getTeamPerformanceReport,
} from "./routes/tickets-tasks";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "./routes/customers";
import {
  createPayment,
  getPayments,
  getPaymentById,
  getPaymentsByInvoice,
  getPaymentsByCustomer,
  updatePayment,
  deletePayment,
} from "./routes/payments";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from "./routes/employees";
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  createTeamGroup,
  getTeamGroups,
  getTeamGroupById,
  updateTeamGroup,
  deleteTeamGroup,
  addTeamMember,
  getTeamMembers,
  getEmployeeTeamMemberships,
} from "./routes/departments";
import {
  createPOSItem,
  getPOSItems,
  getPOSItemById,
  updatePOSItem,
  deletePOSItem,
  createPOSTransaction,
  getPOSTransactions,
  getPOSTransactionById,
} from "./routes/inventory";
import {
  createAttendanceRecord,
  getAttendanceRecords,
  getAttendanceRecordById,
  updateAttendanceRecord,
  deleteAttendanceRecord,
} from "./routes/attendance";
import settingsRouter from "./routes/settings";
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

  // Ticket Replies endpoints
  app.post("/api/ticket-replies", createTicketReply);
  app.get("/api/tickets/:ticketId/replies", getTicketReplies);
  app.get("/api/ticket-replies/:id", getTicketReplyById);
  app.delete("/api/ticket-replies/:id", deleteTicketReply);

  // Ticket Tasks endpoints
  app.post("/api/tickets/:ticketId/tasks", createTask);
  app.get("/api/tickets/:ticketId/tasks", getTasks);
  app.put("/api/tickets/tasks/:taskId", updateTask);
  app.delete("/api/tickets/tasks/:taskId", deleteTask);

  // Time Logging endpoints
  app.post("/api/tickets/time-logs", logTime);
  app.get("/api/tickets/:ticketId/time-logs", getTimeLogs);
  app.delete("/api/tickets/time-logs/:timeLogId", deleteTimeLog);

  // Comments endpoints
  app.post("/api/tickets/:ticketId/comments", addComment);
  app.get("/api/tickets/:ticketId/comments", getComments);

  // Activity Log endpoints
  app.get("/api/tickets/:ticketId/activity", getActivityLog);

  // SLA and Performance endpoints
  app.get("/api/sla/policies", getSLAPolicies);
  app.get("/api/performance/employee/:userId", getPerformanceMetrics);
  app.get("/api/performance/team", getTeamPerformanceReport);

  // Customers endpoints
  app.post("/api/customers", createCustomer);
  app.get("/api/customers", getCustomers);
  app.get("/api/customers/:id", getCustomerById);
  app.put("/api/customers/:id", updateCustomer);
  app.delete("/api/customers/:id", deleteCustomer);

  // Payments endpoints
  app.post("/api/payments", createPayment);
  app.get("/api/payments", getPayments);
  app.get("/api/payments/:id", getPaymentById);
  app.get("/api/payments/invoice/:invoiceId", getPaymentsByInvoice);
  app.get("/api/payments/customer/:customerId", getPaymentsByCustomer);
  app.put("/api/payments/:id", updatePayment);
  app.delete("/api/payments/:id", deletePayment);

  // Employees endpoints
  app.post("/api/employees", createEmployee);
  app.get("/api/employees", getEmployees);
  app.get("/api/employees/:id", getEmployeeById);
  app.put("/api/employees/:id", updateEmployee);
  app.delete("/api/employees/:id", deleteEmployee);

  // Departments endpoints
  app.post("/api/departments", createDepartment);
  app.get("/api/departments", getDepartments);
  app.get("/api/departments/:id", getDepartmentById);
  app.put("/api/departments/:id", updateDepartment);
  app.delete("/api/departments/:id", deleteDepartment);

  // Team Groups endpoints
  app.post("/api/team-groups", createTeamGroup);
  app.get("/api/team-groups", getTeamGroups);
  app.get("/api/team-groups/:id", getTeamGroupById);
  app.put("/api/team-groups/:id", updateTeamGroup);
  app.delete("/api/team-groups/:id", deleteTeamGroup);

  // Team Members endpoints
  app.get("/api/team-members", getTeamMembers);
  app.post("/api/team-members", addTeamMember);
  app.get("/api/team-members/employee/:employeeId", getEmployeeTeamMemberships);

  // Inventory endpoints
  app.post("/api/inventory/items", createPOSItem);
  app.get("/api/inventory/items", getPOSItems);
  app.get("/api/inventory/items/:id", getPOSItemById);
  app.put("/api/inventory/items/:id", updatePOSItem);
  app.delete("/api/inventory/items/:id", deletePOSItem);
  app.post("/api/inventory/transactions", createPOSTransaction);
  app.get("/api/inventory/transactions", getPOSTransactions);
  app.get("/api/inventory/transactions/:id", getPOSTransactionById);

  // Attendance endpoints
  app.post("/api/attendance", createAttendanceRecord);
  app.get("/api/attendance", getAttendanceRecords);
  app.get("/api/attendance/:id", getAttendanceRecordById);
  app.put("/api/attendance/:id", updateAttendanceRecord);
  app.delete("/api/attendance/:id", deleteAttendanceRecord);

  // Settings endpoints
  app.use("/api/settings", settingsRouter);

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
