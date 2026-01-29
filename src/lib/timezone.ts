export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getTodayInTimezone(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

export function formatDateForInput(dateString: string | null, timezone: string): string {
  if (!dateString) return '';

  const date = new Date(dateString);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function formatDateForDisplay(
  dateString: string | null,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };

  return date.toLocaleString('en-US', defaultOptions);
}

export function formatDateTimeForDisplay(
  dateString: string | null,
  timezone: string
): string {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);

  return date.toLocaleString('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function convertLocalToUTC(localDateTimeString: string, timezone: string): string {
  const date = new Date(localDateTimeString);
  return date.toISOString();
}

export function getTimezoneAbbreviation(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'short',
  });

  const parts = formatter.formatToParts(now);
  const timeZonePart = parts.find(part => part.type === 'timeZoneName');

  return timeZonePart?.value || timezone;
}

export function getTimezoneOffset(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset',
  });

  const parts = formatter.formatToParts(now);
  const offsetPart = parts.find(part => part.type === 'timeZoneName');

  return offsetPart?.value || '';
}

export function formatTimezoneDisplay(timezone: string): string {
  const abbr = getTimezoneAbbreviation(timezone);
  const offset = getTimezoneOffset(timezone);

  if (offset) {
    return `${timezone} (${abbr}, ${offset})`;
  }

  return `${timezone} (${abbr})`;
}

export const COMMON_TIMEZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
];
