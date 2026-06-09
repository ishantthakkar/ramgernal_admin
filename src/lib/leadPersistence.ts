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
}

function buildActivityNote(activity: LeadActivityPayload): string {
  const parts: string[] = [];
  if (activity.outcome.trim()) parts.push(`Outcome: ${activity.outcome.trim()}`);
  if (activity.notes.trim()) parts.push(activity.notes.trim());
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
