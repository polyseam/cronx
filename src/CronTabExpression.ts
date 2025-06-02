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
export const getLocalUTCOffset =
  (): number => (new Date().getTimezoneOffset() / -60);

/*
 * cron-expression.ts
 *
 * Defines a string-literal type `CronTabExpressionString<SundayZeroBased>` that validates
 * a standard five-field cron expression at compile time. If `SundayZeroBased` is `true`,
 * Sunday is represented as "0" in the day-of-week field; otherwise, Sunday is "1".
 *
 * Usage:
 *   import { CronTabExpression } from "./cron-expression";
 *
 *   // Sunday = "0"
 *   type CronZero = CronTabExpressionString<true>;
 *   const a: CronZero = "15 0 1-10 * 0";      // valid
 *   // const badA: CronZero = "0 0 * * 7";      // invalid (7 not allowed when Sunday=0)
 *
 *   // Sunday = "1"
 *   type CronOne = CronTabExpressionString<false>;
 *   const b: CronOne = "0 0 * * 7";             // valid (Sunday=7)
 *   // const badB: CronOne = "0 0 * * 0";       // invalid (0 not allowed when Sunday=1)
 */

//
// ──────────────────────────────────────────────────────────────────────────────
// 1) Enumerate every valid numeric literal for each field as string unions.
// ──────────────────────────────────────────────────────────────────────────────

// 1a) Minutes: "0" | "1" | ... | "59"
type Num0To59 =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15"
  | "16"
  | "17"
  | "18"
  | "19"
  | "20"
  | "21"
  | "22"
  | "23"
  | "24"
  | "25"
  | "26"
  | "27"
  | "28"
  | "29"
  | "30"
  | "31"
  | "32"
  | "33"
  | "34"
  | "35"
  | "36"
  | "37"
  | "38"
  | "39"
  | "40"
  | "41"
  | "42"
  | "43"
  | "44"
  | "45"
  | "46"
  | "47"
  | "48"
  | "49"
  | "50"
  | "51"
  | "52"
  | "53"
  | "54"
  | "55"
  | "56"
  | "57"
  | "58"
  | "59";

// 1b) Hours: "0" | "1" | ... | "23"
type Num0To23 =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15"
  | "16"
  | "17"
  | "18"
  | "19"
  | "20"
  | "21"
  | "22"
  | "23";

// 1c) Day-of-Month: "1" | "2" | ... | "31"
type _Num1To31 =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15"
  | "16"
  | "17"
  | "18"
  | "19"
  | "20"
  | "21"
  | "22"
  | "23"
  | "24"
  | "25"
  | "26"
  | "27"
  | "28"
  | "29"
  | "30"
  | "31";

type Num1To31 = _Num1To31;

// 1d) Month (numeric only): "1" | "2" | ... | "12"
type Num1To12 =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12";

// 1e) Day-of-Week (zero-based): "0" | "1" | ... | "6"
//     Day-of-Week (one-based):  "1" | "2" | ... | "7"
type Num0To6 = "0" | "1" | "2" | "3" | "4" | "5" | "6";
type Num1To7 = "1" | "2" | "3" | "4" | "5" | "6" | "7";

// Step values (1-59 for minutes, 1-23 for hours, etc.)
type Num1To59 = Exclude<Num0To59, "0">;
type Num1To23 = Exclude<Num0To23, "0">;

//
// ──────────────────────────────────────────────────────────────────────────────
// 2) Build &quot;atomic&quot; tokens for each field:
//    - A single number from the appropriate union
//    - A range      (e.g. &quot;5-15&quot;)
//    - A step       (e.g. &quot;*/5&quot; or &quot;10/5&quot;)
//    - A wildcard   (&quot;*&quot;)
// ──────────────────────────────────────────────────────────────────────────────

/** MINUTE-FIELD atomic items: */
type Minute_Atom =
  | "*" // wildcard
  | Num0To59 // single minute literal
  | `${Num0To59}-${Num0To59}` // range "x-y"
  | `*/${Num1To59}` // step "*/s" (min 1)
  | `${Num0To59}/${Num1To59}`; // step "m/s" (min 1)

/** HOUR-FIELD atomic items: */
type Hour_Atom =
  | "*"
  | Num0To23
  | `${Num0To23}-${Num0To23}`
  | `*/${Num1To23}`
  | `${Num0To23}/${Num1To23}`;

/** DAY-OF-MONTH-FIELD atomic items: */
type Dom_Atom =
  | "*"
  | Num1To31
  | `${Num1To31}-${Num1To31}`
  | `*/${Num1To31}`
  | `${Num1To31}/${Num1To31}`;

/** MONTH-FIELD atomic items: */
type Month_Atom =
  | "*"
  | Num1To12
  | `${Num1To12}-${Num1To12}`
  | `*/${Num1To12}`
  | `${Num1To12}/${Num1To12}`;

/**
 * DAY-OF-WEEK-FIELD atomic items parameterized by whether Sunday=0 or Sunday=1:
 *
 * If SB = true  => allowed numbers "0"-"6".
 * If SB = false => allowed numbers "1"-"7".
 */
type Dow_Atom<SB extends boolean = false> =
  | "*"
  | (SB extends true ? Num0To6 : Num1To7)
  | (SB extends true ? `${Num0To6}-${Num0To6}` : `${Num1To7}-${Num1To7}`)
  | (SB extends true ? `*/${Num0To6}` : `*/${Num1To7}`)
  | (SB extends true ? `${Num0To6}/${Num0To6}` : `${Num1To7}/${Num1To7}`);

//
// ──────────────────────────────────────────────────────────────────────────────
// 3) Allow comma-lists of these atomic items.
//    E.g. "5,10-15,*/2,30".
// ──────────────────────────────────────────────────────────────────────────────

/** A comma-separated list of minute tokens */
type MinuteField = string & {
  // This uses a type assertion to indicate this is a valid minute field
  // Actual validation would happen at runtime
  _minuteFieldBrand: never;
};

/** A comma-separated list of hour tokens */
type HourField = string & {
  _hourFieldBrand: never;
};

/** A comma-separated list of day-of-month tokens */
type DomField = string & {
  _domFieldBrand: never;
};

/** A comma-separated list of month tokens */
type MonthField = string & {
  _monthFieldBrand: never;
};

/** A comma-separated list of day-of-week tokens (param'd by SB) */
type DowField<SB extends boolean = false> = string & {
  _dowFieldBrand: never;
};

//
// ──────────────────────────────────────────────────────────────────────────────
// 4) Glue the five fields together with exactly one space each.
//    CronTabExpressionString<SB> = "<minute> <hour> <dom> <month> <dow>".
// ──────────────────────────────────────────────────────────────────────────────

/**
 * CronTabExpressionString<SB>:
 *
 * - SB = true  => interpret Sunday as "0" in day-of-week.
 * - SB = false => interpret Sunday as "1" in day-of-week.
 *
 * Examples:
 *   type A = CronTabExpressionString<true>;  // "15 0 1-10 * 0" is valid
 *   type B = CronTabExpressionString<false>; // "0 0 * * 7" is valid
 */
export type CronTabExpressionString<SB extends boolean = false> =
  `${MinuteField} ${HourField} ${DomField} ${MonthField} ${DowField<SB>}`;

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

export class CronTabExpression {
  private static readonly FIELD_NAMES = [
    "minute",
    "hour",
    "day of month",
    "month",
    "day of week",
  ] as const;

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

  constructor(
    public expression: CronTabExpressionString<false>,
    offset?: number, // timezone UTC offset in hours
  ) {
    this.offset = offset ?? getLocalUTCOffset();
    this.parts = expression.split(/\s+/);
    this.validate();
  }

  static fromNaturalLanguageSchedule(
    nlSchedule: string,
    offset?: number,
  ): CronTabExpression {
    const expressionString = getCronTabExpressionForNaturalLanguageSchedule(
      nlSchedule,
    );
    return new CronTabExpression(
      expressionString as CronTabExpressionString<false>,
      offset,
    );
  }

  toNaturalLanguageSchedule(): string {
    const nlSchedule = getNaturalLanguageScheduleForCronTabExpression(
      this.expression,
    );
    if (nlSchedule instanceof Error) {
      throw nlSchedule;
    }
    return nlSchedule;
  }

  private validate(): void {
    validateCronTabExpressionString(this.expression);
  }

  public toString(): string {
    return this.expression;
  }

  getLocalUTCOffset(): number {
    return getLocalUTCOffset();
  }

  /**
   * Convert a day‐of‐week integer between:
   *   • 1-based (Sunday=1, Monday=2, …, Saturday=7)
   *   • 0-based (Sunday=0, Monday=1, …, Saturday=6)
   *
   * @param dayOfWeek   The input day index (1–7 if sundayIs=1, or 0–6 if sundayIs=0)
   * @param sundayIs Either 1 (meaning input is 1-based) or 0 (meaning input is 0-based).
   *                 Defaults to 1.
   * @returns        The same weekday, in the opposite indexing scheme:
   *                 • If sundayIs=1 (input was 1–7), returns 0–6
   *                 • If sundayIs=0 (input was 0–6), returns 1–7
   *
   * @example
   *   convert(5, 1)  // input=5 (Thursday in 1-based), returns 4 (Thursday in 0-based)
   *   convert(5, 0)  // input=5 (Friday in 0-based),  returns 6 (Saturday in 1-based)? No—see below.
   *
   * Note: If sundayIs=0, we expect dayOfWeek ∈ [0,6], so convert(5,0) → (5+1)=6 (Friday→Saturday? Actually Friday=5→1-based=6).
   */
  convertDayOfWeekToBase(dayOfWeek: number, sundayIs = 0): number {
    if (sundayIs === 1) {
      // Input is 1-based (1=Sun…7=Sat). Output should be 0-based (0=Sun…6=Sat).
      // Formula: (dayOfWeek + 6) % 7
      //   1→0, 2→1, …, 7→6
      if (dayOfWeek < 1 || dayOfWeek > 7) {
        throw new Error(
          `When sundayIs=1, dayOfWeek must be 1–7. Got: ${dayOfWeek}`,
        );
      }
      return (dayOfWeek + 6) % 7;
    } else {
      // sundayIs === 0: Input is 0-based (0=Sun…6=Sat). Output should be 1-based (1=Sun…7=Sat).
      // Formula: dayOfWeek + 1
      //   0→1, 1→2, …, 6→7
      if (dayOfWeek < 0 || dayOfWeek > 6) {
        throw new Error(
          `When sundayIs=0, dayOfWeek must be 0–6. Got: ${dayOfWeek}`,
        );
      }
      return dayOfWeek + 1;
    }
  }

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
    const dayOfWeek = this.convertDayOfWeekToBase(parseInt(dx, 10), sundayIs);
    return [
      minute,
      hours,
      dayOfMonth,
      month,
      dayOfWeek,
    ].join(" ");
  }

  public toDenoCronSchedule(): Deno.CronSchedule {
    const p = this.format({
      sundayIs: 1,
      toOffset: 0,
    });
    const minute = p[0] as Deno.CronSchedule["minute"];
    const hour = p[1] as Deno.CronSchedule["hour"];
    const dayOfMonth = p[2] as Deno.CronSchedule["dayOfMonth"];
    const month = p[3] as Deno.CronSchedule["month"];
    const dayOfWeek = p[4] as Deno.CronSchedule["dayOfWeek"];

    return {
      minute,
      hour,
      dayOfMonth,
      month,
      dayOfWeek,
    };
  }
}
