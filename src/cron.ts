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
    const convertedHours = hourParts.map((part) => {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        const startUTC = (start - timezoneOffset + 24) % 24;
        const endUTC = (end - timezoneOffset + 24) % 24;
        return `${startUTC}-${endUTC}`;
      } else {
        const singleHour = Number(part);
        return ((singleHour - timezoneOffset + 24) % 24).toString();
      }
    });

    return convertedHours.join(",");
  };

  const utcHourField = convertHourField(hour);

  return [minute, utcHourField, dayOfMonth, month, dayOfWeek].join(" ");
}
export function convertZeroBasedDaysToOneBased(cronTab: string): string {
  const fields = cronTab.trim().split(" ");

  if (fields.length !== 5) {
    throw new Error("Invalid cronTab string; expected exactly 5 fields.");
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;

  const convertDayField = (dayField: string): string => {
    return dayField
      .split(",")
      .map((dayPart) => {
        if (dayPart.includes("-")) {
          const [start, end] = dayPart.split("-").map(Number);
          const newStart = ((start + 1 - 1) % 7) + 1;
          const newEnd = ((end + 1 - 1) % 7) + 1;
          return `${newStart}-${newEnd}`;
        } else {
          const day = Number(dayPart);
          return (((day + 1 - 1) % 7) + 1).toString();
        }
      })
      .join(",");
  };

  const convertedDayOfWeek = convertDayField(dayOfWeek);

  return [minute, hour, dayOfMonth, month, convertedDayOfWeek].join(" ");
}
