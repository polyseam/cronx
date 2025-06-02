/**
 * This module provides validation utilities for cron expressions and their components.
 *
 * It includes functions to validate individual parts of a cron expression (minute, hour, day, month, etc.)
 * as well as utility functions for validating ranges and complete cron expressions.
 *
 * The validation follows standard cron syntax rules with support for special characters and extensions.
 *
 * @module validators
 */

import {
  CronTabExpression,
  type CronTabExpressionString,
} from "./CronTabExpression.ts";

/**
 * Validates if a string represents a valid minute value in a cron expression.
 *
 * Valid minute values are:
 * - Numbers from 0-59
 * - Ranges (e.g., "1-30")
 * - Lists (e.g., "5,10,15")
 * - Step values (e.g., "*\/5", "0-30/5")
 * - Wildcard "*" (meaning "every minute")
 *
 * @param {string} value - The minute value to validate
 * @returns {boolean} True if the value is a valid minute expression, false otherwise
 *
 * @example
 * ```ts
 * validateMinute("30"); // true - specific minute
 * validateMinute("*\/15"); // true - every 15 minutes
 * validateMinute("0-30"); // true - range of minutes
 * validateMinute("5,10,15"); // true - specific minutes
 * validateMinute("60"); // false - out of range
 * ```
 */
export function validateMinute(value: string): boolean {
  return validateRange(value, 0, 59);
}

/**
 * Validates if a string represents a valid hour value in a cron expression.
 *
 * Valid hour values are:
 * - Numbers from 0-23
 * - Ranges (e.g., "9-17")
 * - Lists (e.g., "9,12,15")
 * - Step values (e.g., "*\/2", "8-16/2")
 * - Wildcard "*" (meaning "every hour")
 *
 * @param {string} value - The hour value to validate
 * @returns {boolean} True if the value is a valid hour expression, false otherwise
 *
 * @example
 * ```ts
 * validateHour("12"); // true - noon
 * validateHour("0"); // true - midnight
 * validateHour("*\/2"); // true - every 2 hours
 * validateHour("9-17"); // true - business hours
 * validateHour("24"); // false - out of range
 * ```
 */
export function validateHour(value: string): boolean {
  return validateRange(value, 0, 23);
}

/**
 * Validates if a string represents a valid day of month value in a cron expression.
 *
 * Valid day of month values are:
 * - Numbers from 1-31
 * - Ranges (e.g., "1-15")
 * - Lists (e.g., "1,15,30")
 * - Step values (e.g., "*\/5", "1-20/5")
 * - Wildcard "*" (meaning "every day")
 * - "?" (for "any day", used when day of week is specified)
 * - "L" (for "last day of month")
 * - "nW" (for "nearest weekday to n", e.g., "15W")
 * - "L-n" (for "nth day from the end of month", e.g., "L-3")
 *
 * @param {string} value - The day of month value to validate
 * @returns {boolean} True if the value is a valid day of month expression, false otherwise
 *
 * @example
 * ```ts
 * validateDayOfMonth("15"); // true - 15th day of month
 * validateDayOfMonth("L"); // true - last day of month
 * validateDayOfMonth("15W"); // true - weekday nearest to the 15th
 * validateDayOfMonth("L-3"); // true - 3rd to last day of month
 * validateDayOfMonth("?"); // true - any day (when day of week is specified)
 * validateDayOfMonth("32"); // false - out of range
 * ```
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
 *
 * Valid month values are:
 * - Numbers from 1-12
 * - Three-letter month names (JAN, FEB, MAR, etc.) - case insensitive
 * - Ranges (e.g., "1-6", "JAN-JUN")
 * - Lists (e.g., "1,4,7,10", "JAN,APR,JUL,OCT")
 * - Step values (e.g., "*\/3", "1-12/3")
 * - Wildcard "*" (meaning "every month")
 *
 * @param {string} value - The month value to validate
 * @returns {boolean} True if the value is a valid month expression, false otherwise
 *
 * @example
 * ```ts
 * validateMonth("1"); // true - January
 * validateMonth("JAN"); // true - January
 * validateMonth("jan"); // true - January (case insensitive)
 * validateMonth("*\/3"); // true - every 3 months
 * validateMonth("1-6"); // true - first half of year
 * validateMonth("JAN,APR,JUL,OCT"); // true - quarterly
 * validateMonth("13"); // false - out of range
 * validateMonth("JANUARY"); // false - must use 3-letter abbreviation
 * ```
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
 *
 * Valid day of week values are:
 * - Numbers from 0-6 (0 or 7 for Sunday)
 * - Three-letter day names (SUN, MON, TUE, etc.) - case insensitive
 * - Ranges (e.g., "1-5", "MON-FRI")
 * - Lists (e.g., "1,3,5", "MON,WED,FRI")
 * - Step values (e.g., "*\/2")
 * - Wildcard "*" (meaning "every day of week")
 * - "?" (for "any day of week", used when day of month is specified)
 * - "L" (for "last day of week" - Saturday)
 * - "nL" (for "last nth day of week", e.g., "5L" for "last Friday")
 * - "n#m" (for "nth m day of month", e.g., "2#1" for "first Monday")
 *
 * @param {string} value - The day of week value to validate
 * @returns {boolean} True if the value is a valid day of week expression, false otherwise
 *
 * @example
 * ```ts
 * validateDayOfWeek("1"); // true - Monday
 * validateDayOfWeek("MON"); // true - Monday
 * validateDayOfWeek("mon"); // true - Monday (case insensitive)
 * validateDayOfWeek("1-5"); // true - Monday through Friday
 * validateDayOfWeek("MON-FRI"); // true - Monday through Friday
 * validateDayOfWeek("?"); // true - any day (when day of month is specified)
 * validateDayOfWeek("5L"); // true - last Friday
 * validateDayOfWeek("2#3"); // true - third Tuesday
 * validateDayOfWeek("8"); // false - out of range
 * ```
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
 * Validates if a string represents a valid range of values for cron fields.
 *
 * This function is used internally by other validation functions to check if
 * a numeric value or range expression is valid within the specified min and max bounds.
 *
 * Supports:
 * - Single numbers (e.g., "5")
 * - Wildcards ("*")
 * - Ranges (e.g., "1-10")
 * - Step values (e.g., "*\/5", "1-10/2")
 * - Lists (e.g., "1,5,10")
 *
 * @param {string} value - The value to validate
 * @param {number} min - Minimum allowed value (inclusive)
 * @param {number} max - Maximum allowed value (inclusive)
 * @returns {boolean} True if the value is valid within the range, false otherwise
 *
 * @example
 * ```ts
 * validateRange("5", 0, 59); // true - single value in range
 * validateRange("*", 0, 59); // true - wildcard
 * validateRange("*\/15", 0, 59); // true - step value
 * validateRange("0-30", 0, 59); // true - range
 * validateRange("5,10,15", 0, 59); // true - list
 * validateRange("60", 0, 59); // false - out of range
 * validateRange("10-5", 0, 59); // false - invalid range (start > end)
 * ```
 */
export function validateRange(
  value: string,
  min: number,
  max: number,
): boolean {
  // Handle wildcards and steps
  if (value === "*") return true;

  // Handle step values (e.g., *\/5, 1-10/2)
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
/**
 * Validates a single part of a range expression.
 *
 * This internal helper function validates individual parts of a cron field,
 * handling ranges, lists, and single values.
 *
 * @param {string} value - The value to validate
 * @param {number} min - Minimum allowed value (inclusive)
 * @param {number} max - Maximum allowed value (inclusive)
 * @returns {boolean} True if the range part is valid, false otherwise
 *
 * @private
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
 *
 * A valid cron expression has exactly 5 space-separated fields in the following order:
 * 1. Minute (0-59)
 * 2. Hour (0-23)
 * 3. Day of month (1-31)
 * 4. Month (1-12 or JAN-DEC)
 * 5. Day of week (0-6 or SUN-SAT, where 0 or 7 is Sunday)
 *
 * Each field must follow the validation rules for its respective field type.
 *
 * @param {string} expression - The complete cron expression to validate
 * @returns {boolean} True if the expression is a valid cron expression, false otherwise
 *
 * @example
 * ```ts
 * validateCronTabExpressionString("0 0 * * *"); // true - run at midnight every day
 * validateCronTabExpressionString("*\/15 9-17 * * 1-5"); // true - every 15 min during business hours Mon-Fri
 * validateCronTabExpressionString("0 0 1,15 * ?"); // true - midnight on 1st and 15th of month
 * validateCronTabExpressionString("0 0"); // false - not enough fields
 * validateCronTabExpressionString("60 0 * * *"); // false - minute out of range
 * ```
 *
 * @typedef {string} CronTabExpressionString - Type guard to ensure the string is a valid cron expression
 */
export function validateCronTabExpressionString(
  expression: string,
): expression is CronTabExpressionString {
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

export default validateCronTabExpressionString;
