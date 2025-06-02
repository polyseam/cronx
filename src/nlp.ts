import {
  CronTabExpression,
  type CronTabExpressionString,
} from "./CronTabExpression.ts";

/**
 * This module provides utilities for working with natural language schedules and cron expressions.
 *
 * getNaturalLanguageScheduleForCronTabExpression() converts a cron expression into a human-readable schedule description.
 * getCronTabExpressionForNaturalLanguageSchedule() converts a natural language schedule description into a cron expression.
 *
 * @module
 */

// Custom error types for better error handling
export class NLPError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NLPError";
  }
}

export class InvalidCronExpressionError extends NLPError {
  public readonly expression: string;

  constructor(expression: string, message: string) {
    super(`Invalid cron expression: ${expression}. ${message}`);
    this.name = "InvalidCronExpressionError";
    this.expression = expression;
  }
}

export class InvalidNaturalLanguageError extends NLPError {
  public readonly input: string;

  constructor(input: string, message: string) {
    super(`Invalid natural language input: "${input}". ${message}`);
    this.name = "InvalidNaturalLanguageError";
    this.input = input;
  }
}

/**
 * Represents a natural language schedule description
 *
 * @example "every day at 3pm"
 * @example "monthly on the 1st"
 */
export type NaturalLanguageSchedule = string;

// --------------------------------
// Time-related type definitions
// --------------------------------

/**
 * Time format options (12-hour or 24-hour)
 */
export type TimeFormat = "12h" | "24h";

/**
 * Period of day for 12-hour time format
 */
export type TimePeriod = "am" | "pm";

/**
 * Represents a specific time with hour, minute, and optional period
 */
export interface TimeObject {
  hour: number;
  minute: number;
  period?: TimePeriod;
}

// --------------------------------
// Pattern matching result types
// --------------------------------

/**
 * Base interface for all pattern matching results
 */
export interface PatternMatchResult {
  type: string;
  matched: boolean;
}

/**
 * Represents a basic pattern match like "every minute", "every hour", etc.
 */
export interface BasicPatternResult extends PatternMatchResult {
  type: "basic";
  expression: CronTabExpressionString | null;
}

/**
 * Represents an interval pattern match like "every X minutes"
 */
export interface IntervalPatternResult extends PatternMatchResult {
  type: "interval";
  expression: CronTabExpressionString | null;
}

/**
 * Represents a monthly pattern match
 */
export interface MonthlyPatternResult extends PatternMatchResult {
  type: "monthly";
  expression: CronTabExpressionString | null;
}

/**
 * Represents a yearly pattern match
 */
export interface YearlyPatternResult extends PatternMatchResult {
  type: "yearly";
  expression: CronTabExpressionString | null;
}

/**
 * Represents a time range pattern match
 */
export interface TimeRangeResult extends PatternMatchResult {
  type: "timeRange";
  minute: string;
  hour: string;
}

/**
 * Represents a day of week pattern match
 */
export interface DayOfWeekResult extends PatternMatchResult {
  type: "dayOfWeek";
  dayOfWeek: string;
}

/**
 * Represents a day of month pattern match
 */
export interface DayOfMonthResult extends PatternMatchResult {
  type: "dayOfMonth";
  dayOfMonth: string;
}

/**
 * Represents a specific month pattern match
 */
export interface MonthResult extends PatternMatchResult {
  type: "month";
  month: string;
  dayOfMonth?: string;
}

/**
 * Represents a time specification with "at" keyword
 */
export interface TimeWithAtResult extends PatternMatchResult {
  type: "timeWithAt";
  hour: string;
  minute: string;
}

/**
 * Union of all possible pattern match results
 */
export type MatchResult =
  | BasicPatternResult
  | IntervalPatternResult
  | MonthlyPatternResult
  | YearlyPatternResult
  | TimeRangeResult
  | DayOfWeekResult
  | DayOfMonthResult
  | MonthResult
  | TimeWithAtResult;

// --------------------------------
// Constants
// --------------------------------

/**
 * Maps day names to their numeric value in cron expressions
 */
const DAYS_OF_WEEK = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
} as const;

/**
 * Maps month names to their numeric value in cron expressions
 */
const MONTHS = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
} as const;

/**
 * Full month names for descriptive output
 */
const MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/**
 * Full day names for descriptive output
 */
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

// --------------------------------
// Time utilities
// --------------------------------

/**
 * Utility functions for working with time
 */
const TimeUtils = {
  /**
   * Converts 12-hour format to 24-hour format
   *
   * @param hour - Hour in 12-hour format
   * @param period - 'am' or 'pm'
   * @returns Hour in 24-hour format
   */
  convertTo24Hour(hour: number, period: string): number {
    const normalizedPeriod = period.toLowerCase();
    if (normalizedPeriod === "pm" && hour < 12) return hour + 12;
    if (normalizedPeriod === "am" && hour === 12) return 0;
    return hour;
  },

  /**
   * Formats hour and minute into a readable time string (e.g., "3:00 PM")
   *
   * @param hour - Hour in 24-hour format
   * @param minute - Minute
   * @returns Formatted time string
   */
  formatTime(hour: number, minute: number): string {
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour < 12 ? "AM" : "PM";
    return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
  },

  /**
   * Validates that hour and minute values are within valid ranges
   *
   * @param hour - Hour value to validate
   * @param minute - Minute value to validate
   * @throws {InvalidNaturalLanguageError} If hour or minute is invalid
   */
  validateTime(hour: number, minute: number): void {
    if (isNaN(hour) || hour < 0 || hour > 23) {
      throw new InvalidNaturalLanguageError(
        `${hour}:${minute}`,
        "Hour must be between 0 and 23",
      );
    }

    if (isNaN(minute) || minute < 0 || minute > 59) {
      throw new InvalidNaturalLanguageError(
        `${hour}:${minute}`,
        "Minute must be between 0 and 59",
      );
    }
  },
};

// --------------------------------
// Input validation and sanitization
// --------------------------------

/**
 * Utilities for input validation and sanitization
 */
const InputUtils = {
  /**
   * Normalizes input by converting to lowercase, trimming, and replacing multiple spaces with one
   *
   * @param input - The raw input string
   * @returns Normalized input string
   */
  normalizeInput(input: string): string {
    if (!input || typeof input !== "string") {
      throw new InvalidNaturalLanguageError(
        String(input),
        "Input must be a non-empty string",
      );
    }

    return input.toLowerCase().trim().replace(/\s+/g, " ");
  },

  /**
   * Validates a cron expression string
   *
   * @param expression - The cron expression to validate
   * @throws {InvalidCronExpressionError} If the expression is invalid
   */
  validateCronExpression(expression: string): void {
    if (
      !expression || typeof expression !== "string" || expression.trim() === ""
    ) {
      throw new InvalidCronExpressionError(
        String(expression),
        "Cron expression cannot be empty",
      );
    }

    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) {
      throw new InvalidCronExpressionError(
        expression,
        "Invalid format. Expected 5 fields (minute hour dayOfMonth month dayOfWeek)",
      );
    }
  },
};

// --------------------------------
// Pattern Matchers
// --------------------------------

/**
 * Class-based implementation of pattern matchers for improved organization and extensibility
 */
class PatternMatcher {
  /**
   * Matches basic time-based patterns (minute, hour, day, week, month, year)
   *
   * @param input - Normalized input string
   * @returns Pattern match result
   */
  static matchBasicPatterns(input: string): BasicPatternResult {
    let expression: CronTabExpressionString | null = null;

    if (
      input === "every minute" ||
      input === "every 1 minute" ||
      input === "minutely"
    ) {
      expression = "* * * * *" as CronTabExpressionString;
    } else if (
      input === "every hour" ||
      input === "every 1 hour" ||
      input === "hourly"
    ) {
      expression = "0 * * * *" as CronTabExpressionString;
    } else if (
      input === "every day" ||
      input === "every 1 day" ||
      input === "daily"
    ) {
      expression = "0 0 * * *" as CronTabExpressionString;
    } else if (
      input === "every week" ||
      input === "every 1 week" ||
      input === "weekly"
    ) {
      expression = "0 0 * * 0" as CronTabExpressionString;
    } else if (
      input === "every month" ||
      input === "every 1 month" ||
      input === "monthly"
    ) {
      expression = "0 0 1 * *" as CronTabExpressionString;
    } else if (
      input === "every year" ||
      input === "every 1 year" ||
      input === "yearly" ||
      input === "annually"
    ) {
      expression = "0 0 1 1 *" as CronTabExpressionString;
    }

    return {
      type: "basic",
      matched: expression !== null,
      expression,
    };
  }

  /**
   * Matches interval-based patterns (every X minutes/hours/days)
   *
   * @param input - Normalized input string
   * @returns Pattern match result
   */
  static matchIntervalPatterns(input: string): IntervalPatternResult {
    let expression: CronTabExpressionString | null = null;

    const simpleMinuteInterval = input.match(/every (\d+) minutes\s*$/);
    if (simpleMinuteInterval) {
      const interval = parseInt(simpleMinuteInterval[1], 10);
      if (isNaN(interval) || interval <= 0 || interval > 59) {
        throw new InvalidNaturalLanguageError(
          input,
          "Minute interval must be between 1 and 59",
        );
      }
      expression = `*/${interval} * * * *` as CronTabExpressionString;
    }

    const simpleHourInterval = input.match(/every (\d+) hours\s*$/);
    if (simpleHourInterval) {
      const interval = parseInt(simpleHourInterval[1], 10);
      if (isNaN(interval) || interval <= 0 || interval > 23) {
        throw new InvalidNaturalLanguageError(
          input,
          "Hour interval must be between 1 and 23",
        );
      }
      expression = `0 */${interval} * * *` as CronTabExpressionString;
    }

    const simpleDayInterval = input.match(/every (\d+) days\s*$/);
    if (simpleDayInterval) {
      const interval = parseInt(simpleDayInterval[1], 10);
      if (isNaN(interval) || interval <= 0 || interval > 31) {
        throw new InvalidNaturalLanguageError(
          input,
          "Day interval must be between 1 and 31",
        );
      }
      expression = `0 0 */${interval} * *` as CronTabExpressionString;
    }

    return {
      type: "interval",
      matched: expression !== null,
      expression,
    };
  }

  /**
   * Matches monthly patterns with optional time specifications
   *
   * @param input - Normalized input string
   * @returns Pattern match result
   */
  static matchMonthlyPatterns(input: string): MonthlyPatternResult {
    let expression: CronTabExpressionString | null = null;

    // monthly with minutes and hours
    if (/^(every month|monthly) at (\d{1,2}):(\d{2})(am|pm)$/i.test(input)) {
      const matches = input.match(
        /^(every month|monthly) at (\d{1,2}):(\d{2})(am|pm)$/i,
      );
      if (matches) {
        let hour = parseInt(matches[2], 10);
        const minute = parseInt(matches[3], 10);
        const period = matches[4].toLowerCase();

        hour = TimeUtils.convertTo24Hour(hour, period);
        TimeUtils.validateTime(hour, minute);

        expression = `${minute} ${hour} 1 * *` as CronTabExpressionString;
      }
    }

    // monthly with hours
    if (/^(every month|monthly) at (\d{1,2})(am|pm)$/i.test(input)) {
      const matches = input.match(
        /^(every month|monthly) at (\d{1,2})(am|pm)$/i,
      );
      if (matches) {
        let hour = parseInt(matches[2], 10);
        const period = matches[3].toLowerCase();

        hour = TimeUtils.convertTo24Hour(hour, period);
        TimeUtils.validateTime(hour, 0);

        expression = `0 ${hour} 1 * *` as CronTabExpressionString;
      }
    }

    return {
      type: "monthly",
      matched: expression !== null,
      expression,
    };
  }

  /**
   * Matches yearly patterns with optional time specifications
   *
   * @param input - Normalized input string
   * @returns Pattern match result
   */
  static matchYearlyPatterns(input: string): YearlyPatternResult {
    let expression: CronTabExpressionString | null = null;

    const yearlyMatch = input.match(
      /^(every year|yearly|annually) at (\d{1,2})(?::(\d{2}))?\s?(am|pm)?$/i,
    );

    if (yearlyMatch) {
      let hour = parseInt(yearlyMatch[2], 10);
      const minute = parseInt(yearlyMatch[3] ?? "0", 10);
      const period = yearlyMatch[4]?.toLowerCase();

      if (period) {
        hour = TimeUtils.convertTo24Hour(hour, period);
      }

      TimeUtils.validateTime(hour, minute);
      expression = `${minute} ${hour} 1 1 *` as CronTabExpressionString;
    }

    return {
      type: "yearly",
      matched: expression !== null,
      expression,
    };
  }

  /**
   * Matches time range patterns (from X to Y)
   *
   * @param input - Normalized input string
   * @returns Pattern match result
   */
  static matchTimeRangePatterns(input: string): TimeRangeResult {
    let matched = false;
    let minute = "0";
    let hour = "0";

    if (input.includes("from") && input.includes("to")) {
      const rangeMatch = input.match(
        /from (\d+)(?::(\d+))?\s*(am|pm) to (\d+)(?::(\d+))?\s*(am|pm)/i,
      );

      if (rangeMatch) {
        let startHour = parseInt(rangeMatch[1], 10);
        const startMinute = parseInt(rangeMatch[2] ?? "0", 10);
        let endHour = parseInt(rangeMatch[4], 10);
        const endMinute = parseInt(rangeMatch[5] ?? "0", 10);

        const startPeriod = rangeMatch[3].toLowerCase();
        const endPeriod = rangeMatch[6].toLowerCase();

        startHour = TimeUtils.convertTo24Hour(startHour, startPeriod);
        endHour = TimeUtils.convertTo24Hour(endHour, endPeriod);

        TimeUtils.validateTime(startHour, startMinute);
        TimeUtils.validateTime(endHour, endMinute);

        hour = `${startHour}-${endHour}`;

        // Check if there's an interval within the range
        if (input.includes("every 30 minutes")) {
          minute = "*/30";
        } else if (input.includes("every 15 minutes")) {
          minute = "*/15";
        } else if (input.includes("every hour")) {
          minute = "0";
        }

        matched = true;
      }
    }

    return {
      type: "timeRange",
      matched,
      minute,
      hour,
    };
  }

  /**
   * Matches day of week patterns (weekday, weekend, specific days)
   *
   * @param input - Normalized input string
   * @returns Pattern match result
   */
  static matchDayOfWeekPatterns(input: string): DayOfWeekResult {
    let matched = false;
    let dayOfWeek = "*";

    if (input.includes("weekday")) {
      dayOfWeek = "1-5";
      matched = true;
    } else if (input.includes("weekend")) {
      dayOfWeek = "0,6";
      matched = true;
    } else {
      const days: number[] = [];
      for (const [day, value] of Object.entries(DAYS_OF_WEEK)) {
        if (input.includes(day)) {
          days.push(value);
        }
      }

      if (days.length > 0) {
        dayOfWeek = days.sort().join(",");
        matched = true;
      }
    }

    return {
      type: "dayOfWeek",
      matched,
      dayOfWeek,
    };
  }

  /**
   * Matches day of month patterns (e.g., 5th of the month)
   *
   * @param input - Normalized input string
   * @returns Pattern match result
   */
  static matchDayOfMonthPatterns(input: string): DayOfMonthResult {
    let matched = false;
    let dayOfMonth = "*";

    if (input.includes("of the month")) {
      const dayMatch = input.match(/(\d+)(st|nd|rd|th) of the month/);
      if (dayMatch) {
        const day = parseInt(dayMatch[1], 10);
        if (day >= 1 && day <= 31) {
          dayOfMonth = day.toString();
          matched = true;
        } else {
          throw new InvalidNaturalLanguageError(
            input,
            "Day of month must be between 1 and 31",
          );
        }
      }
    }

    return {
      type: "dayOfMonth",
      matched,
      dayOfMonth,
    };
  }

  /**
   * Matches patterns with specific months and optionally days within those months
   *
   * @param input - Normalized input string
   * @returns Pattern match result
   */
  static matchSpecificMonthPatterns(input: string): MonthResult {
    let matched = false;
    let month = "*";
    let dayOfMonth: string | undefined = undefined;

    // Handle specific months (defaults to first day of the month at midnight)
    const monthMatch = input.match(
      /^every ((?:January|February|March|April|May|June|July|August|September|October|November|December)(?:,\s?(?:January|February|March|April|May|June|July|August|September|October|November|December))*)$/i,
    );

    if (monthMatch) {
      const months = monthMatch[1].split(/,\s?/).map(
        (m) => (MONTHS[m.toLowerCase() as keyof typeof MONTHS]),
      );
      month = months.join(",");
      dayOfMonth = "1";
      matched = true;
    } else {
      // Check for individual months mentioned in the input
      const monthList: number[] = [];

      for (const [monthName, value] of Object.entries(MONTHS)) {
        if (input.includes(monthName)) {
          monthList.push(value);

          // Check for specific day in month
          const dayMatch = new RegExp(`${monthName} (\\d+)(st|nd|rd|th)`).exec(
            input,
          );
          if (dayMatch) {
            const day = parseInt(dayMatch[1], 10);
            if (day >= 1 && day <= 31) {
              dayOfMonth = day.toString();
            } else {
              throw new InvalidNaturalLanguageError(
                input,
                "Day of month must be between 1 and 31",
              );
            }
          }
        }
      }

      if (monthList.length > 0) {
        month = monthList.length === 1
          ? monthList[0].toString()
          : monthList.sort().join(",");
        matched = true;
      }
    }

    return {
      type: "month",
      matched,
      month,
      dayOfMonth,
    };
  }

  /**
   * Matches time specifications with the "at" keyword
   *
   * @param input - Normalized input string
   * @returns Pattern match result
   */
  static matchTimeWithAtPatterns(input: string): TimeWithAtResult {
    let matched = false;
    let hour = "0";
    let minute = "0";

    if (input.includes("at")) {
      // Extract times (e.g., 2pm, 3:30am)
      const timeRegex = /(\d+)(?::(\d+))?\s*(am|pm)/gi;
      const times: { hour: number; minute: number }[] = [];
      let match;

      while ((match = timeRegex.exec(input)) !== null) {
        let h = parseInt(match[1], 10);
        const m = match[2] ? parseInt(match[2], 10) : 0;
        const period = match[3].toLowerCase();

        h = TimeUtils.convertTo24Hour(h, period);
        TimeUtils.validateTime(h, m);

        times.push({ hour: h, minute: m });
      }

      if (times.length === 1) {
        minute = times[0].minute.toString();
        hour = times[0].hour.toString();
        matched = true;
      } else if (times.length > 1) {
        // Only supporting same minute for multiple hours
        minute = times[0].minute.toString();
        hour = times.map((t) => t.hour).join(",");
        matched = true;
      }
    }

    return {
      type: "timeWithAt",
      matched,
      hour,
      minute,
    };
  }
}

/**
 * Converts a natural language schedule description into a cron tab expression.
 *
 * @param input - A natural language string describing a schedule (e.g., "every day at 3pm", "monthly on the 1st")
 * @returns A valid cron tab expression corresponding to the natural language description
 *
 * @example
 * ```ts
 * getCronTabExpressionForNaturalLanguageSchedule("every day at 3pm")
 * // Returns: "0 15 * * *"
 *
 * getCronTabExpressionForNaturalLanguageSchedule("monthly on the 1st")
 * // Returns: "0 0 1 * *"
 * ```
 *
 * @throws {InvalidNaturalLanguageError} If the natural language input cannot be parsed
 * @throws {InvalidCronExpressionError} If the resulting cron expression is invalid
 */
export function getCronTabExpressionForNaturalLanguageSchedule(
  input: NaturalLanguageSchedule,
): CronTabExpressionString {
  // Normalize and validate input
  const normalizedInput = InputUtils.normalizeInput(input);

  // Try matching basic patterns
  const basicPattern = PatternMatcher.matchBasicPatterns(normalizedInput);
  if (basicPattern.matched && basicPattern.expression) {
    return basicPattern.expression;
  }

  // Try matching interval patterns
  const intervalPattern = PatternMatcher.matchIntervalPatterns(normalizedInput);
  if (intervalPattern.matched && intervalPattern.expression) {
    return intervalPattern.expression;
  }

  // Try matching monthly patterns
  const monthlyPattern = PatternMatcher.matchMonthlyPatterns(normalizedInput);
  if (monthlyPattern.matched && monthlyPattern.expression) {
    return monthlyPattern.expression;
  }

  // Try matching yearly patterns
  const yearlyPattern = PatternMatcher.matchYearlyPatterns(normalizedInput);
  if (yearlyPattern.matched && yearlyPattern.expression) {
    return yearlyPattern.expression;
  }

  // Handle more complex patterns
  return parseComplexPattern(normalizedInput);
}

/**
 * Parses a natural language string into a cron pattern.
 *
 * Processes various time-related patterns in natural language and converts them
 * into a standard 5-part cron expression (minute hour dayOfMonth month dayOfWeek).
 *
 * It checks for different types of patterns in the following order:
 * 1. Interval patterns
 * 2. Monthly patterns
 * 3. Yearly patterns
 * 4. Day of week patterns
 * 5. Day of month patterns
 * 6. Specific month patterns
 * 7. Time patterns with "at"
 * 8. Time range patterns
 *
 * @param input - A natural language string describing a schedule (e.g., "every Monday at 3pm")
 * @returns A cron pattern string in the format "minute hour dayOfMonth month dayOfWeek"
 *
 * @example
 * parseComplexPattern("every Monday at 3pm") // Returns "0 15 * * 1"
 *
 * @throws {InvalidNaturalLanguageError} If the natural language input cannot be parsed
 * @throws {InvalidCronExpressionError} If the resulting cron expression is invalid
 */
function parseComplexPattern(
  input: string,
): CronTabExpressionString {
  // Default values
  let minute = "0";
  let hour = "0";
  let dayOfMonth = "*";
  let month = "*";
  let dayOfWeek = "*";

  // Try interval patterns first
  const intervalPattern = PatternMatcher.matchIntervalPatterns(input);
  if (intervalPattern.matched && intervalPattern.expression) {
    return intervalPattern.expression;
  }

  // Try monthly patterns
  const monthlyPattern = PatternMatcher.matchMonthlyPatterns(input);
  if (monthlyPattern.matched && monthlyPattern.expression) {
    return monthlyPattern.expression;
  }

  // Try yearly patterns
  const yearlyPattern = PatternMatcher.matchYearlyPatterns(input);
  if (yearlyPattern.matched && yearlyPattern.expression) {
    return yearlyPattern.expression;
  }

  // Try to match day of week patterns
  const dayOfWeekPattern = PatternMatcher.matchDayOfWeekPatterns(input);
  if (dayOfWeekPattern.matched) {
    dayOfWeek = dayOfWeekPattern.dayOfWeek;
  }

  // Try to match day of month patterns
  const dayOfMonthPattern = PatternMatcher.matchDayOfMonthPatterns(input);
  if (dayOfMonthPattern.matched) {
    dayOfMonth = dayOfMonthPattern.dayOfMonth;
  }

  // Try to match specific month patterns
  const monthPattern = PatternMatcher.matchSpecificMonthPatterns(input);
  if (monthPattern.matched) {
    month = monthPattern.month;
    // Only update dayOfMonth if it was provided and not already set by day matcher
    if (monthPattern.dayOfMonth && dayOfMonth === "*") {
      dayOfMonth = monthPattern.dayOfMonth;
    }
  }

  // Try to match time patterns with "at"
  const timeWithAtPattern = PatternMatcher.matchTimeWithAtPatterns(input);
  if (timeWithAtPattern.matched) {
    hour = timeWithAtPattern.hour;
    minute = timeWithAtPattern.minute;
  }

  // Try to match time range patterns
  const timeRangePattern = PatternMatcher.matchTimeRangePatterns(input);
  if (timeRangePattern.matched) {
    hour = timeRangePattern.hour;
    minute = timeRangePattern.minute;
  }

  // Combine all parts into a cron expression and validate the format
  const result = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`.trim();

  // Create a new CronTabExpression to validate the result
  try {
    // This will throw if the expression is invalid
    const cron = new CronTabExpression(result as CronTabExpressionString);
    return cron.expression;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new InvalidCronExpressionError(
      result,
      errorMessage,
    );
  }
}

/**
 * Converts a cron expression into a human-readable schedule description.
 *
 * @param expression - A standard cron expression with 5 fields (minute, hour, day of month, month, day of week)
 * @returns A natural language description of the schedule
 *
 * @example
 * ```ts
 * getNaturalLanguageScheduleForCronTabExpression("* * * * *")
 * // Returns: "Every minute"
 *
 * getNaturalLanguageScheduleForCronTabExpression("0 12 * * 1-5")
 * // Returns: "At 12:00 PM on weekdays"
 *
 * getNaturalLanguageScheduleForCronTabExpression("0 9 15,30 1,6,12 *")
 * // Returns: "At 9:00 AM on day 15 and 30 in January, June, and December"
 * ```
 *
 * @remarks
 * - Handles standard cron expression format with 5 fields
 * - Supports specific values, ranges (-), lists (,), steps (/), and wildcards (*)
 * - Special handling for common patterns like "every minute", "every hour", etc.
 * - Provides descriptive output for time ranges, weekdays/weekends, and monthly schedules
 *
 * @throws {InvalidCronExpressionError} When the expression is empty or doesn't contain exactly 5 fields
 */
export function getNaturalLanguageScheduleForCronTabExpression(
  expression: CronTabExpressionString | CronTabExpression,
): NaturalLanguageSchedule {
  // If it's a CronTabExpression instance, get the string representation
  const exprString = expression instanceof CronTabExpression
    ? expression.expression
    : expression;

  // Validate the expression
  InputUtils.validateCronExpression(exprString);

  const parts = exprString.trim().split(/\s+/);
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Handle common patterns first
  if (
    minute === "*" && hour === "*" && dayOfMonth === "*" && month === "*" &&
    dayOfWeek === "*"
  ) {
    return "Every minute";
  }

  if (
    minute.startsWith("*/") && hour === "*" && dayOfMonth === "*" &&
    month === "*" && dayOfWeek === "*"
  ) {
    const interval = parseInt(minute.substring(2), 10);
    return `Every ${interval} minutes`;
  }

  if (
    minute === "0" && hour === "*" && dayOfMonth === "*" && month === "*" &&
    dayOfWeek === "*"
  ) {
    return "Every hour";
  }

  if (
    minute === "0" && hour.startsWith("*/") && dayOfMonth === "*" &&
    month === "*" && dayOfWeek === "*"
  ) {
    const interval = parseInt(hour.substring(2), 10);
    return `Every ${interval} hours`;
  }

  if (
    minute === "0" && hour === "0" && dayOfMonth === "*" && month === "*" &&
    dayOfWeek === "*"
  ) {
    return "At 12:00 AM daily";
  }

  if (
    minute === "0" && hour === "12" && dayOfMonth === "*" && month === "*" &&
    dayOfWeek === "*"
  ) {
    return "At 12:00 PM daily";
  }

  // Build comprehensive description
  let desc = "";

  // Time part
  if (minute !== "*") {
    // Handle interval with time ranges
    const minuteNum = parseInt(minute, 10);

    if (hour !== "*") {
      if (hour.includes(",")) {
        // Multiple specific hours
        const hours = hour.split(",").map((h) => parseInt(h, 10));
        const times = hours.map((h) => TimeUtils.formatTime(h, minuteNum));
        desc = `At ${times.join(" and ")}`;
      } else if (hour.includes("-")) {
        // Hour range
        const [startHour, endHour] = hour.split("-").map((h) =>
          parseInt(h, 10)
        );
        if (minute.startsWith("*/")) {
          const interval = parseInt(minute.substring(2), 10);
          desc = `Every ${interval} minutes from ${
            TimeUtils.formatTime(startHour, 0)
          } to ${TimeUtils.formatTime(endHour, 0)}`;
        } else {
          desc = `At ${minuteNum} minutes past the hour, from ${
            TimeUtils.formatTime(startHour, 0)
          } to ${TimeUtils.formatTime(endHour, 0)}`;
        }
      } else {
        // Specific time
        const hourNum = parseInt(hour, 10);
        desc = `At ${TimeUtils.formatTime(hourNum, minuteNum)}`;
      }
    }
  }

  // Day of week part
  if (dayOfWeek !== "*") {
    if (dayOfWeek === "1-5") {
      desc += " on weekdays";
    } else if (dayOfWeek === "0,6" || dayOfWeek === "6,0") {
      desc += " on weekends";
    } else if (dayOfWeek.includes(",")) {
      const days = dayOfWeek.split(",").map((d) => parseInt(d, 10));
      const dayNames = days.map((d) => DAY_NAMES[d]);

      if (dayNames.length === 2) {
        desc += ` on ${dayNames[0]} and ${dayNames[1]}`;
      } else {
        const lastDay = dayNames.pop();
        desc += ` on ${dayNames.join(", ")}, and ${lastDay}`;
      }
    } else if (dayOfWeek.includes("-")) {
      const [start, end] = dayOfWeek.split("-").map((d) => parseInt(d, 10));
      desc += ` on ${DAY_NAMES[start]} through ${DAY_NAMES[end]}`;
    } else {
      const dayNum = parseInt(dayOfWeek, 10);
      desc += ` on ${DAY_NAMES[dayNum]}`;
    }
  } else if (dayOfMonth !== "*") {
    // Day of month part
    if (dayOfMonth === "L") {
      desc += " on the last day of every month";
    } else if (dayOfMonth.includes(",")) {
      const days = dayOfMonth.split(",").map((d) => parseInt(d, 10));
      if (days.length === 2) {
        desc += ` on day ${days[0]} and ${days[1]} of every month`;
      } else {
        const lastDay = days.pop();
        desc += ` on day ${days.join(", ")}, and ${lastDay} of every month`;
      }
    } else {
      const dayNum = parseInt(dayOfMonth, 10);
      if (month !== "*") {
        // Month part
        if (month.includes(",")) {
          const monthNums = month.split(",").map((m) => parseInt(m, 10));
          const monthNames = monthNums.map((m) => MONTH_NAMES[m]);

          if (monthNames.length === 2) {
            desc += ` on day ${dayNum} in ${monthNames[0]} and ${
              monthNames[1]
            }`;
          } else {
            const lastMonth = monthNames.pop();
            desc += ` on day ${dayNum} in ${
              monthNames.join(", ")
            }, and ${lastMonth}`;
          }
        } else if (month.includes("-")) {
          const [startMonth, endMonth] = month.split("-").map((m) =>
            parseInt(m, 10)
          );
          desc += ` on day ${dayNum} from ${MONTH_NAMES[startMonth]} through ${
            MONTH_NAMES[endMonth]
          }`;
        } else {
          const monthNum = parseInt(month, 10);
          desc += ` on ${MONTH_NAMES[monthNum]} ${dayNum}`;
        }
      } else {
        desc += ` on day ${dayNum} of every month`;
      }
    }
  } else if (desc === "") {
    desc = "Every minute";
  } else {
    desc += " daily";
  }

  return desc.trim();
}
