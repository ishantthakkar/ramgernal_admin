/** Central status → display label mapping for all admin modules */

export function formatInstallationStatusLabel(value: string): string {
  const status = String(value || "").trim().toLowerCase();
  if (!status || status === "not started") return "Not Started";
  if (status === "new") return "Not Started";
  if (status === "start") return "Started";
  if (status === "in_progress") return "In Progress";
  if (status === "continue") return "In Progress";
  if (status === "completed") return "Completed";
  if (status === "submitted") return "Submitted";
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

export function formatLeadStatusLabel(value: string): string {
  const status = String(value || "").trim();
  if (!status) return "—";
  return status;
}

export function formatCustomerStatusLabel(value: string, verifyStatus?: string): string {
  if (String(verifyStatus || "").toLowerCase() === "verified") return "Verified";
  const status = String(value || "").trim().toLowerCase();
  if (!status) return "—";
  if (status === "completed") return "Survey Completed";
  if (status === "submitted") return "Submitted";
  if (status === "in_progress") return "In Progress";
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

export function formatServiceStatusLabel(value: string): string {
  const status = String(value || "").trim();
  if (!status) return "Assigned";
  return status;
}

export function getStatusBadgeStyle(status: string): { color: string; bg: string } {
  const key = String(status || "").trim().toLowerCase().replace(/_/g, " ");
  if (!key || key === "-") return { color: "#94a3b8", bg: "#f1f5f9" };
  if (["completed", "verified"].includes(key)) return { color: "#10b981", bg: "#ecfdf5" };
  if (["not started", "new", "to do", "to-do", "pending"].includes(key)) {
    return { color: "#ef4444", bg: "#fef2f2" };
  }
  if (["in progress", "in-process", "in process", "started", "continue", "assigned"].includes(key)) {
    return { color: "#3b82f6", bg: "#eff6ff" };
  }
  if (["submitted", "confirm", "confirmed", "pending review"].includes(key)) {
    return { color: "#f59e0b", bg: "#fffbeb" };
  }
  if (["reopened", "reopen"].includes(key)) return { color: "#d97706", bg: "#fef3c7" };
  return { color: "#64748b", bg: "#f8fafc" };
}
