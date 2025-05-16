import { assertEquals } from "@std/assert";

import { isValidCronExpression } from "./cron.ts";
import {
  convertCronToUTC,
  convertCronZeroBasedDaysToOneBased,
} from "./cron.ts";

Deno.test("basic zero-to-one: sunday as 1", () => {
  const result = convertCronZeroBasedDaysToOneBased("0 0 * * 0");
  assertEquals(result, "0 0 * * 1");
});

Deno.test("basic zero-to-one conversion: saturday as 7", () => {
  const result = convertCronZeroBasedDaysToOneBased("0 0 * * 6");
  assertEquals(result, "0 0 * * 7");
});

Deno.test("basic zero-to-one conversion: thursday,sunday", () => {
  const result = convertCronZeroBasedDaysToOneBased("0 0 * * 4,6");
  assertEquals(result, "0 0 * * 5,7");
});

Deno.test("basic zero-to-one conversion: sunday to wednesday", () => {
  const result = convertCronZeroBasedDaysToOneBased("0 0 * * 0-3");
  assertEquals(result, "0 0 * * 1-4");
});

Deno.test("basic zero-to-one conversion: wednesday to monday wrap-around", () => {
  const result = convertCronZeroBasedDaysToOneBased("0 0 * * 3-1");
  assertEquals(result, "0 0 * * 4-7,1-2");
});

Deno.test("basic crontab localisation", () => {
  const result = convertCronToUTC("0 0 * * 0", 0);
  assertEquals(result, "0 0 * * 0");
});

Deno.test("basic crontab localisation", () => {
  const result = convertCronToUTC("0 14 * * 0", -3);
  assertEquals(result, "0 17 * * 0");
});

Deno.test("crontab localisation with ranges", () => {
  const result = convertCronToUTC("0 14-18 * * 0", -3);
  assertEquals(result, "0 17-21 * * 0");
});

Deno.test("crontab localisation with list", () => {
  const result = convertCronToUTC("0 12,14,15 * * 0", -3);
  assertEquals(result, "0 15,17,18 * * 0");
});

Deno.test("crontab localisation with wraparound", () => {
  const result = convertCronToUTC("0 20-24 * * 0", -3);
  assertEquals(result, "0 23,0-3 * * 0");
});

Deno.test("valid 5-field cron, zero-based dow default", () => {
  assertEquals(isValidCronExpression("0 5 * * 1"), true);
});

Deno.test("valid 6-field cron with year", () => {
  assertEquals(isValidCronExpression("0 12 * * 3 2024"), true);
});

Deno.test("invalid cron: too few fields", () => {
  assertEquals(isValidCronExpression("0 0 * *"), false);
});

Deno.test("invalid cron: too many fields", () => {
  assertEquals(isValidCronExpression("0 0 * * 0 2023 extra"), false);
});

Deno.test("invalid cron: bad characters", () => {
  assertEquals(isValidCronExpression("0 0 * * L"), false);
  assertEquals(isValidCronExpression("*/15 0 * * MON"), false);
});

Deno.test("day-of-week out of range zero-based", () => {
  assertEquals(isValidCronExpression("0 0 * * 7"), false);
  assertEquals(isValidCronExpression("0 0 * * 0-7"), false);
});

Deno.test("day-of-week wrap-range zero-based is allowed", () => {
  // 5-1 splits into [5,1], both in 0..6
  assertEquals(isValidCronExpression("0 0 * * 5-1"), true);
});

Deno.test("increment and list syntax allowed", () => {
  assertEquals(isValidCronExpression("*/15 */2 1,15 * 0-6"), true);
});

Deno.test("one-based dow validation", () => {
  // with zeroBased=false, valid 1..7
  assertEquals(isValidCronExpression("0 0 * * 7", false), true);
  assertEquals(isValidCronExpression("0 0 * * 0", false), false);
  assertEquals(isValidCronExpression("0 0 * * 1-5", false), true);
  assertEquals(isValidCronExpression("0 0 * * 6-8", false), false);
});
