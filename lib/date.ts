import { format, isToday } from "date-fns";

/** "June 8" — used on the share card subtitle. */
export function shareDate(d: Date | string): string {
  return format(new Date(d), "MMMM d");
}

/** "Sun, Jun 8" — header / date selector. */
export function headerDate(d: Date | string): string {
  return format(new Date(d), "EEE, MMM d");
}

/** "7:30 PM" — game start time. */
export function gameTime(iso: string): string {
  return format(new Date(iso), "h:mm a");
}

export function isTodayDate(d: Date | string): boolean {
  return isToday(new Date(d));
}
