import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatString(input: string | undefined | null): string {
  if (!input) return "";
  if (input === null) return "";
  return input
    .toLowerCase()
    .split(/[_\s]+/) // split by underscores OR spaces
    .filter(Boolean) // remove empty parts
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // return word.charAt(0).toUpperCase() + word.slice(1).replaceAll('_', ' ')
}
