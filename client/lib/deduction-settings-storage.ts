/**
 * Late Attendance Deduction Settings Storage
 * Manages configuration for automatic salary deductions based on late attendance
 */

import type { LateDeductionSettings } from "@shared/api";

const DEDUCTION_SETTINGS_KEY = "late_deduction_settings";

const DEFAULT_SETTINGS: LateDeductionSettings = {
  enabled: false,
  lateThresholdMinutes: 15,
  deductionType: "fixed",
  fixedDeductionAmount: 50,
  percentageDeduction: 2,
  scaledDeductions: [
    { minutesRange: { min: 15, max: 30 }, deductionAmount: 30 },
    { minutesRange: { min: 31, max: 60 }, deductionAmount: 60 },
    { minutesRange: { min: 61, max: 120 }, deductionAmount: 100 },
    { minutesRange: { min: 121, max: 999 }, deductionAmount: 150 },
  ],
  applyAfterDays: 1,
  excludeWeekends: true,
  excludeEmployeeIds: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Get deduction settings from localStorage
 */
export function getDeductionSettings(): LateDeductionSettings {
  try {
    const stored = localStorage.getItem(DEDUCTION_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Failed to retrieve deduction settings:", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save deduction settings to localStorage
 */
export function saveDeductionSettings(settings: LateDeductionSettings): void {
  try {
    const updatedSettings = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(DEDUCTION_SETTINGS_KEY, JSON.stringify(updatedSettings));
  } catch (error) {
    console.error("Failed to save deduction settings:", error);
    throw new Error("Failed to save deduction settings");
  }
}

/**
 * Reset deduction settings to defaults
 */
export function resetDeductionSettings(): void {
  try {
    localStorage.setItem(DEDUCTION_SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  } catch (error) {
    console.error("Failed to reset deduction settings:", error);
    throw new Error("Failed to reset deduction settings");
  }
}

/**
 * Calculate deduction amount for late attendance
 */
export function calculateDeduction(
  lateMinutes: number,
  dailySalary: number,
  settings: LateDeductionSettings,
): number {
  if (!settings.enabled || lateMinutes < settings.lateThresholdMinutes) {
    return 0;
  }

  switch (settings.deductionType) {
    case "fixed":
      return settings.fixedDeductionAmount || 0;

    case "percentage":
      const percentage = settings.percentageDeduction || 0;
      return (dailySalary * percentage) / 100;

    case "scaled":
      if (!settings.scaledDeductions || settings.scaledDeductions.length === 0) {
        return 0;
      }

      for (const scaled of settings.scaledDeductions) {
        const { min, max } = scaled.minutesRange;
        if (lateMinutes >= min && lateMinutes <= max) {
          return scaled.deductionAmount;
        }
      }
      // If late minutes exceed all ranges, use the highest deduction
      return (
        settings.scaledDeductions[settings.scaledDeductions.length - 1]
          .deductionAmount || 0
      );

    default:
      return 0;
  }
}

/**
 * Check if employee is exempt from late deductions
 */
export function isEmployeeExempt(
  employeeId: string,
  settings: LateDeductionSettings,
): boolean {
  return (settings.excludeEmployeeIds || []).includes(employeeId);
}
