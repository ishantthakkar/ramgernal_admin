export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function normalizeRoleName(role?: string): string {
  return (role || "").toLowerCase().trim().replace(/_/g, " ");
}

export function parseStoredTime(value?: string): { time: string; period: "AM" | "PM" } {
  if (!value?.trim()) {
    return { time: "10:00", period: "AM" };
  }

  const match = value.trim().match(/^(\d{1,2}:\d{2})\s*(AM|PM)$/i);
  if (match) {
    return {
      time: match[1].padStart(5, "0").replace(/^(\d):/, "0$1:"),
      period: match[2].toUpperCase() as "AM" | "PM",
    };
  }

  return { time: "10:00", period: "AM" };
}

export function resolveRoleId(
  roles: { _id: string; roleName?: string }[],
  user: { roleId?: string | { _id?: string }; userRole?: string }
): string {
  const roleIdFromUser =
    typeof user.roleId === "object" && user.roleId?._id
      ? String(user.roleId._id)
      : user.roleId
        ? String(user.roleId)
        : "";

  if (roleIdFromUser && roles.some((r) => r._id === roleIdFromUser)) {
    return roleIdFromUser;
  }

  const matched = roles.find(
    (r) => normalizeRoleName(r.roleName) === normalizeRoleName(user.userRole)
  );
  return matched?._id || roles[0]?._id || "";
}

export type SupervisorTargetRole = "sales manager" | "admin";

export function getSupervisorTargetRole(roleName?: string): SupervisorTargetRole | null {
  const role = normalizeRoleName(roleName);
  if (role === "sales person") return "sales manager";
  if (role === "sales manager" || role === "project manager") return "admin";
  return null;
}

export function getSupervisorLabel(target: SupervisorTargetRole | null): string {
  if (target === "sales manager" || target === "admin") return "Manager";
  return "";
}

export function getSupervisorFieldLabel(roleName?: string): string | null {
  const role = normalizeRoleName(roleName);
  if (role === "sales person" || role === "sales manager" || role === "project manager") {
    return "Manager";
  }
  return null;
}
