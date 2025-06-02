/*
 * cron-expression.ts
 *
 * Defines a string-literal type `CronTabExpression<SundayZeroBased>` that validates
 * a standard five-field cron expression at compile time. If `SundayZeroBased` is `true`,
 * Sunday is represented as "0" in the day-of-week field; otherwise, Sunday is "1".
 *
 * Usage:
 *   import { CronTabExpression } from "./cron-expression";
 *
 *   // Sunday = "0"
 *   type CronZero = CronTabExpression<true>;
 *   const a: CronZero = "15 0 1-10 * 0";      // valid
 *   // const badA: CronZero = "0 0 * * 7";      // invalid (7 not allowed when Sunday=0)
 *
 *   // Sunday = "1"
 *   type CronOne = CronTabExpression<false>;
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
type Num1To6 = Exclude<Num0To6, "0"> | "7"; // 1-6 for Sunday=0, 1-7 for Sunday=1

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
type Dow_Atom<SB extends boolean> =
  | "*"
  | (SB extends true ? Num0To6 : Num1To7)
  | (SB extends true ? `${Num0To6}-${Num0To6}` : `${Num1To7}-${Num1To7}`)
  | (SB extends true ? `*/${Num1To6}` : `*/${Num1To7}`)
  | (SB extends true ? `${Num0To6}/${Num1To6}` : `${Num1To7}/${Num1To7}`);

//
// ──────────────────────────────────────────────────────────────────────────────
// 3) Allow comma-lists of these atomic items.
//    E.g. "5,10-15,*/2,30".
// ──────────────────────────────────────────────────────────────────────────────

/** A comma-separated list of minute tokens: */
type MinuteField =
  | Minute_Atom
  | `${Minute_Atom},${MinuteField}`;

/** A comma-separated list of hour tokens: */
type HourField =
  | Hour_Atom
  | `${Hour_Atom},${HourField}`;

/** A comma-separated list of day-of-month tokens: */
type DomField =
  | Dom_Atom
  | `${Dom_Atom},${DomField}`;

/** A comma-separated list of month tokens: */
type MonthField =
  | Month_Atom
  | `${Month_Atom},${MonthField}`;

/** A comma-separated list of day-of-week tokens (param'd by SB): */
type DowField<SB extends boolean> =
  | Dow_Atom<SB>
  | `${Dow_Atom<SB>},${DowField<SB>}`;

//
// ──────────────────────────────────────────────────────────────────────────────
// 4) Glue the five fields together with exactly one space each.
//    CronTabExpression<SB> = "<minute> <hour> <dom> <month> <dow>".
// ──────────────────────────────────────────────────────────────────────────────

/**
 * CronTabExpression<SB>:
 *
 * - SB = true  => interpret Sunday as "0" in day-of-week.
 * - SB = false => interpret Sunday as "1" in day-of-week.
 *
 * Examples:
 *   type A = CronTabExpression<true>;  // "15 0 1-10 * 0" is valid
 *   type B = CronTabExpression<false>; // "0 0 * * 7" is valid
 */
export type CronTabExpression<SB extends boolean> =
  `${MinuteField} ${HourField} ${DomField} ${MonthField} ${DowField<SB>}`;
