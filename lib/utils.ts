import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Session } from "./auth/auth";

// Tailwind merge utility function
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Get user initials for avatar
export const getUserInitials = (user: Session["user"] | undefined) => {
  if (!user) {
    return "U";
  }
  if (user?.name) {
    const names = user.name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names.at(-1)?.[0] || ""}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  }
  if (user?.email) {
    return user.email.substring(0, 2).toUpperCase();
  }
  return "U";
};
