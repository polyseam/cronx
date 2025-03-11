export type CronTabExpression = string;
export type NaturalLanguageSchedule = string;

// Natural language to crontab
export function getCronTabExpressionForNaturalLanguageSchedule(
  input: NaturalLanguageSchedule,
): CronTabExpression {
  // Normalize input
  const normalizedInput = input.toLowerCase().trim().replace(/\s+/g, " ");

  // Basic patterns
  if (
    normalizedInput === "every minute" ||
    normalizedInput === "every 1 minute" || normalizedInput === "minutely"
  ) {
    return "* * * * *";
  }

  if (
    normalizedInput === "every hour" || normalizedInput === "every 1 hour" ||
    normalizedInput === "hourly"
  ) {
    return "0 * * * *";
  }

  if (
    normalizedInput === "every day" || normalizedInput === "every 1 day" ||
    normalizedInput === "daily"
  ) {
    return "0 0 * * *";
  }

  if (
    normalizedInput === "every week" || normalizedInput === "every 1 week" ||
    normalizedInput === "weekly"
  ) {
    return "0 0 * * 0";
  }

  if (
    normalizedInput === "every month" || normalizedInput === "every 1 month" ||
    normalizedInput === "monthly"
  ) {
    return "0 0 1 * *";
  }

  if (
    normalizedInput === "every year" || normalizedInput === "every 1 year" ||
    normalizedInput === "yearly" || normalizedInput === "annually"
  ) {
    return "0 0 1 1 *";
  }

  // Handle more complex patterns
  return parseComplexPattern(normalizedInput);
}

function parseComplexPattern(input: string): string {
  // Default values
  let minute = "0";
  let hour = "0";
  let dayOfMonth = "*";
  let month = "*";
  let dayOfWeek = "*";

  // Parse interval patterns
  const minuteInterval = input.match(/every (\d+) minute/);
  if (minuteInterval) {
    return `*/${minuteInterval[1]} * * * *`;
  }

  const hourInterval = input.match(/every (\d+) hour/);
  if (hourInterval) {
    return `0 */${hourInterval[1]} * * *`;
  }

  const dayInterval = input.match(/every (\d+) day/);
  if (dayInterval) {
    return `0 0 */${dayInterval[1]} * *`;
  }

  // monthly with minutes and hours
  if (/^(every month|monthly) at (\d{1,2}):(\d{2})(am|pm)$/i.test(input)) {
    const matches = input.match(/^(every month|monthly) at (\d{1,2}):(\d{2})(am|pm)$/i);
    if (!matches) throw new Error("Invalid schedule format");
    let hour = parseInt(matches[2], 10);
    const minute = parseInt(matches[3], 10);
    const period = matches[4].toLowerCase();
    if (period === "pm" && hour < 12) hour += 12;
    if (hour === 12 && period === "am") hour = 0;
    return `${minute} ${hour} 1 * *`;
  }

  // monthly with hours
  if (/^(every month|monthly) at (\d{1,2})(am|pm)$/i.test(input)) {
    const matches = input.match(/^(every month|monthly) at (\d{1,2})(am|pm)$/i);
    if (!matches) throw new Error("Invalid schedule format");
    let hour = parseInt(matches[2], 10);
    const period = matches[3].toLowerCase();
    if (period === "pm" && hour < 12) hour += 12;
    if (hour === 12 && period === "am") hour = 0;
    return `0 ${hour} 1 * *`;
  }

  // Time specifications
  if (input.includes("at")) {
    // Extract times (e.g., 2pm, 3:30am)
    const timeRegex = /(\d+)(?::(\d+))?\s*(am|pm)/gi;
    const times: { hour: number; minute: number }[] = [];
    let match;

    while ((match = timeRegex.exec(input)) !== null) {
      let hour = parseInt(match[1], 10);
      const minute = match[2] ? parseInt(match[2], 10) : 0;
      const period = match[3].toLowerCase();

      if (period === "pm" && hour < 12) hour += 12;
      if (period === "am" && hour === 12) hour = 0;

      times.push({ hour, minute });
    }

    if (times.length === 1) {
      minute = times[0].minute.toString();
      hour = times[0].hour.toString();
    } else if (times.length > 1) {
      // Only supporting same minute for multiple hours
      minute = times[0].minute.toString();
      hour = times.map((t) => t.hour).join(",");
    }
  }

  // Time range (e.g., from 9am to 5pm)
  if (input.includes("from") && input.includes("to")) {
    const rangeMatch = input.match(
      /from (\d+)(?::(\d+))?\s*(am|pm) to (\d+)(?::(\d+))?\s*(am|pm)/i,
    );
    if (rangeMatch) {
      let startHour = parseInt(rangeMatch[1], 10);
      let endHour = parseInt(rangeMatch[4], 10);
      const startPeriod = rangeMatch[3].toLowerCase();
      const endPeriod = rangeMatch[6].toLowerCase();

      if (startPeriod === "pm" && startHour < 12) startHour += 12;
      if (startPeriod === "am" && startHour === 12) startHour = 0;
      if (endPeriod === "pm" && endHour < 12) endHour += 12;
      if (endPeriod === "am" && endHour === 12) endHour = 0;

      hour = `${startHour}-${endHour}`;

      // Check if there's an interval within the range
      if (input.includes("every 30 minutes")) {
        minute = "*/30";
      } else if (input.includes("every 15 minutes")) {
        minute = "*/15";
      } else if (input.includes("every hour")) {
        minute = "0";
      }
    }
  }

  // Day of week
  if (input.includes("weekday")) {
    dayOfWeek = "1-5";
  } else if (input.includes("weekend")) {
    dayOfWeek = "0,6";
  } else {
    const daysOfWeek = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const days: number[] = [];
    for (const [day, value] of Object.entries(daysOfWeek)) {
      if (input.includes(day)) {
        days.push(value);
      }
    }

    if (days.length > 0) {
      dayOfWeek = days.sort().join(",");
    }
  }

  // Month and day handling
  if (input.includes("of the month")) {
    const dayMatch = input.match(/(\d+)(st|nd|rd|th) of the month/);
    if (dayMatch) {
      dayOfMonth = dayMatch[1];
    }
  }

  // Handle specific months
  const months = {
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

  const monthList: number[] = [];
  for (const [monthName, value] of Object.entries(months)) {
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

  if (monthList.length === 1) {
    month = monthList[0].toString();
  } else if (monthList.length > 1) {
    month = monthList.sort().join(",");
  }

  return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
}

// Crontab to natural language
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
  const formatTime = (h: number, m: number) => {
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const period = h < 12 ? "AM" : "PM";
    return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
  };

  // Build comprehensive description
  let desc = "";

  // Time part
  if (minute !== "*") {
    const minuteNum = parseInt(minute, 10);

    if (hour !== "*") {
      if (hour.includes(",")) {
        // Multiple specific hours
        const hours = hour.split(",").map((h) => parseInt(h, 10));
        const times = hours.map((h) => formatTime(h, minuteNum));
        desc = `At ${times.join(" and ")}`;
      } else if (hour.includes("-")) {
        // Hour range
        const [startHour, endHour] = hour.split("-").map((h) =>
          parseInt(h, 10)
        );
        if (minute.startsWith("*/")) {
          const interval = parseInt(minute.substring(2), 10);
          desc = `Every ${interval} minutes from ${
            formatTime(startHour, 0)
          } to ${formatTime(endHour, 0)}`;
        } else {
          desc = `At ${minuteNum} minutes past the hour, from ${
            formatTime(startHour, 0)
          } to ${formatTime(endHour, 0)}`;
        }
      } else {
        // Specific time
        const hourNum = parseInt(hour, 10);
        desc = `At ${formatTime(hourNum, minuteNum)}`;
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
