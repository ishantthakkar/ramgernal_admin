export interface LeadNoteAuthor {
  writtenByName: string;
  writtenByEmail: string;
  writtenByRole: string;
}

export interface LeadNoteDisplay {
  title?: string;
  note?: string;
  createdAt?: string;
  writtenByName?: string;
  writtenByEmail?: string;
  writtenByRole?: string;
}

export function getCurrentNoteAuthor(): LeadNoteAuthor | null {
  if (typeof window === "undefined") return null;

  const isAdmin = localStorage.getItem("is_super_admin") === "true";
  const raw = localStorage.getItem("user_info");
  if (!raw) return null;

  try {
    const user = JSON.parse(raw) as { fullName?: string; email?: string; userRole?: string };
    return {
      writtenByName: isAdmin ? "Admin" : (user.fullName || user.email || "User"),
      writtenByEmail: (user.email || "").toLowerCase(),
      writtenByRole: isAdmin ? "admin" : (user.userRole || "user"),
    };
  } catch {
    return null;
  }
}

export function formatNoteAuthorLabel(note: LeadNoteDisplay): string {
  if (note.writtenByName?.trim()) return note.writtenByName.trim();
  if (note.writtenByRole === "admin") return "Admin";
  return "Unknown";
}

export function withNoteAuthor<T extends LeadNoteDisplay>(note: T): T & LeadNoteAuthor {
  const author = getCurrentNoteAuthor();
  if (!author) return { ...note, writtenByName: "", writtenByEmail: "", writtenByRole: "" };
  return { ...note, ...author };
}
