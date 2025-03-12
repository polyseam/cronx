import { assertEquals } from "@std/assert";

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
