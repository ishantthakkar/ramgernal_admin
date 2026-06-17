export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const FULL_DAY_NAMES: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function toFullDayName(day?: string): string {
  const normalized = (day || "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalized) return "";

  if (FULL_DAY_NAMES[normalized]) {
    return FULL_DAY_NAMES[normalized];
  }

  const short = normalized.slice(0, 3);
  return FULL_DAY_NAMES[short] || day || "";
}

export function getActiveWorkingSchedule(user: {
  workingSchedule?: WorkingScheduleItem[];
  workingDays?: string[];
  workingFrom?: string;
  workingTo?: string;
}): WorkingScheduleItem[] {
  const schedule = scheduleFromUser(user);

  return schedule
    .filter((entry) => entry.enabled)
    .map((entry) => ({
      day: toFullDayName(entry.day),
      from: formatTimeForApi(entry.from),
      to: formatTimeForApi(entry.to),
    }));
}

export interface TimeValue {
  time: string;
  period: "AM" | "PM";
}

export interface DayScheduleEntry {
  day: string;
  enabled: boolean;
  from: TimeValue;
  to: TimeValue;
}

export interface WorkingScheduleItem {
  day: string;
  from: string;
  to: string;
}

export function normalizeDayShort(value?: string): string {
  return (value || "").trim().slice(0, 3).toLowerCase();
}

export function createDefaultSchedule(): DayScheduleEntry[] {
  return WEEK_DAYS.map((day) => ({
    day,
    enabled: false,
    from: { time: "09:00", period: "AM" },
    to: { time: "05:00", period: "PM" },
  }));
}

export function formatTimeForApi(value: TimeValue): string {
  return `${value.time} ${value.period}`;
}

export function scheduleToApiPayload(schedule: DayScheduleEntry[]) {
  const active = schedule.filter((entry) => entry.enabled);
  const workingSchedule = active.map((entry) => ({
    day: entry.day,
    from: formatTimeForApi(entry.from),
    to: formatTimeForApi(entry.to),
  }));

  return {
    workingSchedule,
    workingDays: active.map((entry) => entry.day),
    workingFrom: active[0] ? formatTimeForApi(active[0].from) : "",
    workingTo: active[0] ? formatTimeForApi(active[0].to) : "",
  };
}

export function scheduleFromUser(user: {
  workingSchedule?: WorkingScheduleItem[];
  workingDays?: string[];
  workingFrom?: string;
  workingTo?: string;
}): DayScheduleEntry[] {
  const base = createDefaultSchedule();

  if (Array.isArray(user.workingSchedule) && user.workingSchedule.length > 0) {
    return base.map((entry) => {
      const match = user.workingSchedule!.find(
        (item) => normalizeDayShort(item.day) === normalizeDayShort(entry.day)
      );
      if (!match) return entry;

      return {
        ...entry,
        enabled: true,
        from: parseStoredTime(match.from),
        to: parseStoredTime(match.to),
      };
    });
  }

  if (Array.isArray(user.workingDays) && user.workingDays.length > 0) {
    return base.map((entry) => {
      const enabled = user.workingDays!.some(
        (day) => normalizeDayShort(day) === normalizeDayShort(entry.day)
      );
      if (!enabled) return entry;

      return {
        ...entry,
        enabled: true,
        from: parseStoredTime(user.workingFrom),
        to: parseStoredTime(user.workingTo),
      };
    });
  }

  return base;
}

export function validateWorkingSchedule(schedule: DayScheduleEntry[]): string | null {
  const active = schedule.filter((entry) => entry.enabled);

  if (active.length === 0) {
    return "Please enable at least one working day.";
  }

  for (const entry of active) {
    if (!entry.from.time || !entry.to.time) {
      return `Please enter working hours for ${entry.day}.`;
    }

    const fromMinutes = parseTimeToMinutes(formatTimeForApi(entry.from));
    const toMinutes = parseTimeToMinutes(formatTimeForApi(entry.to));

    if (fromMinutes === null || toMinutes === null) {
      return `Invalid working hours for ${entry.day}.`;
    }

    if (toMinutes <= fromMinutes) {
      return `${entry.day}: end time must be after start time.`;
    }
  }

  return null;
}

export function formatWorkingHoursDisplay(user: {
  workingSchedule?: WorkingScheduleItem[];
  workingDays?: string[];
  workingFrom?: string;
  workingTo?: string;
  workingHours?: string;
}): string {
  if (typeof user.workingHours === "string" && user.workingHours.trim()) {
    return user.workingHours;
  }

  const activeSchedule = getActiveWorkingSchedule(user);
  if (activeSchedule.length > 0) {
    return activeSchedule
      .map((entry) => `${entry.day} ${entry.from} – ${entry.to}`)
      .join("; ");
  }

  return "—";
}

function parseTimeToMinutes(value: string): number | null {
  const text = value.trim();
  if (!text) return null;

  const h24 = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (h24) {
    const hh = Number(h24[1]);
    const mm = Number(h24[2]);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return hh * 60 + mm;
  }

  const h12 = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(text);
  if (h12) {
    let hh = Number(h12[1]);
    const mm = Number(h12[2]);
    const ampm = h12[3].toUpperCase();
    if (hh < 1 || hh > 12 || mm < 0 || mm > 59) return null;
    if (ampm === "PM" && hh !== 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;
    return hh * 60 + mm;
  }

  return null;
}

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
