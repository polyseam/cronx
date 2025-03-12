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
    const hourParts = hourField.split(","); // 1 element array if no comma
    const convertedHours = hourParts.map((part) => {
      if (part === "*") {
        return "*";
      } else if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        const startUTC = (start - timezoneOffset + 24) % 24;
        const endUTC = (end - timezoneOffset + 24) % 24;
        return `${startUTC}-${endUTC}`;
      }
      const singleHour = Number(part);
      return ((singleHour - timezoneOffset + 24) % 24).toString();
    });

    return convertedHours.join(",");
  };

  const utcHourField = convertHourField(hour);

  return [minute, utcHourField, dayOfMonth, month, dayOfWeek].join(" ");
}

/**
 * Converts a cron expression with zero-based day-of-week values (0-6) to one-based values (1-7).
 *
 * @param cronTab - A cron expression string with 5 fields (minute, hour, day of month, month, day of week)
 * @returns A modified cron expression with one-based day-of-week values
 * @throws {Error} If the input string doesn't contain exactly 5 fields
 *
 * @example
 * // Convert "30 4 * * 0" (Sunday is 0) to "30 4 * * 7" (Sunday is 7)
 * convertCronZeroBasedDaysToOneBased("30 4 * * 0"); // returns "30 4 * * 7"
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
      .split(",") // 1 element array if no comma
      .map((dayPart) => {
        if (dayPart === "*") {
          return "*";
        } else if (dayPart.includes("-")) {
          const [start, end] = dayPart.split("-").map(Number);
          const newStart = ((start + 1 - 1) % 7) + 1;
          const newEnd = ((end + 1 - 1) % 7) + 1;
          return `${newStart}-${newEnd}`;
        }
        const day = Number(dayPart);
        return (((day + 1 - 1) % 7) + 1).toString();
      })
      .join(",");
  };

  const convertedDayOfWeek = convertDayField(dayOfWeek);

  return [minute, hour, dayOfMonth, month, convertedDayOfWeek].join(" ");
}

export function convertCronxExpressionToDenoCronExpression(
  cronxExpression: string,
  offset: number,
): string {
  return convertCronToUTC(
    convertCronZeroBasedDaysToOneBased(cronxExpression),
    offset,
  );
}
