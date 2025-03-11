import { assertEquals } from "@std/assert";

import { convertCronToUTC, convertZeroBasedDaysToOneBased } from "./cron.ts";

Deno.test("basic zero-to-one: sunday as 1", () => {
  const result = convertZeroBasedDaysToOneBased("0 0 * * 0");
  assertEquals(result, "0 0 * * 1");
});

Deno.test("basic zero-to-one conversion: saturday as 7", () => {
  const result = convertZeroBasedDaysToOneBased("0 0 * * 6");
  assertEquals(result, "0 0 * * 7");
});

Deno.test("basic crontab localisation", () => {
  const result = convertCronToUTC("0 0 * * 0", 0);
  assertEquals(result, "0 0 * * 0");
});

Deno.test("basic crontab localisation", () => {
  const result = convertCronToUTC("0 14 * * 0", -3);
  assertEquals(result, "0 17 * * 0");
});
