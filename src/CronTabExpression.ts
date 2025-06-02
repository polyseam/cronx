import { validateCronTabExpressionString } from "./validators.ts";
import {
  getCronTabExpressionForNaturalLanguageSchedule,
  getNaturalLanguageScheduleForCronTabExpression,
} from "@polyseam/cronx/nlp";
/**
 * Gets the local timezone offset in hours.
 *
 * @returns The local timezone offset in hours (e.g., -5 for EST, +1 for CET)
 */
/**
 * Gets the local timezone offset in hours.
 *
 * This function calculates the offset between the local timezone and UTC.
 * Positive values indicate timezones ahead of UTC (east of Greenwich),
 * negative values indicate timezones behind UTC (west of Greenwich).
 *
 * @returns {number} The local timezone offset in hours (e.g., -5 for EST, +1 for CET)
 *
 * @example
 * ```ts
 * const offset = getLocalUTCOffset();
 * console.log(`Current timezone is UTC${offset >= 0 ? '+' + offset : offset}`);
 * ```
 */
export const getLocalUTCOffset =
  (): number => (new Date().getTimezoneOffset() / -60);

/**
 * A type that represents a valid cron expression string with exactly 5 space-delimited parts.
 *
 * Cron expression format: "minute hour day-of-month month day-of-week"
 *
 * Each part must follow standard cron syntax:
 * - minute: 0-59
 * - hour: 0-23
 * - day-of-month: 1-31
 * - month: 1-12 or JAN-DEC
 * - day-of-week: 0-6 or SUN-SAT (0 or 7 is Sunday)
 *
 * Special characters:
 * - *: any value
 * - ,: value list separator
 * - -: range of values
 * - /: step values
 * - ?: unspecified value (for day-of-month or day-of-week)
 * - L: last day of month or week
 *
 * @example
 * ```ts
 * // Every day at midnight
 * const midnight: CronTabExpressionString = "0 0 * * *" as CronTabExpressionString;
 *
 * // Every Monday at 9:30am
 * const mondayMorning: CronTabExpressionString = "30 9 * * 1" as CronTabExpressionString;
 *
 * // Every 15 minutes
 * const everyQuarter: CronTabExpressionString = "*\/15 * * * *" as CronTabExpressionString;
 * ```
 */
export type CronTabExpressionString =
  & `${string} ${string} ${string} ${string} ${string}`
  & {
    _cronExpressionBrand: never;
  };

function convertHourField(hourField: string, timezoneOffset: number): string {
  const hourParts = hourField.split(",");
  const convertedHours = hourParts.flatMap((part) => {
    if (part === "*") return ["*"];

    if (part.includes("-")) {
      let [start, end] = part.split("-").map(Number);
      start = (start - timezoneOffset + 24) % 24;
      end = (end - timezoneOffset + 24) % 24;

      if (start === end) {
        // Simplify identical start-end ranges, e.g., 3-3 => 3
        return [`${start}`];
      } else if (start < end) {
        return [`${start}-${end}`];
      } else {
        // Handle wrap-around by splitting into two ranges
        const firstRange = start === 23 ? "23" : `${start}-23`;
        return [firstRange, `0-${end}`];
      }
    }

    const singleHour = (Number(part) - timezoneOffset + 24) % 24;
    return [singleHour.toString()];
  });

  return convertedHours.join(",");
}

/**
 * A class representing a cron expression with timezone support and utility methods.
 *
 * CronTabExpression helps with creating, validating, and manipulating cron expressions.
 * It provides timezone adjustment capabilities and conversion to/from natural language.
 *
 * @class CronTabExpression
 *
 * @example
 * ```ts
 * // Create from standard cron expression
 * const dailyJob = new CronTabExpression("0 0 * * *" as CronTabExpressionString);
 *
 * // Create from natural language
 * const weeklyJob = CronTabExpression.fromNaturalLanguageSchedule("every Monday at 9am");
 *
 * // Convert to Deno cron schedule
 * const schedule = dailyJob.toDenoCronSchedule();
 * Deno.cron("my-job", schedule, myJobFunction);
 *
 * // Adjust for different timezone
 * const estJob = new CronTabExpression("0 9 * * *" as CronTabExpressionString, -5);
 * ```
 */
export class CronTabExpression {
  private static readonly FIELD_NAMES = [
    "minute",
    "hour",
    "day of month",
    "month",
    "day of week",
  ] as const;

  /**
   * Array of month name abbreviations used for cron expression parsing and formatting.
   *
   * These names can be used in the month field of a cron expression.
   */
  static readonly MONTH_NAMES = [
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

  /**
   * Array of day name abbreviations used for cron expression parsing and formatting.
   *
   * These names can be used in the day-of-week field of a cron expression.
   */
  static readonly DAY_NAMES = [
    "SUN",
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
    "SAT",
  ] as const;

  private readonly parts: string[];

  public offset: number;

  /**
   * Creates a new CronTabExpression instance.
   *
   * @param {CronTabExpressionString} expression - A valid cron expression string
   * @param {number} [offset] - Timezone UTC offset in hours (defaults to local timezone)
   *
   * @throws {Error} If the provided expression is not a valid cron expression
   *
   * @example
   * ```ts
   * // Create with default timezone (local)
   * const cronExp = new CronTabExpression("0 12 * * 1-5" as CronTabExpressionString);
   *
   * // Create with specific timezone (UTC+2)
   * const europeCron = new CronTabExpression("0 9 * * *" as CronTabExpressionString, 2);
   * ```
   */
  constructor(
    public expression: CronTabExpressionString,
    offset?: number, // timezone UTC offset in hours
  ) {
    this.offset = offset ?? getLocalUTCOffset();
    this.parts = expression.split(/\s+/);
    this.validate();
  }

  /**
   * Creates a CronTabExpression from a natural language schedule description.
   *
   * @param {string} nlSchedule - Natural language description of the schedule
   * @param {number} [offset] - Timezone UTC offset in hours (defaults to local timezone)
   * @returns {CronTabExpression} A new CronTabExpression instance
   *
   * @throws {Error} If the natural language schedule cannot be parsed
   *
   * @example
   * ```ts
   * // Create from various natural language descriptions
   * const daily = CronTabExpression.fromNaturalLanguageSchedule("every day at midnight");
   * const weekly = CronTabExpression.fromNaturalLanguageSchedule("every Monday at 9am");
   * const complex = CronTabExpression.fromNaturalLanguageSchedule("every 15 minutes on weekdays");
   *
   * // With specific timezone (EST)
   * const estJob = CronTabExpression.fromNaturalLanguageSchedule("daily at 8am", -5);
   * ```
   */
  static fromNaturalLanguageSchedule(
    nlSchedule: string,
    offset?: number,
  ): CronTabExpression {
    const expressionString = getCronTabExpressionForNaturalLanguageSchedule(
      nlSchedule,
    );
    return new CronTabExpression(
      expressionString as CronTabExpressionString,
      offset,
    );
  }

  /**
   * Converts the cron expression to a human-readable natural language description.
   *
   * @returns {string} A natural language description of the schedule
   *
   * @example
   * ```ts
   * const cron = new CronTabExpression("0 9 * * 1-5" as CronTabExpressionString);
   * const description = cron.toNaturalLanguageSchedule();
   * console.log(description); // "At 9:00 AM, Monday through Friday"
   * ```
   */
  toNaturalLanguageSchedule(): string {
    const nlSchedule = getNaturalLanguageScheduleForCronTabExpression(
      this.expression,
    );
    return nlSchedule;
  }

  /**
   * Validates that the expression is a valid cron expression string.
   *
   * @private
   * @throws {Error} If the expression is not valid
   */
  private validate(): void {
    validateCronTabExpressionString(this.expression);
  }

  /**
   * Returns the string representation of the cron expression.
   *
   * @returns {CronTabExpressionString} The cron expression string
   *
   * @example
   * ```ts
   * const cron = new CronTabExpression("0 12 * * *" as CronTabExpressionString);
   * console.log(cron.toString()); // "0 12 * * *"
   * ```
   */
  public toString(): CronTabExpressionString {
    return this.expression;
  }

  /**
   * Gets the local timezone offset in hours.
   *
   * @returns {number} The local timezone offset in hours
   *
   * @example
   * ```ts
   * const cron = new CronTabExpression("0 12 * * *" as CronTabExpressionString);
   * const localOffset = cron.getLocalUTCOffset();
   * console.log(`Local timezone is UTC${localOffset >= 0 ? '+' + localOffset : localOffset}`);
   * ```
   */
  getLocalUTCOffset(): number {
    return getLocalUTCOffset();
  }

  /**
   * Convert a day‐of‐week field (any valid cron DOW string) between:
   *   • 1-based numeric (Sunday=1…Saturday=7) or
   *   • 0-based numeric (Sunday=0…Saturday=6).
   *
   * Leaves non-numeric tokens (like '*', '?', 'L', named days 'SUN', 'MON', etc.) unchanged.
   *
   * @param dowField  The input day‐of‐week field as a string (e.g. "1,3-5,*\/2", "MON", "*").
   * @param sundayIs  Either 1 if the input numeric values are 1-based, or 0 if 0-based. Defaults to 0.
   * @returns         The rewritten DOW field string in the opposite indexing scheme.
   *
   * @example
   *   convertDayOfWeekToBase("5", 1)       // "4"    (Thursday: 1-based 5 → 0-based 4)
   *   convertDayOfWeekToBase("0,2-4", 0)   // "1,3-5" (0-based [Sun,Tue-Thu] → 1-based [Sun,Tue-Thu])
   *   convertDayOfWeekToBase("MON,WED", 0) // "MON,WED"  (named days unchanged)
   */
  convertDayOfWeekToBase(dowField: string, sundayIs = 0): string {
    const pieces = dowField.split(",").map((p) => p.trim());
    const mappedPieces = pieces.map((piece) => {
      // Preserve literal tokens if they contain letters or are special characters
      if (
        /^[A-Za-z\?\*Ll#]/.test(piece) ||
        piece === "" ||
        isNaN(parseInt(piece, 10)) && !piece.includes("-") &&
          !piece.includes("/")
      ) {
        return piece;
      }
      // Handle step syntax "X/Y"
      if (piece.includes("/")) {
        const [rangePart, stepPart] = piece.split("/");
        const newRange = this.convertDayOfWeekToBase(rangePart, sundayIs);
        return `${newRange}/${stepPart}`;
      }
      // Handle range "A-B"
      if (piece.includes("-")) {
        const [startStr, endStr] = piece.split("-");
        const startNum = parseInt(startStr, 10);
        const endNum = parseInt(endStr, 10);
        if (!isNaN(startNum) && !isNaN(endNum)) {
          const mapNum = (n: number) => sundayIs === 1 ? (n + 6) % 7 : n + 1;
          const mappedStart = mapNum(startNum);
          const mappedEnd = mapNum(endNum);
          return `${mappedStart}-${mappedEnd}`;
        }
        return piece;
      }
      // Single numeric value
      const num = parseInt(piece, 10);
      if (!isNaN(num)) {
        const mapped = sundayIs === 1 ? (num + 6) % 7 : num + 1;
        return `${mapped}`;
      }
      return piece;
    });
    return mappedPieces.join(",");
  }

  /**
   * Formats the cron expression with specified options, adjusting for timezone and day numbering.
   *
   * @param {Object} [options] - Formatting options
   * @param {number} [options.sundayIs=1] - The base for day-of-week (0 or 1, where 0 means Sunday=0, 1 means Sunday=1)
   * @param {number} [options.toOffset=0] - Target timezone offset to convert to (in hours)
   * @returns {string} The formatted cron expression
   *
   * @example
   * ```ts
   * // Convert from local timezone to UTC
   * const localCron = new CronTabExpression("0 9 * * *" as CronTabExpressionString);
   * const utcCron = localCron.format({ toOffset: 0 });
   * console.log(utcCron); // Will adjust the hour based on local timezone
   *
   * // Change day-of-week numbering system
   * const cron = new CronTabExpression("0 12 * * 0" as CronTabExpressionString);
   * console.log(cron.format({ sundayIs: 1 })); // "0 12 * * 1" (Sunday=1)
   * ```
   */
  format(
    options: {
      sundayIs: number;
      toOffset: number;
    } = {
      sundayIs: 1,
      toOffset: 0,
    },
  ): string {
    const { sundayIs, toOffset } = options;
    const parts = this.expression.split(" ");
    const [minute, hx, dayOfMonth, month, dx] = parts;
    if (parts.length !== 5) {
      throw new Error("Invalid cron expression format: expected 5 parts.");
    }
    const hours = convertHourField(hx, this.offset - toOffset);
    const dayOfWeek = this.convertDayOfWeekToBase(dx, sundayIs);
    return [
      minute,
      hours,
      dayOfMonth,
      month,
      dayOfWeek,
    ].join(" ");
  }

  /**
   * Converts the cron expression to a Deno.CronSchedule object.
   *
   * This allows direct use with Deno.cron() API for scheduling.
   * The method automatically formats the expression to be compatible with Deno's requirements,
   * including setting Sunday to 1 in the day-of-week field.
   *
   * @returns {Deno.CronSchedule} A Deno-compatible cron schedule object
   *
   * @example
   * ```ts
   * const cronExp = new CronTabExpression("0 12 * * 1-5" as CronTabExpressionString);
   * const schedule = cronExp.toDenoCronSchedule();
   *
   * // Use with Deno.cron
   * Deno.cron("weekday-job", schedule, async () => {
   *   // job logic here
   * });
   * ```
   */
  public toDenoCronSchedule(): Deno.CronSchedule {
    const parts = this.format({
      sundayIs: 1,
      toOffset: 0,
    }).split(" ");
    const minute = parts[0] as Deno.CronSchedule["minute"];
    const hour = parts[1] as Deno.CronSchedule["hour"];
    const dayOfMonth = parts[2] as Deno.CronSchedule["dayOfMonth"];
    const month = parts[3] as Deno.CronSchedule["month"];
    const dayOfWeek = parts[4] as Deno.CronSchedule["dayOfWeek"];

    return {
      minute,
      hour,
      dayOfMonth,
      month,
      dayOfWeek,
    };
  }
}
