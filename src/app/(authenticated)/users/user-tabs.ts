import { normalizeRoleName } from "./user-form-utils";

export const USER_TABS = [
  "All Users",
  "Sales Person",
  "Contractors",
  "Project Manager",
  "Sales Manager",
  "Admin",
] as const;

export type UserTab = (typeof USER_TABS)[number];

export function isUserTab(value: string | null | undefined): value is UserTab {
  return USER_TABS.includes(value as UserTab);
}

export function parseUserTabFromParam(tabParam: string | null): UserTab {
  return isUserTab(tabParam) ? tabParam : "All Users";
}

export function getUserTabFromRole(role?: string): UserTab {
  const normalized = normalizeRoleName(role);
  switch (normalized) {
    case "sales person":
      return "Sales Person";
    case "contractor":
      return "Contractors";
    case "project manager":
      return "Project Manager";
    case "sales manager":
      return "Sales Manager";
    case "admin":
      return "Admin";
    default:
      return "All Users";
  }
}

export function getUsersListPath(tab: UserTab = "All Users"): string {
  return `/users?tab=${encodeURIComponent(tab)}`;
}

export function withUserTab(path: string, tab: UserTab): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}tab=${encodeURIComponent(tab)}`;
}
