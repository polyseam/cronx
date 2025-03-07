import { assertEquals, assertInstanceOf } from "@std/assert";
import { CronxNLP } from "./nlp.ts";

const cronxNlp = new CronxNLP({ timeFormat: "12h" });

/**
 * Test suite for the getNaturalLanguageScheduleForCronTabExpression function
 *
 * Tests various categories of cron expressions to ensure they are correctly
 * converted to natural language descriptions.
 */

// Basic patterns
Deno.test("Basic pattern - every minute", () => {
  const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
    "* * * * *",
  );
  assertEquals(result, "Every minute");
});

Deno.test("Basic pattern - every N minutes", () => {
  const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
    "*/15 * * * *",
  );
  assertEquals(result, "Every 15 minutes");
});

Deno.test("Basic pattern - every hour", () => {
  const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
    "0 * * * *",
  );
  assertEquals(result, "Every hour");
});

Deno.test("Basic pattern - every N hours", () => {
  const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
    "0 */2 * * *",
  );
  assertEquals(result, "Every 2 hours");
});

// Time-specific patterns
Deno.test("Time-specific pattern - every day at midnight", () => {
  const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
    "0 0 * * *",
  );
  assertEquals(result, "Every day at midnight");
});

Deno.test("Time-specific pattern - every day at noon", () => {
  const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
    "0 12 * * *",
  );
  assertEquals(result, "Every day at noon");
});

Deno.test("Time-specific pattern - every day at specific time (AM)", () => {
  const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
    "30 9 * * *",
  );
  assertEquals(result, "Every day at 9:30 AM");
});

Deno.test("Time-specific pattern - every day at specific time (PM)", () => {
  const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
    "45 15 * * *",
  );
  assertEquals(result, "Every day at 3:45 PM");
});

// Day of week patterns
Deno.test("Day of week pattern - every Monday at midnight", () => {
  const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
    "0 0 * * 1",
  );
  assertEquals(result, "Every Monday at midnight");
});

Deno.test("Day of week pattern - every Sunday at specific time", () => {
  const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
    "30 10 * * 0",
  );
  assertEquals(result, "Every Sunday at 10:30 AM");
});

Deno.test("Day of week pattern - weekdays at specific time", () => {
  const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
    "0 8 * * 1-5",
  );
  assertEquals(result, "Every weekday at 8 AM");
});

Deno.test("Day of week pattern - weekends at specific time", () => {
  const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
    "0 10 * * 0,6",
  );
  assertEquals(result, "Every Saturday and Sunday at 10 AM");
});

Deno.test("Day of week pattern - multiple specific days", () => {
  const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
    "0 9 * * 1,3,5",
  );
  assertEquals(result, "Every Monday, Wednesday and Friday at 9 AM");
});

// Month patterns
Deno.test("Month pattern - specific day every month", () => {
  const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
    "0 12 15 * *",
  );
  assertEquals(result, "On the 15th day of every month at noon");
});

Deno.test("Month pattern - specific month and day", () => {
  const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
    "0 0 1 1 *",
  );
  assertEquals(result, "Every year on January 1st at 12 AM");
});

Deno.test("Month pattern - multiple specific months", () => {
  // This will test the fallback generic description
  const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
    "0 12 1 3,6,9,12 *",
  );
  assertEquals(
    result,
    "At 12 PM, on the 1st day of the month in March, June, September and December",
  );
});

Deno.test("Month pattern - month range", () => {
  // This will test the fallback generic description
  const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
    "0 12 1 6-8 *",
  );
  assertEquals(
    result,
    "At 12 PM, on the 1st day of the month from June to August",
  );
});

// Complex patterns with multiple components
Deno.test("Complex pattern - specific day and month with time", () => {
  const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
    "0 9 25 12 *",
  );
  assertEquals(result, "Every year on December 25th at 9 AM");
});

Deno.test("Complex pattern - specific days of week with intervals", () => {
  // This will test the fallback generic description
  const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
    "*/30 9-17 * * 1-5",
  );
  assertEquals(
    result,
    "Every 30 minutes at 9 AM, from Monday to Friday",
  );
});

Deno.test("Complex pattern - specific time on last day of month", () => {
  // This will test the fallback generic description since the function doesn't
  // specifically handle expressions like L for "last day of month"
  const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
    "0 23 L * *",
  );
  assertEquals(
    result,
    "At 11 PM, on the last day of the month",
  );
});

// Invalid pattern tests
Deno.test("Invalid pattern - wrong number of fields", () => {
  const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
    "* * * *",
  );
  assertInstanceOf(result, Error);
});

Deno.test("Invalid pattern - empty string", () => {
  const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression("");
  assertInstanceOf(result, Error);
});
