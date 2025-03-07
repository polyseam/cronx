// Check for specific month and day combinations
const monthDayMatch = normalizedInput.match(
  new RegExp(
    `every (${Object.keys(MONTHS_MAP).join("|")}) (\\d+)(st|nd|rd|th)`,
  ),
);
const monthsPattern =
  /every\s+((?:january|february|march|april|may|june|july|august|september|october|november|december)(?:,\s*(?:january|february|march|april|may|june|july|august|september|october|november|december))+(?:\s*(?:and)\s*(?:january|february|march|april|may|june|july|august|september|october|november|december))?)/i;
const monthsMatches = normalizedInput.match(
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi,
);
// Check for specific month and day combinations like "December 25th"
const specificMonthDayMatch = normalizedInput.match(
  new RegExp(
    `\\b(${Object.keys(MONTHS_MAP).join("|")})[\\s,]+(\\d+)(?:st|nd|rd|th)\\b`,
    "i",
  ),
);
if (specificMonthDayMatch) {
  const month = MONTHS_MAP[specificMonthDayMatch[1].toLowerCase()];
  const day = specificMonthDayMatch[2];
  // Parse the time if specified
  if (normalizedInput.includes(" at ")) {
    return this.handleSpecificTimeOfDay(
      normalizedInput,
      `0 0 ${day} ${month} *`,
    );
  } else {
    // Default to midnight if no time specified
    return `0 0 ${day} ${month} *`;
  }
}
const timeMatch = lowerTimeStr.match(/(\d+)(?::(\d+))?\s*(am|pm)?/i);
