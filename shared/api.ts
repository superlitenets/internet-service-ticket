/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * SMS Send Request
 */
export interface SendSmsRequest {
  to: string | string[];
  message: string;
  provider?: string;
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  apiKey?: string;
  partnerId?: string;
  shortcode?: string;
}

/**
 * SMS Send Response
 */
export interface SendSmsResponse {
  success: boolean;
  message: string;
  messageIds?: string[];
  recipients?: number;
  timestamp: string;
  error?: string;
}

/**
 * HRM Employee
 */
export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  employeeId: string;
  dateOfJoining: string;
  salary: number;
  biometricId?: string;
  status: "active" | "inactive" | "on-leave";
  createdAt: string;
  updatedAt: string;
}

/**
 * Attendance Record
 */
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  checkInTime: string;
  checkOutTime?: string;
  date: string;
  status: "present" | "absent" | "late" | "half-day";
  biometricSource?: "manual" | "zkteco40" | "mobile";
  duration?: number; // in minutes
  createdAt: string;
  updatedAt: string;
}

/**
 * Leave Request
 */
export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: "annual" | "sick" | "maternity" | "unpaid" | "compassionate";
  startDate: string;
  endDate: string;
  duration: number; // in days
  reason: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvalDate?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payroll Record
 */
export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  status: "draft" | "approved" | "paid" | "pending";
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Performance Review
 */
export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  reviewPeriod: string;
  reviewer: string;
  rating: number; // 1-5
  attendance: number; // percentage
  productivity: number; // percentage
  teamwork: number; // percentage
  communication: number; // percentage
  comments: string;
  strengths: string[];
  improvements: string[];
  status: "draft" | "submitted" | "completed";
  createdAt: string;
  updatedAt: string;
}

/**
 * ZKteco Device Configuration
 */
export interface ZKtecoDeviceConfig {
  id: string;
  ipAddress: string;
  port: number;
  username: string;
  password: string;
  deviceName: string;
  location: string;
  enabled: boolean;
  lastSync: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Late Attendance Deduction Settings
 */
export interface LateDeductionSettings {
  enabled: boolean;
  lateThresholdMinutes: number; // Minutes after official time
  deductionType: "fixed" | "percentage" | "scaled";
  fixedDeductionAmount?: number; // For fixed deductions
  percentageDeduction?: number; // Percentage of daily salary
  scaledDeductions?: {
    // For scaled deductions
    minutesRange: { min: number; max: number };
    deductionAmount: number;
  }[];
  applyAfterDays?: number; // Apply deduction after N late days in a month
  excludeWeekends?: boolean;
  excludeEmployeeIds?: string[]; // Exempt specific employees
  createdAt: string;
  updatedAt: string;
}

/**
 * Deduction Record
 */
export interface DeductionRecord {
  id: string;
  payrollId: string;
  employeeId: string;
  employeeName: string;
  deductionType: string;
  reason: string;
  lateDays: number;
  lateMinutes: number;
  deductionAmount: number;
  approvalStatus: "pending" | "approved" | "rejected";
  approvedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * WhatsApp Send Request
 */
export interface SendWhatsAppRequest {
  to: string | string[];
  message: string;
  provider?: string;
  phoneNumberId?: string;
  accessToken?: string;
  templateName?: string;
  templateParams?: Record<string, string>;
}

/**
 * WhatsApp Send Response
 */
export interface SendWhatsAppResponse {
  success: boolean;
  message: string;
  messageIds?: string[];
  recipients?: number;
  timestamp: string;
  error?: string;
}

/**
 * WhatsApp Configuration
 */
export interface WhatsAppConfig {
  enabled: boolean;
  mode: "business" | "web" | "both";
  businessApi: {
    phoneNumberId: string;
    accessToken: string;
    businessAccountId: string;
    webhookToken?: string;
  };
  web: {
    authenticated: boolean;
    sessionId?: string;
    phoneNumber?: string;
  };
  failoverEnabled: boolean; // Use Web if Business API fails
  createdAt: string;
  updatedAt: string;
}

/**
 * MPESA Configuration
 */
export interface MpesaConfig {
  enabled: boolean;
  consumerKey: string;
  consumerSecret: string;
  businessShortCode: string;
  passkey: string;
  callbackUrl?: string;
  validationUrl?: string;
  confirmationUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * MPESA C2B Request
 */
export interface MpesaC2BRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDescription: string;
}

/**
 * MPESA B2B Request
 */
export interface MpesaB2BRequest {
  receiverShortCode: string;
  amount: number;
  commandId: string;
  accountReference: string;
  transactionDescription: string;
}

/**
 * MPESA STK Push Request
 */
export interface MpesaStkPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDescription: string;
  callbackUrl?: string;
}

/**
 * MPESA Response
 */
export interface MpesaResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  checkoutRequestId?: string;
  timestamp: string;
  error?: string;
}

/**
 * MPESA Transaction Record
 */
export interface MpesaTransaction {
  id: string;
  transactionId: string;
  type: "C2B" | "B2B" | "STK_PUSH";
  phoneNumber: string;
  amount: number;
  accountReference: string;
  description: string;
  status: "pending" | "completed" | "failed";
  mpesaReceiptNumber?: string;
  resultCode?: number;
  resultDescription?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mikrotik ISP Account
 */
export interface MikrotikAccount {
  id: string;
  accountNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  accountType: "residential" | "business" | "prepaid" | "postpaid";
  status: "active" | "inactive" | "suspended" | "closed" | "paused";
  planId: string;
  planName: string;
  monthlyFee: number;
  dataQuota?: number; // in GB
  pppoeUsername?: string;
  pppoePassword?: string;
  hotspotUsername?: string;
  hotspotPassword?: string;
  macAddress?: string;
  ipAddress?: string;
  registrationDate: string;
  lastBillingDate?: string;
  nextBillingDate?: string;
  balance: number;
  totalPaid: number;
  outstandingBalance: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mikrotik Billing Plan
 */
export interface MikrotikPlan {
  id: string;
  planName: string;
  description: string;
  planType: "flat-rate" | "quota-based" | "tiered";
  monthlyFee: number;
  dataQuota?: number; // in GB for quota-based plans
  speed?: {
    uploadMbps: number;
    downloadMbps: number;
  };
  fairUsagePolicy?: string;
  dataCapLimit?: number; // in GB, after which throttling applies
  setupFee: number;
  activationFee: number;
  discount?: number; // percentage
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mikrotik Invoice
 */
export interface MikrotikInvoice {
  id: string;
  invoiceNumber: string;
  accountId: string;
  accountNumber: string;
  customerName: string;
  planId: string;
  planName: string;
  billingPeriod: string; // "2024-01"
  amount: number;
  discount: number;
  tax: number;
  total: number;
  status: "draft" | "issued" | "paid" | "overdue" | "cancelled";
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  transactionReference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mikrotik Payment Record
 */
export interface MikrotikPayment {
  id: string;
  paymentId: string;
  accountId: string;
  accountNumber: string;
  invoiceId?: string;
  amount: number;
  paymentMethod: "mpesa" | "bank-transfer" | "cash" | "cheque";
  mpesaReceiptNumber?: string;
  bankReference?: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  paymentDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mikrotik Usage Record
 */
export interface MikrotikUsage {
  id: string;
  accountId: string;
  accountNumber: string;
  date: string;
  uploadMB: number;
  downloadMB: number;
  totalMB: number;
  sessionCount: number;
  activeTime: number; // in minutes
  createdAt: string;
}

/**
 * Mikrotik Configuration
 */
export interface MikrotikConfig {
  enabled: boolean;
  apiUrl: string;
  username: string;
  password: string;
  port: number;
  useSsl: boolean;
  interfaceName: string; // e.g., "ether1"
  enableDataMonitoring: boolean;
  autoGenerateBills: boolean;
  billingCycleDay: number; // 1-28
  gracePeriodDays: number; // days before suspension
  suspensionDelay: number; // days after suspension
  createdAt: string;
  updatedAt: string;
}

/**
 * RADIUS Configuration for authentication
 */
export interface RADIUSConfig {
  enabled: boolean;
  host: string;
  port: number;
  sharedSecret: string;
  syncOnCreate: boolean; // Sync to RADIUS when account is created
  syncOnUpdate: boolean; // Sync to RADIUS when account is updated
  syncOnDelete: boolean; // Sync to RADIUS when account is deleted
  createdAt: string;
  updatedAt: string;
}

/**
 * User Roles
 */
export type UserRole = "admin" | "manager" | "support" | "technician" | "customer";

/**
 * User Account
 */
export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: UserRole;
  password?: string; // Should not be sent to client
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Login Request
 */
export interface LoginRequest {
  identifier: string; // phone or email
  password: string;
}

/**
 * Login Response
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  error?: string;
}

/**
 * Auth Session
 */
export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number;
}
