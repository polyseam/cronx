import { assertEquals, assertIsError } from "@std/assert";

import {
  getCronTabExpressionForNaturalLanguageSchedule,
  getNaturalLanguageScheduleForCronTabExpression,
} from "./nlp.ts";

/**
 * Test suite for the getCronTabExpressionForNaturalLanguageSchedule
 *
 * Tests various natural language schedule strings to ensure they are correctly
 * converted to crontab expressions.
 */
Deno.test("Basic patterns", async (t) => {
  await t.step("every minute", () => {
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule("every minute"),
      "* * * * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every 1 minute",
      ),
      "* * * * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule("minutely"),
      "* * * * *",
    );
  });

  await t.step("every hour", () => {
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule("every hour"),
      "0 * * * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule("every 1 hour"),
      "0 * * * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule("hourly"),
      "0 * * * *",
    );
  });

  await t.step("every day", () => {
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule("every day"),
      "0 0 * * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule("every 1 day"),
      "0 0 * * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule("daily"),
      "0 0 * * *",
    );
  });

  await t.step("every week", () => {
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule("every week"),
      "0 0 * * 0",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule("every 1 week"),
      "0 0 * * 0",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule("weekly"),
      "0 0 * * 0",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule("every Monday"),
      "0 0 * * 1",
    );
  });
});

Deno.test("Time intervals", async (t) => {
  await t.step("minute intervals", () => {
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every 5 minutes",
      ),
      "*/5 * * * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every 15 minutes",
      ),
      "*/15 * * * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every 30 minutes",
      ),
      "*/30 * * * *",
    );
  });

  await t.step("hour intervals", () => {
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every 2 hours",
      ),
      "0 */2 * * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every 4 hours",
      ),
      "0 */4 * * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every 6 hours",
      ),
      "0 */6 * * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every 12 hours",
      ),
      "0 */12 * * *",
    );
  });

  await t.step("day intervals", () => {
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule("every 2 days"),
      "0 0 */2 * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule("every 3 days"),
      "0 0 */3 * *",
    );
  });
});

Deno.test("Daily patterns with specific times", async (t) => {
  await t.step("daily with am/pm times", () => {
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every day at 2pm",
      ),
      "0 14 * * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "daily at 10am",
      ),
      "0 10 * * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every day at 12am",
      ),
      "0 0 * * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every day at 12pm",
      ),
      "0 12 * * *",
    );
  });

  await t.step("daily with specific times", () => {
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every day at 3:30am",
      ),
      "30 3 * * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "daily at 5:15pm",
      ),
      "15 17 * * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every day at 9:45am",
      ),
      "45 9 * * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every day at 7:20pm",
      ),
      "20 19 * * *",
    );
  });

  await t.step("daily at multiple times", () => {
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every day at 8am and 8pm",
      ),
      "0 8,20 * * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "daily at 6:30am and 6:30pm",
      ),
      "30 6,18 * * *",
    );
  });
});

Deno.test("Weekly patterns with specific days", async (t) => {
  await t.step("weekly on specific days", () => {
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule("every Monday"),
      "0 0 * * 1",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule("every Sunday"),
      "0 0 * * 0",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule("every Friday"),
      "0 0 * * 5",
    );
  });

  await t.step("weekly on specific days with times", () => {
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every Monday at 9am",
      ),
      "0 9 * * 1",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every Sunday at 10:30am",
      ),
      "30 10 * * 0",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every Friday at 5pm",
      ),
      "0 17 * * 5",
    );
  });

  await t.step("multiple days of the week", () => {
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every Monday, Wednesday, Friday",
      ),
      "0 0 * * 1,3,5",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every weekday",
      ),
      "0 0 * * 1-5",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every saturday and sunday",
      ),
      "0 0 * * 0,6",
    );
  });

  await t.step("multiple days with specific time", () => {
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every Monday, Wednesday, Friday at 3pm",
      ),
      "0 15 * * 1,3,5",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every weekday at 8:30am",
      ),
      "30 8 * * 1-5",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every saturday and sunday at 11am",
      ),
      "0 11 * * 0,6",
    );
  });
});

Deno.test("Monthly and yearly patterns", async (t) => {
  await t.step("monthly patterns", () => {
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule("every month"),
      "0 0 1 * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule("monthly"),
      "0 0 1 * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every 1st of the month",
      ),
      "0 0 1 * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every 15th of the month",
      ),
      "0 0 15 * *",
    );
  });

  await t.step("monthly patterns with times", () => {
    // TODO: fix this test
    // assertEquals(
    //   getCronTabExpressionForNaturalLanguageSchedule(
    //     "every month at 3pm",
    //   ),
    //   "0 15 1 * *",
    // );

    // TODO: fix this test
    // assertEquals(
    //   getCronTabExpressionForNaturalLanguageSchedule(
    //     "monthly at 7:45am",
    //   ),
    //   "45 7 1 * *",
    // );

    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every 1st of the month at 9am",
      ),
      "0 9 1 * *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every 15th of the month at 2:30pm",
      ),
      "30 14 15 * *",
    );
  });

  await t.step("yearly patterns", () => {
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule("every year"),
      "0 0 1 1 *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule("yearly"),
      "0 0 1 1 *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule("annually"),
      "0 0 1 1 *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every January 1st",
      ),
      "0 0 1 1 *",
    );
  });

  await t.step("yearly patterns with times", () => {
    // TODO: fix this test
    // assertEquals(
    //   getCronTabExpressionForNaturalLanguageSchedule(
    //     "every year at 12am",
    //   ),
    //   "0 0 1 1 *",
    // );

    // TODO: fix this test
    // assertEquals(
    //   getCronTabExpressionForNaturalLanguageSchedule(
    //     "yearly at 5pm",
    //   ),
    //   "0 17 1 1 *",
    // );

    // TODO: fix this test
    // assertEquals(
    //   getCronTabExpressionForNaturalLanguageSchedule(
    //     "annually at 9:15am",
    //   ),
    //   "15 9 1 1 *",
    // );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every January 1st at 12pm",
      ),
      "0 12 1 1 *",
    );
  });

  await t.step("specific months", () => {
    // TODO: fix this test
    // assertEquals(
    //   getCronTabExpressionForNaturalLanguageSchedule(
    //     "every January",
    //   ),
    //   "0 0 1 1 *",
    // );

    // TODO: fix this test
    // assertEquals(
    //   getCronTabExpressionForNaturalLanguageSchedule(
    //     "every December",
    //   ),
    //   "0 0 1 12 *",
    // );

    // TODO: fix this test
    // assertEquals(
    //   getCronTabExpressionForNaturalLanguageSchedule(
    //     "every January, April, July, October",
    //   ),
    //   "0 0 1 1,4,7,10 *",
    // );
  });
});

Deno.test("Complex patterns with multiple components", async (t) => {
  await t.step("specific day and time combinations", () => {
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every Monday at 9am and 5pm",
      ),
      "0 9,17 * * 1",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every weekday at 8:30am and 4:30pm",
      ),
      "30 8,16 * * 1-5",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every 15th of the month at 10am and 6pm",
      ),
      "0 10,18 15 * *",
    );
  });

  await t.step("month and day combinations", () => {
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every January 1st",
      ),
      "0 0 1 1 *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every December 25th",
      ),
      "0 0 25 12 *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every January 1st at 12am",
      ),
      "0 0 1 1 *",
    );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every December 25th at 8am",
      ),
      "0 8 25 12 *",
    );
  });

  await t.step("time ranges", () => {
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every hour from 9am to 5pm",
      ),
      "0 9-17 * * *",
    );

    // TODO: fix this test
    // assertEquals(
    //   getCronTabExpressionForNaturalLanguageSchedule(
    //     "every 30 minutes from 9am to 5pm",
    //   ),
    //   "*/30 9-17 * * *",
    // );
    assertEquals(
      getCronTabExpressionForNaturalLanguageSchedule(
        "every weekday every hour from 9am to 5pm",
      ),
      "0 9-17 * * 1-5",
    );
  });
});

/**
 * Test suite for the getNaturalLanguageScheduleForCronTabExpression function
 *
 * Tests various categories of cron expressions to ensure they are correctly
 * converted to natural language descriptions.
 */

// Basic patterns
Deno.test("Basic pattern - every minute", () => {
  const result = getNaturalLanguageScheduleForCronTabExpression(
    "* * * * *",
  );
  assertEquals(result, "Every minute");
});

Deno.test("Basic pattern - every N minutes", () => {
  const result = getNaturalLanguageScheduleForCronTabExpression(
    "*/15 * * * *",
  );
  assertEquals(result, "Every 15 minutes");
});

Deno.test("Basic pattern - every hour", () => {
  const result = getNaturalLanguageScheduleForCronTabExpression(
    "0 * * * *",
  );
  assertEquals(result, "Every hour");
});

Deno.test("Basic pattern - every N hours", () => {
  const result = getNaturalLanguageScheduleForCronTabExpression(
    "0 */2 * * *",
  );
  assertEquals(result, "Every 2 hours");
});

// Time-specific patterns
Deno.test("Time-specific pattern - every day at 12 AM", () => {
  const result = getNaturalLanguageScheduleForCronTabExpression(
    "0 0 * * *",
  );
  assertEquals(result, "At 12:00 AM daily");
});

Deno.test("Time-specific pattern - every day at 12 PM", () => {
  const result = getNaturalLanguageScheduleForCronTabExpression(
    "0 12 * * *",
  );
  assertEquals(result, "At 12:00 PM daily");
});

Deno.test("Time-specific pattern - every day at specific time (AM)", () => {
  const result = getNaturalLanguageScheduleForCronTabExpression(
    "30 9 * * *",
  );
  assertEquals(result, "At 9:30 AM daily");
});

Deno.test("Time-specific pattern - every day at specific time (PM)", () => {
  const result = getNaturalLanguageScheduleForCronTabExpression(
    "45 15 * * *",
  );
  assertEquals(result, "At 3:45 PM daily");
});

// Day of week patterns
Deno.test("Day of week pattern - every Monday at 12 AM", () => {
  const result = getNaturalLanguageScheduleForCronTabExpression(
    "0 0 * * 1",
  );
  assertEquals(result, "At 12:00 AM on Monday");
});

Deno.test("Day of week pattern - every Sunday at specific time", () => {
  const result = getNaturalLanguageScheduleForCronTabExpression(
    "30 10 * * 0",
  );
  assertEquals(result, "At 10:30 AM on Sunday");
});

Deno.test("Day of week pattern - weekdays at specific time", () => {
  const result = getNaturalLanguageScheduleForCronTabExpression(
    "0 8 * * 1-5",
  );
  assertEquals(result, "At 8:00 AM on weekdays");
});

Deno.test("Day of week pattern - weekdays at specific time", () => {
  const result = getNaturalLanguageScheduleForCronTabExpression(
    "0 13 * * 2-4",
  );
  assertEquals(result, "At 1:00 PM on Tuesday through Thursday");
});

Deno.test("Day of week pattern - weekends at specific time", () => {
  const result = getNaturalLanguageScheduleForCronTabExpression(
    "0 10 * * 0,6",
  );
  assertEquals(result, "At 10:00 AM on weekends");
});

Deno.test("Day of week pattern - multiple specific days", () => {
  const result = getNaturalLanguageScheduleForCronTabExpression(
    "0 9 * * 1,3,5",
  );
  assertEquals(result, "At 9:00 AM on Monday, Wednesday, and Friday");
});

// Month patterns
Deno.test("Month pattern - specific day every month", () => {
  const result = getNaturalLanguageScheduleForCronTabExpression(
    "0 12 15 * *",
  );
  assertEquals(result, "At 12:00 PM on day 15 of every month");
});

Deno.test("Month pattern - specific month and day", () => {
  const result = getNaturalLanguageScheduleForCronTabExpression(
    "0 0 1 1 *",
  );
  assertEquals(result, "At 12:00 AM on January 1");
});

Deno.test("Month pattern - multiple specific months", () => {
  // This will test the fallback generic description
  const result = getNaturalLanguageScheduleForCronTabExpression(
    "0 12 1 3,6,9,12 *",
  );
  assertEquals(
    result,
    "At 12:00 PM on day 1 in March, June, September, and December",
  );
});

Deno.test("Month pattern - month range", () => {
  // This will test the fallback generic description
  const result = getNaturalLanguageScheduleForCronTabExpression(
    "0 12 1 6-8 *",
  );
  assertEquals(
    result,
    "At 12:00 PM on day 1 from June through August",
  );
});

// Complex patterns with multiple components
Deno.test("Complex pattern - specific day and month with time", () => {
  const result = getNaturalLanguageScheduleForCronTabExpression(
    "0 9 25 12 *",
  );
  assertEquals(result, "At 9:00 AM on December 25");
});

Deno.test("Complex pattern - specific days of week with intervals", () => {
  // This will test the fallback generic description
  const result = getNaturalLanguageScheduleForCronTabExpression(
    "*/30 9-17 * * 1-5",
  );
  assertEquals(
    result,
    "Every 30 minutes from 9:00 AM to 5:00 PM on weekdays",
  );
});

Deno.test("Complex pattern - specific time on last day of month", () => {
  // This will test the fallback generic description since the function doesn't
  // specifically handle expressions like L for "last day of month"
  const result = getNaturalLanguageScheduleForCronTabExpression(
    "0 23 L * *",
  );
  assertEquals(
    result,
    "At 11:00 PM on the last day of every month",
  );
});

// Invalid pattern tests
Deno.test("Invalid pattern - wrong number of fields", () => {
  const result = getNaturalLanguageScheduleForCronTabExpression(
    "* * * *",
  );
  assertIsError(result);
});

Deno.test("Invalid pattern - empty string", () => {
  const result = getNaturalLanguageScheduleForCronTabExpression("");
  assertIsError(result);
});
