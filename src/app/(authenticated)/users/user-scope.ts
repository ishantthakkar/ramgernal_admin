import { getCurrentUserId, isSalesManagerUser, isSuperAdmin } from "@/lib/permissions";

interface ScopedUser {
  _id?: string;
  userRole?: string;
  reportsTo?: { _id?: string } | string | null;
}

function getReportsToId(reportsTo: ScopedUser["reportsTo"]): string {
  if (!reportsTo) return "";
  if (typeof reportsTo === "object" && reportsTo._id) {
    return String(reportsTo._id);
  }
  return String(reportsTo);
}

/** Sales managers only see themselves and direct-report sales persons. */
export function filterUsersForCurrentActor<T extends ScopedUser>(users: T[]): T[] {
  if (isSuperAdmin()) return users;
  if (!isSalesManagerUser()) return users;

  const managerId = getCurrentUserId();
  if (!managerId) return users;

  return users.filter((user) => {
    const userId = String(user._id || "");
    if (userId === managerId) return true;
    return getReportsToId(user.reportsTo) === managerId;
  });
}
