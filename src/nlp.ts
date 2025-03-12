/**
 * This module provides utilities for working with natural language schedules and cron expressions.
 *
 * getNaturalLanguageScheduleForCronTabExpression() converts a cron expression into a human-readable schedule description.
 * getCronTabExpressionForNaturalLanguageSchedule() converts a natural language schedule description into a cron expression.
 *
 * @module
 */

export type CronTabExpression = string;
export type NaturalLanguageSchedule = string;

// Time-related type definitions
export type TimeFormat = "12h" | "24h";
export interface TimeObject {
  hour: number;
  minute: number;
  period?: "am" | "pm";
}

// Constants
// Days of the week mapping
const DAYS_OF_WEEK = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

// Handle specific months
const MONTHS = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

// Time utilities
const TimeUtils = {
  /**
   * Converts 12-hour format to 24-hour format
   * @param hour Hour in 12-hour format
   * @param period 'am' or 'pm'
   * @returns Hour in 24-hour format
   */
  convertTo24Hour(hour: number, period: string): number {
    period = period.toLowerCase();
    if (period === "pm" && hour < 12) return hour + 12;
    if (period === "am" && hour === 12) return 0;
    return hour;
  },

  /**
   * Formats hour and minute into a readable time string (e.g., "3:00 PM")
   * @param hour Hour in 24-hour format
   * @param minute Minute
   * @returns Formatted time string
   */
  formatTime(hour: number, minute: number): string {
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour < 12 ? "AM" : "PM";
    return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
  },
};

// Pattern Matchers for different types of natural language expressions
const PatternMatchers = {
  /**
   * Matches basic time-based patterns (minute, hour, day, week, month, year)
   * @param input Normalized input string
   * @returns Matching cron expression or null if no match
   */
  matchBasicPatterns(input: string): string | null {
    if (
      input === "every minute" ||
      input === "every 1 minute" || input === "minutely"
    ) {
      return "* * * * *";
    }

    if (
      input === "every hour" || input === "every 1 hour" ||
      input === "hourly"
    ) {
      return "0 * * * *";
    }

    if (
      input === "every day" || input === "every 1 day" ||
      input === "daily"
    ) {
      return "0 0 * * *";
    }

    if (
      input === "every week" || input === "every 1 week" ||
      input === "weekly"
    ) {
      return "0 0 * * 0";
    }

    if (
      input === "every month" || input === "every 1 month" ||
      input === "monthly"
    ) {
      return "0 0 1 * *";
    }

    if (
      input === "every year" || input === "every 1 year" ||
      input === "yearly" || input === "annually"
    ) {
      return "0 0 1 1 *";
    }

    return null;
  },

  /**
   * Matches interval-based patterns (every X minutes/hours/days)
   * @param input Normalized input string
   * @returns Matching cron expression or null if no match
   */
  matchIntervalPatterns(input: string): string | null {
    const simpleMinuteInterval = input.match(/every (\d+) minutes\s*$/);
    if (simpleMinuteInterval) {
      return `*/${simpleMinuteInterval[1]} * * * *`;
    }

    const simpleHourInterval = input.match(/every (\d+) hours\s*$/);
    if (simpleHourInterval) {
      return `0 */${simpleHourInterval[1]} * * *`;
    }

    const simpleDayInterval = input.match(/every (\d+) days\s*$/);
    if (simpleDayInterval) {
      return `0 0 */${simpleDayInterval[1]} * *`;
    }

    return null;
  },

  /**
   * Matches monthly patterns with optional time specifications
   * @param input Normalized input string
   * @returns Matching cron expression or null if no match
   */
  matchMonthlyPatterns(input: string): string | null {
    // monthly with minutes and hours
    if (/^(every month|monthly) at (\d{1,2}):(\d{2})(am|pm)$/i.test(input)) {
      const matches = input.match(
        /^(every month|monthly) at (\d{1,2}):(\d{2})(am|pm)$/i,
      );
      if (!matches) return null;
      let hour = parseInt(matches[2], 10);
      const minute = parseInt(matches[3], 10);
      const period = matches[4].toLowerCase();
      hour = TimeUtils.convertTo24Hour(hour, period);
      return `${minute} ${hour} 1 * *`;
    }

    // monthly with hours
    if (/^(every month|monthly) at (\d{1,2})(am|pm)$/i.test(input)) {
      const matches = input.match(
        /^(every month|monthly) at (\d{1,2})(am|pm)$/i,
      );
      if (!matches) return null;
      let hour = parseInt(matches[2], 10);
      const period = matches[3].toLowerCase();
      hour = TimeUtils.convertTo24Hour(hour, period);
      return `0 ${hour} 1 * *`;
    }

    return null;
  },

  /**
   * Matches yearly patterns with optional time specifications
   * @param input Normalized input string
   * @returns Matching cron expression or null if no match
   */
  matchYearlyPatterns(input: string): string | null {
    const yearlyMatch = input.match(
      /^(every year|yearly|annually) at (\d{1,2})(?::(\d{2}))?\s?(am|pm)?$/i,
    );
    if (yearlyMatch) {
      const period = yearlyMatch[4]?.toLowerCase();
      let hour = parseInt(yearlyMatch[2], 10);
      const minute = parseInt(yearlyMatch[3] ?? "0", 10);

      if (period) {
        hour = TimeUtils.convertTo24Hour(hour, period);
      }

      return `${minute} ${hour} 1 1 *`;
    }

    return null;
  },

  /**
   * Matches time range patterns (from X to Y)
   * @param input Normalized input string
   * @returns Partial cron expression components or null if no match
   */
  matchTimeRangePatterns(
    input: string,
  ): { minute: string; hour: string } | null {
    if (input.includes("from") && input.includes("to")) {
      const rangeMatch = input.match(
        /from (\d+)(?::(\d+))?\s*(am|pm) to (\d+)(?::(\d+))?\s*(am|pm)/i,
      );
      if (rangeMatch) {
        let startHour = parseInt(rangeMatch[1], 10);
        let endHour = parseInt(rangeMatch[4], 10);
        const startPeriod = rangeMatch[3].toLowerCase();
        const endPeriod = rangeMatch[6].toLowerCase();

        startHour = TimeUtils.convertTo24Hour(startHour, startPeriod);
        endHour = TimeUtils.convertTo24Hour(endHour, endPeriod);

        const hour = `${startHour}-${endHour}`;
        let minute = "0";

        // Check if there's an interval within the range
        if (input.includes("every 30 minutes")) {
          minute = "*/30";
        } else if (input.includes("every 15 minutes")) {
          minute = "*/15";
        } else if (input.includes("every hour")) {
          minute = "0";
        }

        return { minute, hour };
      }
    }
    return null;
  },

  /**
   * Matches day of week patterns (weekday, weekend, specific days)
   * @param input Normalized input string
   * @returns Day of week cron component or null if no match
   */
  matchDayOfWeekPatterns(input: string): string | null {
    if (input.includes("weekday")) {
      return "1-5";
    } else if (input.includes("weekend")) {
      return "0,6";
    } else {
      const days: number[] = [];
      for (const [day, value] of Object.entries(DAYS_OF_WEEK)) {
        if (input.includes(day)) {
          days.push(value);
        }
      }

      if (days.length > 0) {
        return days.sort().join(",");
      }
    }
    return null;
  },

  /**
   * Matches day of month patterns (e.g., 5th of the month)
   * @param input Normalized input string
   * @returns Day of month cron component or null if no match
   */
  matchDayOfMonthPatterns(input: string): string | null {
    if (input.includes("of the month")) {
      const dayMatch = input.match(/(\d+)(st|nd|rd|th) of the month/);
      if (dayMatch) {
        return dayMatch[1];
      }
    }
    return null;
  },

  /**
   * Matches patterns with specific months and optionally days within those months
   * @param input Normalized input string
   * @returns Object with month and day components or null if no match
   */
  matchSpecificMonthPatterns(
    input: string,
  ): { month: string; dayOfMonth?: string } | null {
    // Handle specific months (defaults to first day of the month at midnight)
    const monthMatch = input.match(
      /^every ((?:January|February|March|April|May|June|July|August|September|October|November|December)(?:,\s?(?:January|February|March|April|May|June|July|August|September|October|November|December))*)$/i,
    );

    if (monthMatch) {
      const months = monthMatch[1].split(/,\s?/).map(
        (month) => (MONTHS[month.toLowerCase() as keyof typeof MONTHS]),
      );
      return { month: months.join(","), dayOfMonth: "1" };
    }

    // Check for individual months mentioned in the input
    const monthList: number[] = [];
    let dayOfMonth: string | undefined = undefined;

    for (const [monthName, value] of Object.entries(MONTHS)) {
      if (input.includes(monthName)) {
        monthList.push(value);

        // Check for specific day in month
        const dayMatch = new RegExp(`${monthName} (\\d+)(st|nd|rd|th)`).exec(
          input,
        );
        if (dayMatch) {
          dayOfMonth = dayMatch[1];
        }
      }
    }

    if (monthList.length > 0) {
      const month = monthList.length === 1
        ? monthList[0].toString()
        : monthList.sort().join(",");

      return { month, dayOfMonth };
    }

    return null;
  },

  /**
   * Matches time specifications with the "at" keyword
   * @param input Normalized input string
   * @returns Object with hour and minute components or null if no match
   */
  matchTimeWithAtPatterns(
    input: string,
  ): { hour: string; minute: string } | null {
    if (input.includes("at")) {
      // Extract times (e.g., 2pm, 3:30am)
      const timeRegex = /(\d+)(?::(\d+))?\s*(am|pm)/gi;
      const times: { hour: number; minute: number }[] = [];
      let match;

      while ((match = timeRegex.exec(input)) !== null) {
        let hour = parseInt(match[1], 10);
        const minute = match[2] ? parseInt(match[2], 10) : 0;
        const period = match[3].toLowerCase();

        hour = TimeUtils.convertTo24Hour(hour, period);

        times.push({ hour, minute });
      }

      if (times.length === 1) {
        return {
          minute: times[0].minute.toString(),
          hour: times[0].hour.toString(),
        };
      } else if (times.length > 1) {
        // Only supporting same minute for multiple hours
        return {
          minute: times[0].minute.toString(),
          hour: times.map((t) => t.hour).join(","),
        };
      }
    }
    return null;
  },
};

/**
 * Converts a natural language schedule description into a cron tab expression.
 *
 * @param input - A natural language string describing a schedule (e.g., "every day at 3pm", "monthly on the 1st")
 * @returns A valid cron tab expression corresponding to the natural language description
 *
 * @example
 * ```ts
 * getCronTabExpressionForNaturalLanguageSchedule("every day at 3pm")
 * // Returns: "0 15 * * *"
 *
 * getCronTabExpressionForNaturalLanguageSchedule("monthly on the 1st")
 * // Returns: "0 0 1 * *"
 * ```
 *
 * @throws {Error} If the natural language input cannot be parsed into a valid cron expression
 */
export function getCronTabExpressionForNaturalLanguageSchedule(
  input: NaturalLanguageSchedule,
): CronTabExpression {
  // Normalize input
  const normalizedInput = input.toLowerCase().trim().replace(/\s+/g, " ");

  // Try matching basic patterns
  const basicPattern = PatternMatchers.matchBasicPatterns(normalizedInput);
  if (basicPattern) {
    return basicPattern;
  }

  // Try matching interval patterns
  const intervalPattern = PatternMatchers.matchIntervalPatterns(
    normalizedInput,
  );
  if (intervalPattern) {
    return intervalPattern;
  }

  // Try matching monthly patterns
  const monthlyPattern = PatternMatchers.matchMonthlyPatterns(normalizedInput);
  if (monthlyPattern) {
    return monthlyPattern;
  }

  // Try matching yearly patterns
  const yearlyPattern = PatternMatchers.matchYearlyPatterns(normalizedInput);
  if (yearlyPattern) {
    return yearlyPattern;
  }

  // Handle more complex patterns
  return parseComplexPattern(normalizedInput);
}

/**
 * Parses a natural language string into a cron pattern.
 *
 * Processes various time-related patterns in natural language and converts them
 * into a standard 5-part cron expression (minute hour dayOfMonth month dayOfWeek).
 *
 * It checks for different types of patterns in the following order:
 * 1. Interval patterns
 * 2. Monthly patterns
 * 3. Yearly patterns
 * 4. Day of week patterns
 * 5. Day of month patterns
 * 6. Specific month patterns
 * 7. Time patterns with "at"
 * 8. Time range patterns
 *
 * @param input - A natural language string describing a schedule (e.g., "every Monday at 3pm")
 * @returns A cron pattern string in the format "minute hour dayOfMonth month dayOfWeek"
 *
 * @example
 * parseComplexPattern("every Monday at 3pm") // Returns "0 15 * * 1"
 */
function parseComplexPattern(input: string): string {
  // Default values
  let minute = "0";
  let hour = "0";
  let dayOfMonth = "*";
  let month = "*";
  let dayOfWeek = "*";

  // Try interval patterns first
  const intervalPattern = PatternMatchers.matchIntervalPatterns(input);
  if (intervalPattern) {
    return intervalPattern;
  }

  // Try monthly patterns
  const monthlyPattern = PatternMatchers.matchMonthlyPatterns(input);
  if (monthlyPattern) {
    return monthlyPattern;
  }

  // Try yearly patterns
  const yearlyPattern = PatternMatchers.matchYearlyPatterns(input);
  if (yearlyPattern) {
    return yearlyPattern;
  }

  // Try to match day of week patterns
  const dayOfWeekPattern = PatternMatchers.matchDayOfWeekPatterns(input);
  if (dayOfWeekPattern) {
    dayOfWeek = dayOfWeekPattern;
  }

  // Try to match day of month patterns
  const dayOfMonthPattern = PatternMatchers.matchDayOfMonthPatterns(input);
  if (dayOfMonthPattern) {
    dayOfMonth = dayOfMonthPattern;
  }

  // Try to match specific month patterns
  const monthPattern = PatternMatchers.matchSpecificMonthPatterns(input);
  if (monthPattern) {
    month = monthPattern.month;
    // Only update dayOfMonth if it was provided and not already set by day matcher
    if (monthPattern.dayOfMonth && dayOfMonth === "*") {
      dayOfMonth = monthPattern.dayOfMonth;
    }
  }

  // Try to match time patterns with "at"
  const timeWithAtPattern = PatternMatchers.matchTimeWithAtPatterns(input);
  if (timeWithAtPattern) {
    hour = timeWithAtPattern.hour;
    minute = timeWithAtPattern.minute;
  }

  // Try to match time range patterns
  const timeRangePattern = PatternMatchers.matchTimeRangePatterns(input);
  if (timeRangePattern) {
    hour = timeRangePattern.hour;
    minute = timeRangePattern.minute;
  }

  return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
}

/**
 * Converts a cron expression into a human-readable schedule description.
 *
 * @param expression - A standard cron expression with 5 fields (minute, hour, day of month, month, day of week)
 * @returns A natural language description of the schedule or an Error if the expression is invalid
 *
 * @example
 * ```ts
 * getNaturalLanguageScheduleForCronTabExpression("* * * * *")
 * // Returns: "Every minute"
 *
 * getNaturalLanguageScheduleForCronTabExpression("0 12 * * 1-5")
 * // Returns: "At 12:00 PM on weekdays"
 *
 * getNaturalLanguageScheduleForCronTabExpression("0 9 15,30 1,6,12 *")
 * // Returns: "At 9:00 AM on day 15 and 30 in January, June, and December"
 * ```
 *
 * @remarks
 * - Handles standard cron expression format with 5 fields
 * - Supports specific values, ranges (-), lists (,), steps (/), and wildcards (*)
 * - Special handling for common patterns like "every minute", "every hour", etc.
 * - Provides descriptive output for time ranges, weekdays/weekends, and monthly schedules
 *
 * @throws {Error} When the expression is empty or doesn't contain exactly 5 fields
 */
export function getNaturalLanguageScheduleForCronTabExpression(
  expression: CronTabExpression,
): NaturalLanguageSchedule | Error {
  if (!expression || expression.trim() === "") {
    return new Error("Cron expression cannot be empty");
  }

  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    return new Error("Invalid cron expression format. Expected 5 fields.");
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Handle common patterns first
  if (
    minute === "*" && hour === "*" && dayOfMonth === "*" && month === "*" &&
    dayOfWeek === "*"
  ) {
    return "Every minute";
  }

  if (
    minute.startsWith("*/") && hour === "*" && dayOfMonth === "*" &&
    month === "*" && dayOfWeek === "*"
  ) {
    const interval = parseInt(minute.substring(2), 10);
    return `Every ${interval} minutes`;
  }

  if (
    minute === "0" && hour === "*" && dayOfMonth === "*" && month === "*" &&
    dayOfWeek === "*"
  ) {
    return "Every hour";
  }

  if (
    minute === "0" && hour.startsWith("*/") && dayOfMonth === "*" &&
    month === "*" && dayOfWeek === "*"
  ) {
    const interval = parseInt(hour.substring(2), 10);
    return `Every ${interval} hours`;
  }

  if (
    minute === "0" && hour === "0" && dayOfMonth === "*" && month === "*" &&
    dayOfWeek === "*"
  ) {
    return "At 12:00 AM daily";
  }

  if (
    minute === "0" && hour === "12" && dayOfMonth === "*" && month === "*" &&
    dayOfWeek === "*"
  ) {
    return "At 12:00 PM daily";
  }

  // Format time
  // Use the TimeUtils.formatTime function for consistent time formatting

  // Build comprehensive description
  let desc = "";

  // Time part
  if (minute !== "*") {
    // Handle interval with time ranges
    const minuteNum = parseInt(minute, 10);

    if (hour !== "*") {
      if (hour.includes(",")) {
        // Multiple specific hours
        const hours = hour.split(",").map((h) => parseInt(h, 10));
        const times = hours.map((h) => TimeUtils.formatTime(h, minuteNum));
        desc = `At ${times.join(" and ")}`;
      } else if (hour.includes("-")) {
        // Hour range
        const [startHour, endHour] = hour.split("-").map((h) =>
          parseInt(h, 10)
        );
        if (minute.startsWith("*/")) {
          const interval = parseInt(minute.substring(2), 10);
          desc = `Every ${interval} minutes from ${
            TimeUtils.formatTime(startHour, 0)
          } to ${TimeUtils.formatTime(endHour, 0)}`;
        } else {
          desc = `At ${minuteNum} minutes past the hour, from ${
            TimeUtils.formatTime(startHour, 0)
          } to ${TimeUtils.formatTime(endHour, 0)}`;
        }
      } else {
        // Specific time
        const hourNum = parseInt(hour, 10);
        desc = `At ${TimeUtils.formatTime(hourNum, minuteNum)}`;
      }
    }
  }

  // Day of week part
  if (dayOfWeek !== "*") {
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    if (dayOfWeek === "1-5") {
      desc += " on weekdays";
    } else if (dayOfWeek === "0,6" || dayOfWeek === "6,0") {
      desc += " on weekends";
    } else if (dayOfWeek.includes(",")) {
      const days = dayOfWeek.split(",").map((d) => parseInt(d, 10));
      const dayNames = days.map((d) => daysOfWeek[d]);

      if (dayNames.length === 2) {
        desc += ` on ${dayNames[0]} and ${dayNames[1]}`;
      } else {
        const lastDay = dayNames.pop();
        desc += ` on ${dayNames.join(", ")}, and ${lastDay}`;
      }
    } else if (dayOfWeek.includes("-")) {
      const [start, end] = dayOfWeek.split("-").map((d) => parseInt(d, 10));
      desc += ` on ${daysOfWeek[start]} through ${daysOfWeek[end]}`;
    } else {
      const dayNum = parseInt(dayOfWeek, 10);
      desc += ` on ${daysOfWeek[dayNum]}`;
    }
  } else if (dayOfMonth !== "*") {
    // Day of month part
    if (dayOfMonth === "L") {
      desc += " on the last day of every month";
    } else if (dayOfMonth.includes(",")) {
      const days = dayOfMonth.split(",").map((d) => parseInt(d, 10));
      if (days.length === 2) {
        desc += ` on day ${days[0]} and ${days[1]} of every month`;
      } else {
        const lastDay = days.pop();
        desc += ` on day ${days.join(", ")}, and ${lastDay} of every month`;
      }
    } else {
      const dayNum = parseInt(dayOfMonth, 10);
      if (month !== "*") {
        // Month part
        const months = [
          "",
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

        if (month.includes(",")) {
          const monthNums = month.split(",").map((m) => parseInt(m, 10));
          const monthNames = monthNums.map((m) => months[m]);

          if (monthNames.length === 2) {
            desc += ` on day ${dayNum} in ${monthNames[0]} and ${
              monthNames[1]
            }`;
          } else {
            const lastMonth = monthNames.pop();
            desc += ` on day ${dayNum} in ${
              monthNames.join(", ")
            }, and ${lastMonth}`;
          }
        } else if (month.includes("-")) {
          const [startMonth, endMonth] = month.split("-").map((m) =>
            parseInt(m, 10)
          );
          desc += ` on day ${dayNum} from ${months[startMonth]} through ${
            months[endMonth]
          }`;
        } else {
          const monthNum = parseInt(month, 10);
          desc += ` on ${months[monthNum]} ${dayNum}`;
        }
      } else {
        desc += ` on day ${dayNum} of every month`;
      }
    }
  } else if (desc === "") {
    desc = "Every minute";
  } else {
    desc += " daily";
  }

  return desc.trim();
}
