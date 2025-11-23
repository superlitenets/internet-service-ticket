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

  return app;
}
