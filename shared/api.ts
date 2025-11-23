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
