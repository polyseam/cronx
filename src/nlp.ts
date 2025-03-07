export type CronTabExpression = string;
export type NaturalLanguageSchedule = string;
export type TimeFormat = "12h" | "24h";

export type CronxConfig = {
  timeFormat: TimeFormat;
  useOxfordComma: boolean;
};

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const DAYS_OF_WEEK_MAP: Record<string, number> = {
  "sunday": 0,
  "monday": 1,
  "tuesday": 2,
  "wednesday": 3,
  "thursday": 4,
  "friday": 5,
  "saturday": 6,
  "weekday": -1, // Special case
  "weekend": -2, // Special case
};

const MONTHS = [
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
] as const;

const MONTHS_MAP: Record<string, number> = {
  "january": 1,
  "february": 2,
  "march": 3,
  "april": 4,
  "may": 5,
  "june": 6,
  "july": 7,
  "august": 8,
  "september": 9,
  "october": 10,
  "november": 11,
  "december": 12,
};
export class CronxNlp {
  config: CronxConfig;

  constructor(config: CronxConfig) {
    this.config = config;
  }

  getCronTabExpressionForNaturalLanguageSchedule(
    input: NaturalLanguageSchedule,
  ): CronTabExpression {
    // Normalize input
    const normalizedInput = input.toLowerCase().trim();

    // Check for basic patterns first
    if (
      normalizedInput === "every minute" ||
      normalizedInput === "every 1 minute" ||
      normalizedInput === "minutely"
    ) {
      return "* * * * *";
    }

    if (
      normalizedInput === "every hour" ||
      normalizedInput === "every 1 hour" ||
      normalizedInput === "hourly"
    ) {
      return "0 * * * *";
    }

    if (
      normalizedInput === "every day" ||
      normalizedInput === "every 1 day" ||
      normalizedInput === "daily"
    ) {
      return "0 0 * * *";
    }

    if (
      normalizedInput === "every week" ||
      normalizedInput === "every week" ||
      normalizedInput === "every 1 week" ||
      normalizedInput === "weekly"
    ) {
      return "0 0 * * 0";
    }

    if (
      normalizedInput === "every month" ||
      normalizedInput === "every 1 month" ||
      normalizedInput === "monthly"
    ) {
      return "0 0 1 * *";
    }

    if (
      normalizedInput === "every year" ||
      normalizedInput === "yearly" ||
      normalizedInput === "annually"
    ) {
      return "0 0 1 1 *";
    }

    // Check for minute intervals
    const minuteIntervalMatch = normalizedInput.match(/every (\d+) minutes?/);
    if (minuteIntervalMatch) {
      const interval = minuteIntervalMatch[1];
      return `*/${interval} * * * *`;
    }

    // Check for hour intervals
    const hourIntervalMatch = normalizedInput.match(/every (\d+) hours?/);
    if (hourIntervalMatch) {
      const interval = hourIntervalMatch[1];
      return `0 */${interval} * * *`;
    }

    // Check for day intervals
    const dayIntervalMatch = normalizedInput.match(/every (\d+) days?/);
    if (dayIntervalMatch) {
      const interval = dayIntervalMatch[1];
      return `0 0 */${interval} * *`;
    }

    // Check for specific day of the week
    for (const [dayName, dayIndex] of Object.entries(DAYS_OF_WEEK_MAP)) {
      if (normalizedInput.startsWith(`every ${dayName}`)) {
        // Special cases
        if (dayIndex === -1) { // Weekday
          return this.handleSpecificTimeOfDay(normalizedInput, "0 0 * * 1-5");
        }
        if (dayIndex === -2) { // Weekend
          return this.handleSpecificTimeOfDay(normalizedInput, "0 0 * * 0,6");
        }

        return this.handleSpecificTimeOfDay(
          normalizedInput,
          `0 0 * * ${dayIndex}`,
        );
      }
    }

    // Check for specific month
    for (const [monthName, monthIndex] of Object.entries(MONTHS_MAP)) {
      if (normalizedInput.startsWith(`every ${monthName}`)) {
        return this.handleSpecificTimeOfDay(
          normalizedInput,
          `0 0 1 ${monthIndex} *`,
        );
      }
    }
    // Check for multiple days of the week
    // Pattern for "Monday, Wednesday, Friday" style
    const daysPattern =
      /every\s+((?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:(?:,|,?\s+and)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))+)/i;
    const matchDays = normalizedInput.match(daysPattern);

    if (matchDays) {
      // Extract all days mentioned in the input
      const daysList: number[] = [];
      // Look specifically for day names to avoid other words in the input
      const daysMatches = normalizedInput.match(
        /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      );

      if (daysMatches) {
        for (const day of daysMatches) {
          // For cron expressions, we need to map Sunday=0, Monday=1, etc.
          const index = DAYS_OF_WEEK_MAP[day.toLowerCase()];
          if (index >= 0 && !daysList.includes(index)) {
            daysList.push(index);
          }
        }
      }
      if (daysList.length > 0) {
        // Sort days of week chronologically
        daysList.sort((a, b) => a - b);
        const daysString = daysList.join(",");
        return this.handleSpecificTimeOfDay(
          normalizedInput,
          `0 0 * * ${daysString}`,
        );
      }

      // Check for weekend days specifically
      if (
        normalizedInput.includes("saturday") &&
        normalizedInput.includes("sunday")
      ) {
        return this.handleSpecificTimeOfDay(normalizedInput, "0 0 * * 0,6");
      }

      // Fallback to the previous implementation for other cases
      if (!matchDays) {
        const daysList = Object.entries(DAYS_OF_WEEK_MAP)
          .filter(([name, _]) =>
            normalizedInput.includes(name) && name !== "weekday" &&
            name !== "weekend"
          )
          .map(([_, index]) => index);

        if (daysList.length > 1) {
          // Sort days of week chronologically
          daysList.sort((a, b) => a - b);
          const daysString = daysList.join(",");
          return this.handleSpecificTimeOfDay(
            normalizedInput,
            `0 0 * * ${daysString}`,
          );
        }
      }

      // Check for day of month
      const dayOfMonthMatch = normalizedInput.match(
        /every (\d+)(st|nd|rd|th) of the month/,
      );
      if (dayOfMonthMatch) {
        const day = dayOfMonthMatch[1];
        return this.handleSpecificTimeOfDay(normalizedInput, `0 0 ${day} * *`);
      }

      // Check for specific month and day combinations
      const monthDayMatch = normalizedInput.match(
        new RegExp(
          `every (${Object.keys(MONTHS_MAP).join("|")}) (\\d+)(st|nd|rd|th)`,
        ),
      );
      if (monthDayMatch) {
        const month = MONTHS_MAP[monthDayMatch[1]];
        const day = monthDayMatch[2];
        return this.handleSpecificTimeOfDay(
          normalizedInput,
          `0 0 ${day} ${month} *`,
        );
      }
      // Check for multiple months
      // Pattern for "January, April, July, October" style
      const monthsPattern =
        /every\s+((?:january|february|march|april|may|june|july|august|september|october|november|december)(?:,\s*(?:january|february|march|april|may|june|july|august|september|october|november|december))+(?:\s*(?:and)\s*(?:january|february|march|april|may|june|july|august|september|october|november|december))?)/i;
      const matchMonths = normalizedInput.match(monthsPattern);

      if (matchMonths) {
        // Extract all months mentioned in the input
        const monthsList: number[] = [];
        const monthsMatches = normalizedInput.match(
          /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi,
        );

        // Check for specific day mention after multiple months (e.g., "every March, June, September, December 1st")
        const specificDayAfterMonths = normalizedInput.match(
          /(\d+)(?:st|nd|rd|th)/i,
        );
        const hasSpecificDay = specificDayAfterMonths !== null;

        if (monthsMatches) {
          for (const month of monthsMatches) {
            const index = MONTHS_MAP[month.toLowerCase()];
            if (!monthsList.includes(index)) {
              monthsList.push(index);
            }
          }
        }

        if (monthsList.length > 0) {
          // Sort months chronologically
          monthsList.sort((a, b) => a - b);
          const monthsString = monthsList.join(",");
          // If a specific day is mentioned, use that instead of the default "1"
          const dayToUse = hasSpecificDay ? specificDayAfterMonths![1] : "1";
          return this.handleSpecificTimeOfDay(
            normalizedInput,
            `0 0 ${dayToUse} ${monthsString} *`,
          );
        }
      }

      // Fallback to the previous implementation for other cases
      const monthsList = Object.entries(MONTHS_MAP)
        .filter(([name, _]) => normalizedInput.includes(name))
        .map(([_, index]) => index);

      if (monthsList.length > 1) {
        // Sort months chronologically
        monthsList.sort((a, b) => a - b);
        const monthsString = monthsList.join(",");
        return this.handleSpecificTimeOfDay(
          normalizedInput,
          `0 0 1 ${monthsString} *`,
        );
      }
      // Check for specific month and day combinations like "December 25th"
      const specificMonthDayMatch = normalizedInput.match(
        new RegExp(
          `\b(${
            Object.keys(MONTHS_MAP).join("|")
          })[\s,]+(\d+)(?:st|nd|rd|th)\b`,
          "i",
        ),
      );
      if (specificMonthDayMatch) {
        const month = MONTHS_MAP[specificMonthDayMatch[1].toLowerCase()];
        const day = specificMonthDayMatch[2];
        return this.handleSpecificTimeOfDay(
          normalizedInput,
          `0 0 ${day} ${month} *`,
        );
      }
      // Check for time ranges
      // Check for various time range formats
      const hourRangeMatch = normalizedInput.match(
        /from (\d+)(am|pm) to (\d+)(am|pm)/i,
      );

      // Also handle "every hour from 9am to 5pm" pattern
      const hourRangePattern2 = normalizedInput.match(
        /every (hour|minute|(\d+) minutes?) from (\d+)(am|pm) to (\d+)(am|pm)/i,
      );

      // Also handle "9am to 5pm" pattern without "from"
      const simpleRangePattern = normalizedInput.match(
        /(\d+)(am|pm) to (\d+)(am|pm)/i,
      );

      if (hourRangeMatch || hourRangePattern2 || simpleRangePattern) {
        let startHour: number = 0;
        let endHour: number = 0;
        let startAmPm: string = "";
        let endAmPm: string = "";

        if (hourRangeMatch) {
          startHour = parseInt(hourRangeMatch[1]);
          endHour = parseInt(hourRangeMatch[3]);
          startAmPm = hourRangeMatch[2].toLowerCase();
          endAmPm = hourRangeMatch[4].toLowerCase();
        } else if (hourRangePattern2) {
          startHour = parseInt(hourRangePattern2[3]);
          endHour = parseInt(hourRangePattern2[5]);
          startAmPm = hourRangePattern2[4].toLowerCase();
          endAmPm = hourRangePattern2[6].toLowerCase();
        } else if (simpleRangePattern) {
          startHour = parseInt(simpleRangePattern[1]);
          endHour = parseInt(simpleRangePattern[3]);
          startAmPm = simpleRangePattern[2].toLowerCase();
          endAmPm = simpleRangePattern[4].toLowerCase();
        } else {
          // This shouldn't happen due to the if condition above, but to satisfy TypeScript
          return "0 0 * * *";
        }

        // Convert to 24-hour format
        if (startAmPm === "pm" && startHour !== 12) startHour += 12;
        if (startAmPm === "am" && startHour === 12) startHour = 0;
        if (endAmPm === "pm" && endHour !== 12) endHour += 12;
        if (endAmPm === "am" && endHour === 12) endHour = 0;

        // For time ranges, we need to handle specific cron expressions
        let cronExpression = `0 ${startHour}-${endHour} * * *`;

        // If there's a specific minute interval mentioned
        if (normalizedInput.includes("every minute")) {
          cronExpression = `* ${startHour}-${endHour} * * *`;
        } else if (normalizedInput.includes("every 30 minutes")) {
          cronExpression = `*/30 ${startHour}-${endHour} * * *`;
        } else if (normalizedInput.includes("every 15 minutes")) {
          cronExpression = `*/15 ${startHour}-${endHour} * * *`;
        } else if (normalizedInput.includes("every 5 minutes")) {
          cronExpression = `*/5 ${startHour}-${endHour} * * *`;
        }

        // Detect if we need to handle hour range differently - when start > end
        if (startHour > endHour) {
          // For "wrapping around" ranges like 10PM to 6AM, we need to handle this differently
          // This is a limitation of cron, might need multiple expressions
          cronExpression = cronExpression.replace(
            `${startHour}-${endHour}`,
            `${startHour}-23,0-${endHour}`,
          );
        }

        // Check if there are specific days
        if (normalizedInput.includes("weekday")) {
          cronExpression = cronExpression.replace("* * *", "* * 1-5");
        }

        return cronExpression;
      }

      // Check for specific time on last day of month ("L")
      const lastDayTimeMatch = normalizedInput.match(
        /last day of (?:the )?month at (.+)/i,
      );
      if (lastDayTimeMatch) {
        const timePart = lastDayTimeMatch[1];
        const { hour, minute } = this.parseTime(timePart);
        if (hour !== null) {
          return `${minute || 0} ${hour} L * *`;
        }
        return "0 0 L * *"; // Default to midnight
      }
      // Fallback to a generically valid cron expression
      return "* * * * *";
    }
    
    // Check for daily with specific times
    if (
      normalizedInput.includes("every day at") ||
      normalizedInput.includes("daily at")
    ) {
      return this.handleDailyWithTime(normalizedInput);
    }
    
    // Default return to ensure all code paths return a value
    return "* * * * *";
  }

  private handleSpecificTimeOfDay(input: string, baseCron: string): string {
    if (input.includes(" at ")) {
      // Extract the time part after "at"
      const timeMatch = input.match(/ at (.+)$/);

      if (timeMatch) {
        const timePart = timeMatch[1];

        // Handle multiple times (e.g., "9am and 5pm")
        if (timePart.includes(" and ")) {
          const times = timePart.split(" and ");
          const hours: number[] = [];
          let minute: number | null = 0;

          for (const time of times) {
            const timeInfo = this.parseTime(time);
            if (timeInfo.hour !== null) {
              hours.push(timeInfo.hour);
              // Use the minute from the first time that has one
              if (
                minute === 0 && timeInfo.minute !== null &&
                timeInfo.minute !== 0
              ) {
                minute = timeInfo.minute;
              }
            }
          }

          if (hours.length > 0) {
            // Split the cron expression to avoid modifying the day-of-week field
            const parts = baseCron.split(" ");
            parts[0] = minute?.toString() || "0";
            parts[1] = hours.join(",");
            return parts.join(" ");
          }
        } else {
          // Handle single time
          const { hour, minute } = this.parseTime(timePart);
          if (hour !== null) {
            // Split the cron expression and update the hour and minute
            // while preserving the other parts (especially day-of-week)
            const parts = baseCron.split(" ");
            parts[0] = (minute || 0).toString();
            parts[1] = hour.toString();
            return parts.join(" ");
          }
        }
      }
    }

    return baseCron;
  }

  private handleDailyWithTime(input: string): string {
    // Extract the time part after "at"
    const timeMatch = input.match(/ at (.+)$/);
    if (timeMatch) {
      const timePart = timeMatch[1];

      // Handle multiple times
      if (timePart.includes(" and ")) {
        const times = timePart.split(" and ");
        const hourMinutePairs: { hour: number; minute: number }[] = [];

        for (const time of times) {
          const { hour, minute } = this.parseTime(time);
          if (hour !== null) {
            hourMinutePairs.push({ hour, minute: minute || 0 });
          }
        }

        if (hourMinutePairs.length > 0) {
          // Group by minute
          const minuteGroups: Record<number, number[]> = {};
          for (const { hour, minute } of hourMinutePairs) {
            if (!minuteGroups[minute]) {
              minuteGroups[minute] = [];
            }
            minuteGroups[minute].push(hour);
          }

          if (Object.keys(minuteGroups).length === 1) {
            // All times have the same minute
            const minute = Object.keys(minuteGroups)[0];
            const hours = minuteGroups[Number(minute)].join(",");
            return `${minute} ${hours} * * *`;
          } else {
            // Multiple different minute values - this is complex and might require multiple cron expressions
            // For simplicity, we'll just use the first pair
            const { hour, minute } = hourMinutePairs[0];
            return `${minute} ${hour} * * *`;
          }
        }
      } else {
        // Handle single time
        const { hour, minute } = this.parseTime(timePart);
        if (hour !== null) {
          return `${minute || 0} ${hour} * * *`;
        }
      }
    }

    return "0 0 * * *"; // Default to midnight if no specific time
  }

  private parseTime(
    timeStr: string,
  ): { hour: number | null; minute: number | null } {
    let hour: number | null = null;
    let minute: number | null = 0;

    // Special cases
    // Special cases
    const lowerTimeStr = timeStr.toLowerCase().trim();
    if (
      lowerTimeStr === "noon" ||
      lowerTimeStr === "12pm" ||
      lowerTimeStr === "12 pm" ||
      lowerTimeStr === "12:00pm" ||
      lowerTimeStr === "12:00 pm"
    ) {
      return { hour: 12, minute: 0 };
    }
    if (
      lowerTimeStr === "midnight" ||
      lowerTimeStr === "12am" ||
      lowerTimeStr === "12 am" ||
      lowerTimeStr === "12:00am" ||
      lowerTimeStr === "12:00 am"
    ) {
      return { hour: 0, minute: 0 };
    }
    // Parse HH:MM format
    // Parse HH:MM format
    const timeMatch = lowerTimeStr.match(/(\d+)(?::(\d+))?\s*(am|pm)?/i);
    if (timeMatch) {
      hour = parseInt(timeMatch[1]);
      if (timeMatch[2]) {
        minute = parseInt(timeMatch[2]);
      }

      // Convert to 24-hour format if needed
      const meridian = timeMatch[3]?.toLowerCase();
      if (meridian === "pm" && hour !== 12) {
        hour += 12;
      } else if (meridian === "am" && hour === 12) {
        hour = 0;
      }
    }
    return { hour, minute };
  }

  // Helper method to check if a string matches a month name (case insensitive)
  private isMonth(str: string): boolean {
    return Object.keys(MONTHS_MAP).includes(str.toLowerCase());
  }
  getNaturalLanguageScheduleForCronTabExpression(
    expression: CronTabExpression,
  ): NaturalLanguageSchedule {
    // Validate the cron expression format
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) {
      return "Invalid cron expression format";
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Handle common patterns
    if (
      minute === "*" && hour === "*" && dayOfMonth === "*" && month === "*" &&
      dayOfWeek === "*"
    ) {
      return "Every minute";
    }

    if (minute.startsWith("*/")) {
      const interval = minute.substring(2);
      if (
        hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*"
      ) {
        return `Every ${interval} minutes`;
      }
    }

    if (
      minute === "0" && hour === "*" && dayOfMonth === "*" && month === "*" &&
      dayOfWeek === "*"
    ) {
      return "Every hour at minute 0";
    }

    if (minute === "0" && hour.startsWith("*/")) {
      const interval = hour.substring(2);
      if (dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
        return `Every ${interval} hours`;
      }
    }

    // Check for specific day-of-week patterns
    if (minute === "0" && hour === "0") {
      if (dayOfMonth === "*" && month === "*") {
        if (dayOfWeek === "0") {
          return "Every Sunday at midnight";
        } else if (dayOfWeek === "1") {
          return "Every Monday at midnight";
        } else if (dayOfWeek === "2") {
          return "Every Tuesday at midnight";
        } else if (dayOfWeek === "3") {
          return "Every Wednesday at midnight";
        } else if (dayOfWeek === "4") {
          return "Every Thursday at midnight";
        } else if (dayOfWeek === "5") {
          return "Every Friday at midnight";
        } else if (dayOfWeek === "6") {
          return "Every Saturday at midnight";
        } else if (dayOfWeek === "*") {
          return "Every day at midnight";
        }
      }
    }

    // Time patterns
    if (dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
      // Specific time each day
      if (minute === "0" && hour === "12") {
        return "Every day at noon";
      } else if (minute === "0" && hour === "0") {
        return "Every day at midnight";
      } else {
        const hourNum = parseInt(hour);
        const minuteNum = parseInt(minute);
        if (!isNaN(hourNum) && !isNaN(minuteNum)) {
          return this.formatDailyTimePattern(hourNum, minuteNum);
        }
      }
    }

    // Day of week patterns with specific time
    if (dayOfMonth === "*" && month === "*" && dayOfWeek !== "*") {
      return this.handleDayOfWeekWithTime(minute, hour, dayOfWeek);
    }

    // Monthly patterns
    if (dayOfWeek === "*" && month === "*" && dayOfMonth !== "*") {
      // Check if this is "Every month at specific time" pattern (dayOfMonth = 1)
      if (dayOfMonth === "1") {
        if (minute === "0" && hour === "12") {
          return `Every month at noon`;
        } else if (minute === "0" && hour === "0") {
          return `Every month at midnight`;
        } else {
          const hourNum = parseInt(hour);
          const minuteNum = parseInt(minute);
          if (!isNaN(hourNum) && !isNaN(minuteNum)) {
            return `Every month at ${this.formatTime(hourNum, minuteNum)}`;
          }
        }
      } else if (minute === "0" && hour === "12") {
        return `On the ${
          this.ordinalSuffix(dayOfMonth)
        } day of every month at noon`;
      } else if (minute === "0" && hour === "0") {
        return `On the ${
          this.ordinalSuffix(dayOfMonth)
        } day of every month at midnight`;
      } else {
        const hourNum = parseInt(hour);
        const minuteNum = parseInt(minute);
        if (!isNaN(hourNum) && !isNaN(minuteNum)) {
          return `On the ${
            this.ordinalSuffix(dayOfMonth)
          } day of every month at ${this.formatTime(hourNum, minuteNum)}`;
        }
      }
    }

    // Yearly patterns (specific month and day)
    // Yearly patterns (specific month and day)
    if (dayOfWeek === "*" && month !== "*" && dayOfMonth !== "*") {
      if (month.match(/^\d+$/) && dayOfMonth.match(/^\d+$/)) {
        const monthIndex = parseInt(month) - 1;
        const day = parseInt(dayOfMonth);
        if (monthIndex >= 0 && monthIndex < MONTHS.length) {
          const monthName = MONTHS[monthIndex];

          // Check if this is "Every year at specific time" pattern (month = 1, day = 1)
          if (month === "1" && dayOfMonth === "1") {
            if (minute === "0" && hour === "0") {
              return `Every year on ${monthName} ${
                this.ordinalSuffix(day)
              } at midnight`;
            } else if (minute === "0" && hour === "12") {
              return `Every year on ${monthName} ${
                this.ordinalSuffix(day)
              } at noon`;
            } else {
              const hourNum = parseInt(hour);
              const minuteNum = parseInt(minute);
              if (!isNaN(hourNum) && !isNaN(minuteNum)) {
                return `Every year at ${this.formatTime(hourNum, minuteNum)}`;
              }
            }
          } else {
            const hourNum = parseInt(hour);
            const minuteNum = parseInt(minute);
            if (!isNaN(hourNum) && !isNaN(minuteNum)) {
              if (minute === "0" && hour === "0") {
                return `Every year on ${monthName} ${
                  this.ordinalSuffix(day)
                } at midnight`;
              } else if (minute === "0" && hour === "12") {
                return `Every year on ${monthName} ${
                  this.ordinalSuffix(day)
                } at noon`;
              } else {
                return `Every year on ${monthName} ${
                  this.ordinalSuffix(day)
                } at ${this.formatTime(hourNum, minuteNum)}`;
              }
            }
          }
        }
      }
    }
    // Complex patterns or fallback - generate a generic description
    return this.generateGenericDescription(
      minute,
      hour,
      dayOfMonth,
      month,
      dayOfWeek,
    );
  }

  private handleDayOfWeekWithTime(
    minute: string,
    hour: string,
    dayOfWeek: string,
  ): string {
    const hourNum = parseInt(hour);
    const minuteNum = parseInt(minute);

    if (dayOfWeek === "1-5") {
      return `Every weekday at ${this.formatTime(hourNum, minuteNum)}`;
    } else if (dayOfWeek === "0,6") {
      return `Every Saturday and Sunday at ${
        this.formatTime(hourNum, minuteNum)
      }`;
    } else if (dayOfWeek.match(/^\d$/)) {
      const dayIndex = parseInt(dayOfWeek);
      const dayName = dayIndex >= 0 && dayIndex < DAYS_OF_WEEK.length
        ? DAYS_OF_WEEK[dayIndex]
        : `Day ${dayOfWeek}`;
      return `Every ${dayName} at ${this.formatTime(hourNum, minuteNum)}`;
    } else if (dayOfWeek.includes(",")) {
      const days = dayOfWeek.split(",").map((d) => {
        const dayIndex = parseInt(d);
        return dayIndex >= 0 && dayIndex < DAYS_OF_WEEK.length
          ? DAYS_OF_WEEK[dayIndex]
          : `Day ${d}`;
      });

      if (days.length === 2) {
        return `Every ${days[0]} and ${days[1]} at ${
          this.formatTime(hourNum, minuteNum)
        }`;
      } else {
        const lastDay = days.pop();
        return `Every ${days.join(", ")}${
          this.config.useOxfordComma && days.length > 0 ? "," : ""
        } and ${lastDay} at ${this.formatTime(hourNum, minuteNum)}`;
      }
    }

    return this.generateGenericDescription(minute, hour, "*", "*", dayOfWeek);
  }

  private formatDailyTimePattern(hour: number, minute: number): string {
    return `Every day at ${this.formatTime(hour, minute)}`;
  }
  private formatTime(hour: number, minute: number): string {
    // Handle NaN cases
    if (isNaN(hour) || isNaN(minute)) {
      return "unknown time";
    }

    // Special cases for noon and midnight - handle these first consistently
    if (hour === 12 && minute === 0) {
      return "noon";
    } else if (hour === 0 && minute === 0) {
      return "midnight";
    }

    if (this.config.timeFormat === "12h") {
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;

      if (minute === 0) {
        return `${displayHour} ${period}`;
      } else {
        return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
      }
    } else {
      // 24-hour format
      if (minute === 0) {
        return `${hour}:00`;
      } else {
        return `${hour}:${minute.toString().padStart(2, "0")}`;
      }
    }
  }

  private ordinalSuffix(num: number | string): string {
    // Handle "L" as the last day of the month
    if (num === "L") {
      return "last";
    }

    // Convert to number if it's a string
    if (typeof num === "string") {
      num = parseInt(num);
    }

    const j = num % 10;
    const k = num % 100;

    if (j === 1 && k !== 11) {
      return num + "st";
    }
    if (j === 2 && k !== 12) {
      return num + "nd";
    }
    if (j === 3 && k !== 13) {
      return num + "rd";
    }
    return num + "th";
  }

  private generateGenericDescription(
    minute: string,
    hour: string,
    dayOfMonth: string,
    month: string,
    dayOfWeek: string,
  ): string {
    const description = [];

    // Minute part
    if (minute === "*") {
      description.push("Every minute");
    } else if (minute.startsWith("*/")) {
      const interval = minute.substring(2);
      description.push(`Every ${interval} minutes`);
    } else {
      description.push(`At minute ${minute}`);
    }

    // Hour part
    if (hour === "*") {
      // Already covered by minute description if we're describing every minute
      if (minute !== "*" && !minute.startsWith("*/")) {
        description.push("every hour");
      }
    } else if (hour.startsWith("*/")) {
      const interval = hour.substring(2);
      description.push(`every ${interval} hours`);
    } else if (hour.includes("-")) {
      const [start, _end] = hour.split("-").map(Number);
      description.push(`at ${this.formatTime(start, 0)}`);
    } else {
      const hourNum = parseInt(hour);
      if (!isNaN(hourNum)) {
        description.push(`at ${this.formatTime(hourNum, 0)}`);
      } else {
        description.push(`at hour ${hour}`);
      }
    }

    // Day of month part
    if (dayOfMonth !== "*") {
      if (dayOfMonth === "L") {
        description.push("on the last day of the month");
      } else if (dayOfMonth.includes(",")) {
        const days = dayOfMonth.split(",");
        const formattedDays = days.map((d) => `${this.ordinalSuffix(d)}`).join(
          ", ",
        );
        description.push(`on the ${formattedDays} days of the month`);
      } else {
        description.push(
          `on the ${this.ordinalSuffix(dayOfMonth)} day of the month`,
        );
      }
    }

    // Month part
    if (month !== "*") {
      if (month.includes(",")) {
        const months = month.split(",").map((m) => {
          const monthIndex = parseInt(m) - 1;
          return monthIndex >= 0 && monthIndex < MONTHS.length
            ? MONTHS[monthIndex]
            : `month ${m}`;
        });
        if (months.length === 2) {
          description.push(`in ${months[0]} and ${months[1]}`);
        } else {
          const lastMonth = months.pop();
          description.push(
            `in ${months.join(", ")}${
              this.config.useOxfordComma && months.length > 0 ? "," : ""
            } and ${lastMonth}`,
          );
        }
      } else if (month.includes("-")) {
        const [start, end] = month.split("-").map((m) => parseInt(m) - 1);
        const startMonth = start >= 0 && start < MONTHS.length
          ? MONTHS[start]
          : `month ${parseInt(month.split("-")[0])}`;
        const endMonth = end >= 0 && end < MONTHS.length
          ? MONTHS[end]
          : `month ${parseInt(month.split("-")[1])}`;
        description.push(`from ${startMonth} to ${endMonth}`);
      } else {
        const monthIndex = parseInt(month) - 1;
        if (monthIndex >= 0 && monthIndex < MONTHS.length) {
          description.push(`in ${MONTHS[monthIndex]}`);
        } else {
          description.push(`in month ${month}`);
        }
      }
    }

    // Day of week part
    if (dayOfWeek !== "*") {
      if (dayOfWeek === "1-5") {
        description.push("from Monday to Friday");
      } else if (dayOfWeek === "0,6") {
        description.push("on weekends");
      } else if (dayOfWeek.includes(",")) {
        const days = dayOfWeek.split(",").map((d) => {
          const dayIndex = parseInt(d);
          return dayIndex >= 0 && dayIndex < DAYS_OF_WEEK.length
            ? DAYS_OF_WEEK[dayIndex]
            : `day ${d}`;
        });

        if (days.length === 2) {
          description.push(`on ${days[0]} and ${days[1]}`);
        } else {
          const lastDay = days.pop();
          description.push(
            `on ${days.join(", ")}${
              this.config.useOxfordComma && days.length > 0 ? "," : ""
            } and ${lastDay}`,
          );
        }
      } else if (dayOfWeek.includes("-")) {
        const [start, end] = dayOfWeek.split("-").map((d) => parseInt(d));
        const startDay = start >= 0 && start < DAYS_OF_WEEK.length
          ? DAYS_OF_WEEK[start]
          : `day ${start}`;
        const endDay = end >= 0 && end < DAYS_OF_WEEK.length
          ? DAYS_OF_WEEK[end]
          : `day ${end}`;
        description.push(`from ${startDay} to ${endDay}`);
      } else {
        const dayIndex = parseInt(dayOfWeek);
        if (dayIndex >= 0 && dayIndex < DAYS_OF_WEEK.length) {
          description.push(`on ${DAYS_OF_WEEK[dayIndex]}`);
        } else {
          description.push(`on day ${dayOfWeek}`);
        }
      }
    }

    return description.join(" ");
  }
}
