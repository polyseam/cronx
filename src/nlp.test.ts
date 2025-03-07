import { assertEquals, assertIsError } from "@std/assert";
import { CronxNLP } from "./nlp.ts";
import { describe } from "@std/testing/bdd";

const cronxNlp = new CronxNLP({ timeFormat: "12h" });

describe("getCronTabExpressionForNaturalLanguageSchedule", () => {
  /**
   * Test suite for the getCronTabExpressionForNaturalLanguageSchedule
   *
   * Tests various natural language schedule strings to ensure they are correctly
   * converted to crontab expressions.
   */
  Deno.test("Basic patterns", async (t) => {
    await t.step("every minute", () => {
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule("every minute"),
        "* * * * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every 1 minute",
        ),
        "* * * * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule("minutely"),
        "* * * * *",
      );
    });

    await t.step("every hour", () => {
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule("every hour"),
        "0 * * * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule("every 1 hour"),
        "0 * * * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule("hourly"),
        "0 * * * *",
      );
    });

    await t.step("every day", () => {
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule("every day"),
        "0 0 * * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule("every 1 day"),
        "0 0 * * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule("daily"),
        "0 0 * * *",
      );
    });

    await t.step("every week", () => {
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule("every week"),
        "0 0 * * 0",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule("every 1 week"),
        "0 0 * * 0",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule("weekly"),
        "0 0 * * 0",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule("every Monday"),
        "0 0 * * 1",
      );
    });
  });

  Deno.test("Time intervals", async (t) => {
    await t.step("minute intervals", () => {
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every 5 minutes",
        ),
        "*/5 * * * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every 15 minutes",
        ),
        "*/15 * * * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every 30 minutes",
        ),
        "*/30 * * * *",
      );
    });

    await t.step("hour intervals", () => {
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every 2 hours",
        ),
        "0 */2 * * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every 4 hours",
        ),
        "0 */4 * * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every 6 hours",
        ),
        "0 */6 * * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every 12 hours",
        ),
        "0 */12 * * *",
      );
    });

    await t.step("day intervals", () => {
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule("every 2 days"),
        "0 0 */2 * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule("every 3 days"),
        "0 0 */3 * *",
      );
    });
  });

  Deno.test("Daily patterns with specific times", async (t) => {
    await t.step("daily with am/pm times", () => {
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every day at 2pm",
        ),
        "0 14 * * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "daily at 10am",
        ),
        "0 10 * * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every day at 12am",
        ),
        "0 0 * * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every day at 12pm",
        ),
        "0 12 * * *",
      );
    });

    await t.step("daily with specific times", () => {
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every day at 3:30am",
        ),
        "30 3 * * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "daily at 5:15pm",
        ),
        "15 17 * * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every day at 9:45am",
        ),
        "45 9 * * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every day at 7:20pm",
        ),
        "20 19 * * *",
      );
    });

    await t.step("daily at multiple times", () => {
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every day at 8am and 8pm",
        ),
        "0 8,20 * * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "daily at 6:30am and 6:30pm",
        ),
        "30 6,18 * * *",
      );
    });
  });

  Deno.test("Weekly patterns with specific days", async (t) => {
    await t.step("weekly on specific days", () => {
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule("every Monday"),
        "0 0 * * 1",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule("every Sunday"),
        "0 0 * * 0",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule("every Friday"),
        "0 0 * * 5",
      );
    });

    await t.step("weekly on specific days with times", () => {
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every Monday at 9am",
        ),
        "0 9 * * 1",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every Sunday at 10:30am",
        ),
        "30 10 * * 0",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every Friday at 5pm",
        ),
        "0 17 * * 5",
      );
    });

    await t.step("multiple days of the week", () => {
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every Monday, Wednesday, Friday",
        ),
        "0 0 * * 1,3,5",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every weekday",
        ),
        "0 0 * * 1-5",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every saturday and sunday",
        ),
        "0 0 * * 0,6",
      );
    });

    await t.step("multiple days with specific time", () => {
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every Monday, Wednesday, Friday at 3pm",
        ),
        "0 15 * * 1,3,5",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every weekday at 8:30am",
        ),
        "30 8 * * 1-5",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every saturday and sunday at 11am",
        ),
        "0 11 * * 0,6",
      );
    });
  });

  Deno.test("Monthly and yearly patterns", async (t) => {
    await t.step("monthly patterns", () => {
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule("every month"),
        "0 0 1 * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule("monthly"),
        "0 0 1 * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every 1st of the month",
        ),
        "0 0 1 * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every 15th of the month",
        ),
        "0 0 15 * *",
      );
    });

    await t.step("monthly patterns with times", () => {
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every month at 3pm",
        ),
        "0 15 1 * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "monthly at 7:45am",
        ),
        "45 7 1 * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every 1st of the month at 9am",
        ),
        "0 9 1 * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every 15th of the month at 2:30pm",
        ),
        "30 14 15 * *",
      );
    });

    await t.step("yearly patterns", () => {
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule("every year"),
        "0 0 1 1 *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule("yearly"),
        "0 0 1 1 *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule("annually"),
        "0 0 1 1 *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every January 1st",
        ),
        "0 0 1 1 *",
      );
    });

    await t.step("yearly patterns with times", () => {
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every year at 12am",
        ),
        "0 0 1 1 *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "yearly at 5pm",
        ),
        "0 17 1 1 *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "annually at 9:15am",
        ),
        "15 9 1 1 *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every January 1st at 12pm",
        ),
        "0 12 1 1 *",
      );
    });

    await t.step("specific months", () => {
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every January",
        ),
        "0 0 1 1 *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every December",
        ),
        "0 0 1 12 *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every January, April, July, October",
        ),
        "0 0 1 1,4,7,10 *",
      );
    });
  });

  Deno.test("Complex patterns with multiple components", async (t) => {
    await t.step("specific day and time combinations", () => {
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every Monday at 9am and 5pm",
        ),
        "0 9,17 * * 1",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every weekday at 8:30am and 4:30pm",
        ),
        "30 8,16 * * 1-5",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every 15th of the month at 10am and 6pm",
        ),
        "0 10,18 15 * *",
      );
    });

    await t.step("month and day combinations", () => {
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every January 1st",
        ),
        "0 0 1 1 *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every December 25th",
        ),
        "0 0 25 12 *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every January 1st at 12am",
        ),
        "0 0 1 1 *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every December 25th at 8am",
        ),
        "0 8 25 12 *",
      );
    });

    await t.step("time ranges", () => {
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every hour from 9am to 5pm",
        ),
        "0 9-17 * * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every 30 minutes from 9am to 5pm",
        ),
        "*/30 9-17 * * *",
      );
      assertEquals(
        cronxNlp.getCronTabExpressionForNaturalLanguageSchedule(
          "every weekday every hour from 9am to 5pm",
        ),
        "0 9-17 * * 1-5",
      );
    });
  });
});

describe("getNaturalLanguageScheduleForCronTabExpression", () => {
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
  Deno.test("Time-specific pattern - every day at 12 AM", () => {
    const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
      "0 0 * * *",
    );
    assertEquals(result, "At 12 AM every day");
  });

  Deno.test("Time-specific pattern - every day at 12 PM", () => {
    const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
      "0 12 * * *",
    );
    assertEquals(result, "At 12 PM every day");
  });

  Deno.test("Time-specific pattern - every day at specific time (AM)", () => {
    const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
      "30 9 * * *",
    );
    assertEquals(result, "At 9:30 AM every day");
  });

  Deno.test("Time-specific pattern - every day at specific time (PM)", () => {
    const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
      "45 15 * * *",
    );
    assertEquals(result, "At 3:45 PM every day");
  });

  // Day of week patterns
  Deno.test("Day of week pattern - every Monday at 12 AM", () => {
    const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
      "0 0 * * 1",
    );
    assertEquals(result, "At 12 AM every Monday");
  });

  Deno.test("Day of week pattern - every Sunday at specific time", () => {
    const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
      "30 10 * * 0",
    );
    assertEquals(result, "At 10:30 AM every Sunday");
  });

  Deno.test("Day of week pattern - weekdays at specific time", () => {
    const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
      "0 8 * * 1-5",
    );
    assertEquals(result, "At 8 AM from Monday to Friday");
  });

  Deno.test("Day of week pattern - weekdays at specific time", () => {
    const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
      "0 13 * * 2-4",
    );
    assertEquals(result, "At 1 PM from Tuesday to Thursday");
  });

  Deno.test("Day of week pattern - weekends at specific time", () => {
    const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
      "0 10 * * 0,6",
    );
    assertEquals(result, "At 10 AM every Saturday and Sunday");
  });

  Deno.test("Day of week pattern - multiple specific days", () => {
    const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
      "0 9 * * 1,3,5",
    );
    assertEquals(result, "At 9AM every Monday, Wednesday, and Friday");
  });

  // Month patterns
  Deno.test("Month pattern - specific day every month", () => {
    const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
      "0 12 15 * *",
    );
    assertEquals(result, "At 12 PM on the 15th day of every month");
  });

  Deno.test("Month pattern - specific month and day", () => {
    const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
      "0 0 1 1 *",
    );
    assertEquals(result, "At 12 AM Every year on January 1st");
  });

  Deno.test("Month pattern - multiple specific months", () => {
    // This will test the fallback generic description
    const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
      "0 12 1 3,6,9,12 *",
    );
    assertEquals(
      result,
      "At 12 PM on the 1st day of the month in March, June, September, and December",
    );
  });

  Deno.test("Month pattern - month range", () => {
    // This will test the fallback generic description
    const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
      "0 12 1 6-8 *",
    );
    assertEquals(
      result,
      "At 12 PM on the 1st day of the month from June to August",
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
      "Every 30 minutes at 9 AM to 5PM, from Monday to Friday",
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
      "At 11 PM on the last day of the month",
    );
  });

  // Invalid pattern tests
  Deno.test("Invalid pattern - wrong number of fields", () => {
    const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression(
      "* * * *",
    );
    assertIsError(result);
  });

  Deno.test("Invalid pattern - empty string", () => {
    const result = cronxNlp.getNaturalLanguageScheduleForCronTabExpression("");
    assertIsError(result);
  });
});
