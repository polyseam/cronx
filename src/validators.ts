/**
 * This module provides validation utilities for cron expressions and their components.
 *
 * @module
 */

import {
  CronTabExpression,
  type CronTabExpressionString,
} from "./CronTabExpression.ts";

/**
 * Validates if a string represents a valid minute value in a cron expression.
 * @param value - The value to validate
 * @returns boolean indicating if the value is valid
 */
export function validateMinute(value: string): boolean {
  return validateRange(value, 0, 59);
}

/**
 * Validates if a string represents a valid hour value in a cron expression.
 * @param value - The value to validate
 * @returns boolean indicating if the value is valid
 */
export function validateHour(value: string): boolean {
  return validateRange(value, 0, 23);
}

/**
 * Validates if a string represents a valid day of month value in a cron expression.
 * @param value - The value to validate
 * @returns boolean indicating if the value is valid
 */
export function validateDayOfMonth(value: string): boolean {
  if (value === "?") return true; // ? is allowed in some cron implementations
  if (value === "L") return true; // Last day of month
  if (value.endsWith("W")) {
    return validateRange(value.slice(0, -1), 1, 31); // Weekday
  }
  if (value.includes("L-")) {
    return validateRange(value.split("-")[1], 1, 31); // Days before last day
  }
  return validateRange(value, 1, 31);
}

/**
 * Validates if a string represents a valid month value in a cron expression.
 * @param value - The value to validate
 * @returns boolean indicating if the value is valid
 */
export function validateMonth(value: string): boolean {
  if (value === "*") return true;

  // Support month names (case insensitive)
  const MONTH_NAMES = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ] as const;

  if (MONTH_NAMES.some((m) => m === value.toUpperCase())) {
    return true;
  }

  return validateRange(value, 1, 12);
}

/**
 * Validates if a string represents a valid day of week value in a cron expression.
 * @param value - The value to validate
 * @returns boolean indicating if the value is valid
 */
export function validateDayOfWeek(value: string): boolean {
  if (value === "?") return true; // ? is allowed in some cron implementations
  if (value === "L") return true; // Last day of week

  if (value.endsWith("L")) {
    return validateRange(
      value.slice(0, -1),
      0, // 0 for Sunday in zero-based systems
      7, // 7 for Sunday in one-based systems
    );
  }

  if (value.includes("#")) {
    const [day, week] = value.split("#");
    return (
      validateRange(
        day,
        0, // 0 for Sunday in zero-based systems
        6, // 6 for Saturday in zero-based systems
      ) && validateRange(week, 1, 5)
    );
  }

  // Support day names (case insensitive)
  const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
  if (DAY_NAMES.some((d) => d === value.toUpperCase())) {
    return true;
  }

  return validateRange(
    value,
    0, // 0 for Sunday in zero-based systems
    6, // 6 for Saturday in zero-based systems
  );
}

/**
 * Validates if a string represents a valid range of values.
 * @param value - The value to validate
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @param checkDayNames - Whether to check for day names (default: true)
 * @returns boolean indicating if the value is within the valid range
 */
export function validateRange(
  value: string,
  min: number,
  max: number,
): boolean {
  // Handle wildcards and steps
  if (value === "*") return true;

  // Handle step values (e.g., */5, 1-10/2)
  if (value.includes("/")) {
    const [range, step] = value.split("/");
    const stepNum = parseInt(step, 10);
    if (isNaN(stepNum) || stepNum < 1) {
      return false;
    }
    if (range === "*") return true;
    return validateRangePart(range, min, max);
  }

  return validateRangePart(value, min, max);
}

/**
 * Validates a single part of a range expression.
 * @param value - The value to validate
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @param checkDayNames - Whether to check for day names
 * @returns boolean indicating if the value is valid
 */
function validateRangePart(
  value: string,
  min: number,
  max: number,
): boolean {
  // Handle ranges (e.g., 1-5, 10-15)
  if (value.includes("-")) {
    const [start, end] = value.split("-").map(Number);
    return (
      !isNaN(start) &&
      !isNaN(end) &&
      start >= min &&
      end <= max &&
      start <= end
    );
  }

  // Handle comma-separated values (e.g., 1,2,3 or MON,WED,FRI)
  if (value.includes(",")) {
    return value.split(",").every((v) => {
      // Check if it's a named day/month
      if (isNaN(Number(v))) {
        const vD = v
          .toUpperCase() as (typeof CronTabExpression.DAY_NAMES)[number];
        const vM = v
          .toUpperCase() as (typeof CronTabExpression.MONTH_NAMES)[number];
        return (
          CronTabExpression.DAY_NAMES.includes(vD) ||
          CronTabExpression.MONTH_NAMES.includes(vM)
        );
      }
      // Check numeric range
      const num = parseInt(v, 10);
      return !isNaN(num) && num >= min && num <= max;
    });
  }

  // Handle single value
  const num = parseInt(value, 10);
  return !isNaN(num) && num >= min && num <= max;
}

/**
 * Validates a complete cron expression string.
 * @param expression - The cron expression to validate
 * @returns boolean indicating if the expression is valid
 */
export function validateCronTabExpressionString(
  expression: string,
): expression is CronTabExpressionString<false> {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  try {
    return (
      validateMinute(parts[0]) &&
      validateHour(parts[1]) &&
      validateDayOfMonth(parts[2]) &&
      validateMonth(parts[3]) &&
      validateDayOfWeek(parts[4])
    );
  } catch {
    return false;
  }
}
