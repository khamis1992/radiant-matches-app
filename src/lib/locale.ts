// Qatar locale configuration
// Timezone: Asia/Qatar (UTC+3, no daylight saving time)
// Currency: Qatari Riyal (QAR)

export const QATAR_TIMEZONE = "Asia/Qatar";
export const QATAR_LOCALE = "en-QA";
export const QATAR_CURRENCY = "QAR";

/**
 * Format a number as Qatari Riyal currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(QATAR_LOCALE, {
    style: "currency",
    currency: QATAR_CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number with the QAR symbol (shorter format)
 */
export function formatQAR(amount: number): string {
  return `QAR ${amount.toLocaleString(QATAR_LOCALE)}`;
}

/**
 * Get current date/time in Qatar timezone
 */
export function getQatarDate(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: QATAR_TIMEZONE }));
}

/**
 * Format a date string for display in Qatar timezone
 */
export function formatDateInQatar(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString(QATAR_LOCALE, {
    timeZone: QATAR_TIMEZONE,
    ...options,
  });
}

/**
 * Format a time string for display in Qatar timezone
 */
export function formatTimeInQatar(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleTimeString(QATAR_LOCALE, {
    timeZone: QATAR_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...options,
  });
}

/**
 * Format a booking time string (HH:mm) to 12-hour format
 */
export function formatBookingTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString(QATAR_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
