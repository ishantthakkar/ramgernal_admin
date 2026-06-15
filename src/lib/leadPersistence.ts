import { adminApi } from "@/lib/api";

export interface LeadNotePayload {
  title: string;
  note: string;
}

export interface LeadActivityPayload {
  activityType: string;
  date: string;
  outcome: string;
  notes: string;
  followUpDate?: string;
  nextFollowUpDate?: string;
}

function formatActivityDateLabel(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function buildActivityNote(activity: LeadActivityPayload): string {
  const parts: string[] = [];
  if (activity.outcome.trim()) parts.push(`Outcome: ${activity.outcome.trim()}`);
  if (activity.notes.trim()) parts.push(activity.notes.trim());
  if (activity.followUpDate?.trim()) {
    parts.push(`Follow Up Date: ${formatActivityDateLabel(activity.followUpDate)}`);
  }
  if (activity.nextFollowUpDate?.trim()) {
    parts.push(`Next Follow Up Date: ${formatActivityDateLabel(activity.nextFollowUpDate)}`);
  }
  return parts.join("\n");
}

export async function persistLeadNotes(
  leadId: string,
  notes: LeadNotePayload[]
): Promise<void> {
  const cleaned = notes
    .map((n) => ({ title: n.title.trim(), note: n.note.trim() }))
    .filter((n) => n.note);

  for (const note of cleaned) {
    await adminApi.addLeadNote(leadId, note);
  }
}

export async function persistLeadActivities(
  leadId: string,
  activities: LeadActivityPayload[]
): Promise<void> {
  const cleaned = activities
    .map((a) => ({
      activityType: a.activityType.trim(),
      date: a.date,
      outcome: a.outcome.trim(),
      notes: a.notes.trim(),
      followUpDate: a.followUpDate?.trim() || "",
      nextFollowUpDate: a.nextFollowUpDate?.trim() || "",
    }))
    .filter((a) => a.activityType);

  for (const activity of cleaned) {
    await adminApi.addLeadActivity(leadId, {
      activityType: activity.activityType,
      date: activity.date || new Date().toISOString(),
      note: buildActivityNote(activity),
    });
  }
}

export function getActivityDisplayText(log: {
  note?: string;
  notes?: string;
  outcome?: string;
}): string {
  if (log.note?.trim()) return log.note.trim();
  const parts: string[] = [];
  if (log.outcome?.trim()) parts.push(log.outcome.trim());
  if (log.notes?.trim()) parts.push(log.notes.trim());
  return parts.join("\n");
}
