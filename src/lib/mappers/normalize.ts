/** Shared field normalization helpers */

export function resolveId(record: Record<string, unknown> | null | undefined): string {
  if (!record) return "";
  return String(record.id || record._id || "");
}

export function resolveName(
  ...candidates: (string | null | undefined)[]
): string {
  for (const value of candidates) {
    const trimmed = String(value || "").trim();
    if (trimmed) return trimmed;
  }
  return "";
}

export function resolvePopulatedName(
  ref: unknown,
  fallback = ""
): string {
  if (ref && typeof ref === "object") {
    const obj = ref as Record<string, unknown>;
    return resolveName(
      obj.fullName as string,
      obj.name as string,
      fallback
    );
  }
  if (typeof ref === "string") return ref.trim();
  return fallback;
}
