import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Conditional + conflict-safe className helper. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
