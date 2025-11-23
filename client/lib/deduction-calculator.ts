/**
 * Deduction Calculator Service
 * Calculates deductions based on attendance records
 */

import type { AttendanceRecord, LateDeductionSettings, PayrollRecord } from "@shared/api";
import {
  calculateDeduction,
  isEmployeeExempt,
} from "./deduction-settings-storage";

export interface DeductionDetail {
  employeeId: string;
  employeeName: string;
  lateDays: number;
  totalLateMinutes: number;
  averageLateMinutes: number;
  deductionAmount: number;
  breakdown: {
    date: string;
    lateMinutes: number;
    dayDeduction: number;
  }[];
}

/**
 * Parse time string (e.g., "08:30 AM") to minutes since midnight
 */
function timeToMinutes(timeStr: string): number {
  try {
    // Extract time from various formats
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return 0;

    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const meridiem = match[3]?.toUpperCase();

    // Handle 12-hour format
    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  } catch {
    return 0;
  }
}

/**
 * Calculate deductions for a specific month
 */
export function calculateMonthlyDeductions(
  attendanceRecords: AttendanceRecord[],
  payrollRecords: PayrollRecord[],
  settings: LateDeductionSettings,
  officialCheckInTime: string = "08:30 AM",
): Map<string, DeductionDetail> {
  const deductions = new Map<string, DeductionDetail>();

  if (!settings.enabled) {
    return deductions;
  }

  const officialTimeMinutes = timeToMinutes(officialCheckInTime);

  // Group attendance by employee
  const attendanceByEmployee = new Map<string, AttendanceRecord[]>();
  attendanceRecords.forEach((record) => {
    if (!attendanceByEmployee.has(record.employeeId)) {
      attendanceByEmployee.set(record.employeeId, []);
    }
    attendanceByEmployee.get(record.employeeId)!.push(record);
  });

  // Calculate deductions for each employee
  attendanceByEmployee.forEach((records, employeeId) => {
    if (isEmployeeExempt(employeeId, settings)) {
      return; // Skip exempt employees
    }

    const employeeName = records[0]?.employeeName || "Unknown";
    let lateDays = 0;
    let totalLateMinutes = 0;
    const breakdown: { date: string; lateMinutes: number; dayDeduction: number }[] = [];

    records.forEach((record) => {
      if (record.status === "late" || record.status === "present") {
        const checkInMinutes = timeToMinutes(record.checkInTime);
        const lateMinutes = Math.max(0, checkInMinutes - officialTimeMinutes);

        if (lateMinutes >= settings.lateThresholdMinutes) {
          lateDays++;
          totalLateMinutes += lateMinutes;

          // Get daily salary from payroll
          const payroll = payrollRecords.find(
            (p) => p.employeeId === employeeId
          );
          const dailySalary = payroll
            ? payroll.baseSalary / 30 // Assuming 30-day month
            : 0;

          const dayDeduction = calculateDeduction(
            lateMinutes,
            dailySalary,
            settings,
          );

          breakdown.push({
            date: record.date,
            lateMinutes,
            dayDeduction,
          });
        }
      }
    });

    // Only apply deduction if minimum late days threshold is met
    if (
      lateDays >= (settings.applyAfterDays || 1) &&
      totalLateMinutes > 0
    ) {
      const totalDeduction = breakdown.reduce(
        (sum, item) => sum + item.dayDeduction,
        0,
      );
      const avgLateMinutes =
        lateDays > 0 ? Math.round(totalLateMinutes / lateDays) : 0;

      deductions.set(employeeId, {
        employeeId,
        employeeName,
        lateDays,
        totalLateMinutes,
        averageLateMinutes: avgLateMinutes,
        deductionAmount: totalDeduction,
        breakdown,
      });
    }
  });

  return deductions;
}

/**
 * Calculate deduction for a single employee on a specific date
 */
export function calculateDayDeduction(
  checkInTime: string,
  dailySalary: number,
  settings: LateDeductionSettings,
  officialCheckInTime: string = "08:30 AM",
): { lateMinutes: number; deduction: number } {
  const officialTimeMinutes = timeToMinutes(officialCheckInTime);
  const checkInMinutes = timeToMinutes(checkInTime);
  const lateMinutes = Math.max(0, checkInMinutes - officialTimeMinutes);

  const deduction = calculateDeduction(lateMinutes, dailySalary, settings);

  return {
    lateMinutes,
    deduction,
  };
}

/**
 * Get deduction summary
 */
export function getDeductionSummary(deductions: Map<string, DeductionDetail>) {
  let totalEmployeesWithDeductions = 0;
  let totalDeductionAmount = 0;
  let totalLateDays = 0;

  deductions.forEach((detail) => {
    totalEmployeesWithDeductions++;
    totalDeductionAmount += detail.deductionAmount;
    totalLateDays += detail.lateDays;
  });

  return {
    totalEmployeesWithDeductions,
    totalDeductionAmount,
    totalLateDays,
    averageDeductionPerEmployee:
      totalEmployeesWithDeductions > 0
        ? totalDeductionAmount / totalEmployeesWithDeductions
        : 0,
  };
}
