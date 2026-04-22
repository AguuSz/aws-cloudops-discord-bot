import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export const DEFAULT_TIMEZONE = 'America/Argentina/Cordoba';

export function nowInTimezone(tz: string = DEFAULT_TIMEZONE): dayjs.Dayjs {
  return dayjs().tz(tz);
}

export function timeToCron(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  return `${minutes} ${hours} * * *`;
}

export function cronToTime(cron: string): string {
  const parts = cron.split(' ');
  const minutes = parts[0].padStart(2, '0');
  const hours = parts[1].padStart(2, '0');
  return `${hours}:${minutes}`;
}

export { dayjs };
