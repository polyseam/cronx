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

/**
 * A type that represents a string with exactly 5 space-delimited parts
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
    public expression: CronTabExpressionString,
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
      expressionString as CronTabExpressionString,
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

  public toString(): CronTabExpressionString {
    return this.expression;
  }

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
