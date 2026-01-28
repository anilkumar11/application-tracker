import type { InterviewRound } from './database.types';

export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  reminderMinutes?: number;
}

function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function foldLine(line: string): string {
  if (line.length <= 75) {
    return line;
  }

  const folded = [];
  let remaining = line;

  while (remaining.length > 75) {
    folded.push(remaining.substring(0, 75));
    remaining = ' ' + remaining.substring(75);
  }

  if (remaining.trim()) {
    folded.push(remaining);
  }

  return folded.join('\r\n');
}

export function generateICS(event: CalendarEvent): string {
  const now = new Date();
  const dtstamp = formatICSDate(now);
  const dtstart = formatICSDate(event.startDate);
  const dtend = formatICSDate(event.endDate);
  const uid = `${dtstamp}-${Math.random().toString(36).substring(2, 9)}@jobtracker.app`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Job Search Applications Tracker//Interview Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:UTC',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0000',
    'TZOFFSETTO:+0000',
    'TZNAME:UTC',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    foldLine(`SUMMARY:${escapeICSText(event.title)}`),
    foldLine(`DESCRIPTION:${escapeICSText(event.description)}`),
    foldLine(`LOCATION:${escapeICSText(event.location)}`),
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'TRANSP:OPAQUE',
  ];

  if (event.reminderMinutes !== undefined && event.reminderMinutes > 0) {
    lines.push(
      'BEGIN:VALARM',
      'TRIGGER:-PT' + event.reminderMinutes + 'M',
      'ACTION:DISPLAY',
      foldLine(`DESCRIPTION:${escapeICSText(event.title)}`),
      'END:VALARM'
    );
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}

export function downloadICS(icsContent: string, filename: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateInterviewICS(
  interviewRound: InterviewRound,
  companyName: string,
  positionTitle: string
): string {
  const startDate = new Date(interviewRound.interview_date);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const title = `Interview: ${companyName} - ${interviewRound.round_type}`;

  const descriptionParts = [
    `Interview with ${companyName}`,
    `Position: ${positionTitle}`,
    `Round ${interviewRound.round_number}: ${interviewRound.round_type}`,
    `Interviewer: ${interviewRound.interviewer_name}`,
  ];

  if (interviewRound.interviewer_linkedin_url) {
    descriptionParts.push(`LinkedIn: ${interviewRound.interviewer_linkedin_url}`);
  }

  if (interviewRound.meeting_type) {
    descriptionParts.push(`\nMeeting Type: ${interviewRound.meeting_type}`);
  }

  if (interviewRound.meeting_link) {
    descriptionParts.push(`Meeting Link: ${interviewRound.meeting_link}`);
  }

  if (interviewRound.meeting_phone) {
    descriptionParts.push(`Phone Number: ${interviewRound.meeting_phone}`);
  }

  if (interviewRound.meeting_notes) {
    descriptionParts.push(`\nMeeting Notes:\n${interviewRound.meeting_notes}`);
  }

  if (interviewRound.question_types_expected) {
    descriptionParts.push(`\nExpected Topics:\n${interviewRound.question_types_expected}`);
  }

  let location = `${companyName} - ${interviewRound.round_type}`;
  if (interviewRound.meeting_type === 'In-Person' && interviewRound.meeting_notes) {
    location = interviewRound.meeting_notes;
  } else if (interviewRound.meeting_link) {
    location = interviewRound.meeting_link;
  }

  const event: CalendarEvent = {
    title,
    description: descriptionParts.join('\n'),
    location,
    startDate,
    endDate,
    reminderMinutes: 1440,
  };

  return generateICS(event);
}

export function downloadInterviewCalendar(
  interviewRound: InterviewRound,
  companyName: string,
  positionTitle: string
): void {
  const icsContent = generateInterviewICS(interviewRound, companyName, positionTitle);
  const filename = `interview-${companyName.replace(/\s+/g, '-')}-round${interviewRound.round_number}.ics`;
  downloadICS(icsContent, filename);
}

export function formatRelativeTime(date: string | Date): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays === 0) return 'earlier today';
    if (absDays === 1) return 'yesterday';
    if (absDays < 7) return `${absDays} days ago`;
    if (absDays < 30) return `${Math.floor(absDays / 7)} weeks ago`;
    return `${Math.floor(absDays / 30)} months ago`;
  }

  if (diffDays === 0) {
    if (diffHours === 0) return 'in less than an hour';
    return `in ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
  }

  if (diffDays === 1) return 'tomorrow';
  if (diffDays < 7) return `in ${diffDays} days`;
  if (diffDays < 30) return `in ${Math.floor(diffDays / 7)} weeks`;
  return `in ${Math.floor(diffDays / 30)} months`;
}

export function getDayLabel(date: string | Date): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffDays = Math.floor((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'TODAY';
  if (diffDays === 1) return 'TOMORROW';
  return '';
}

export function getUrgencyLevel(date: string | Date): 'high' | 'medium' | 'low' {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffDays = Math.floor((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) return 'high';
  if (diffDays <= 6) return 'medium';
  return 'low';
}

export function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getEndOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return getStartOfDay(new Date(d.setDate(diff)));
}

export function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  return getEndOfDay(new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000));
}

export function getStartOfMonth(date: Date): Date {
  return getStartOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function getEndOfMonth(date: Date): Date {
  return getEndOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getMonthCalendarDays(date: Date): Date[] {
  const start = getStartOfMonth(date);
  const end = getEndOfMonth(date);
  const startDay = start.getDay();
  const days: Date[] = [];

  for (let i = 0; i < startDay; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() - (startDay - i));
    days.push(d);
  }

  const daysInMonth = getDaysInMonth(date);
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(date.getFullYear(), date.getMonth(), i));
  }

  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const d = new Date(end);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  return days;
}

export function getWeekDays(date: Date): Date[] {
  const start = getStartOfWeek(date);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(new Date(start.getTime() + i * 24 * 60 * 60 * 1000));
  }
  return days;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

export function isSameMonth(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth();
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatWeekRange(date: Date): string {
  const start = getStartOfWeek(date);
  const end = getEndOfWeek(date);

  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${end.getDate()}, ${start.getFullYear()}`;
  }

  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${start.getFullYear()}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}
