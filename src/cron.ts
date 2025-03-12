/**
 * This module contains utility functions for converting cron expressions between different formats.
 *
 * @module
 */

/**
 * Converts a cron expression from local time to UTC time by adjusting the hour field.
 *
 * @param cronTab - A standard cron expression string with 5 fields (minute, hour, day of month, month, day of week)
 * @param timezoneOffset - The timezone offset in hours (e.g., -5 for EST, +1 for CET)
 * @returns A new cron expression string adjusted to UTC time
 * @throws {Error} If the cronTab string does not contain exactly 5 fields
 *
 * @example
 * // Convert "0 9 * * *" from EST (UTC-5) to UTC
 * convertCronToUTC("0 9 * * *", -5) // Returns "0 14 * * *"
 *
 * @example
 * // Convert "0 1-3 * * *" from CET (UTC+1) to UTC
 * convertCronToUTC("0 1-3 * * *", 1) // Returns "0 0-2 * * *"
 */
export function convertCronToUTC(
  cronTab: string,
  timezoneOffset: number,
): string {
  const fields = cronTab.trim().split(" ");

  if (fields.length !== 5) {
    throw new Error("Invalid cronTab string; expected exactly 5 fields.");
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;

  const convertHourField = (hourField: string): string => {
    const hourParts = hourField.split(",");
    const convertedHours = hourParts.flatMap((part) => {
      if (part === "*") return ["*"];

      if (part.includes("-")) {
        let [start, end] = part.split("-").map(Number);
        start = (start - timezoneOffset + 24) % 24;
        end = (end - timezoneOffset + 24) % 24;

        if (start === end) {
          // Simplify identical start-end ranges, e.g., 3-3 => 3
          return [`${start}`];
        } else if (start < end) {
          return [`${start}-${end}`];
        } else {
          // Handle wrap-around by splitting into two ranges
          const firstRange = start === 23 ? "23" : `${start}-23`;
          return [firstRange, `0-${end}`];
        }
      }

      const singleHour = (Number(part) - timezoneOffset + 24) % 24;
      return [singleHour.toString()];
    });

    return convertedHours.join(",");
  };

  const utcHourField = convertHourField(hour);

  return [minute, utcHourField, dayOfMonth, month, dayOfWeek].join(" ");
}

/**
 * Converts a cron expression with zero-based day-of-week values (0-6) to one-based values (1-7).
 *
 * In the zero-based system Sunday is 0 and Saturday is 6
 * In the one-based system Sunday is 1 and Saturday is 7
 *
 * @param cronTab - A cron expression string with 5 fields (minute, hour, day of month, month, day of week)
 * @returns A modified cron expression with one-based day-of-week values
 * @throws {Error} If the input string doesn't contain exactly 5 fields
 *
 * @example
 * // Convert "30 4 * * 0" (Sunday is 0) to "30 4 * * 1" (Sunday is 1)
 * convertCronZeroBasedDaysToOneBased("30 4 * * 0"); // returns "30 4 * * 1"
 *
 * @example
 * // Convert "15 14 * * 1-5" (Mon-Fri as 1-5) to "15 14 * * 2-6" (Mon-Fri as 2-6)
 * convertCronZeroBasedDaysToOneBased("15 14 * * 1-5"); // returns "15 14 * * 2-6"
 */
export function convertCronZeroBasedDaysToOneBased(cronTab: string): string {
  const fields = cronTab.trim().split(" ");

  if (fields.length !== 5) {
    throw new Error("Invalid cronTab string; expected exactly 5 fields.");
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;

  const convertDayField = (dayField: string): string => {
    return dayField
      .split(",")
      .flatMap((dayPart) => {
        if (dayPart === "*") return ["*"];

        if (dayPart.includes("-")) {
          let [start, end] = dayPart.split("-").map(Number);
          start = (start % 7) + 1;
          end = (end % 7) + 1;
          if (start <= end) {
            return [`${start}-${end}`];
          } else {
            // Handle wrap-around (e.g., 5-0 → 6-7,1)
            return [`${start}-7`, `1-${end}`].filter((range) =>
              !range.endsWith("-0")
            );
          }
        }

        const day = (Number(dayPart) % 7) + 1;
        return [day.toString()];
      })
      .join(",");
  };

  const convertedDayOfWeek = convertDayField(dayOfWeek);

  return [minute, hour, dayOfMonth, month, convertedDayOfWeek].join(" ");
}

/**
 * Converts a cronx expression to a compatible with Deno.cron
 *
 * @param cronxExpression - A cronx expression string with 5 fields (minute, hour, day of month, month, 0-based day of week)
 *
 * @param offset - The timezone offset in hours (e.g., -5 for EST, +1 for CET)
 * @returns A Deno.cron friendly expression string adjusted to UTC time and 1-based day-of-week values
 */
export function convertCronxExpressionToDenoCronExpression(
  cronxExpression: string,
  offset: number,
): string {
  return convertCronToUTC(
    convertCronZeroBasedDaysToOneBased(cronxExpression),
    offset,
  );
}
