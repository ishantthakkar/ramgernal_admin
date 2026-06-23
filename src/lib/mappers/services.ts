import { formatServiceStatusLabel } from "@/lib/mappers/status-labels";
import { resolveId, resolvePopulatedName } from "@/lib/mappers/normalize";

export interface ServiceRow {
  id: string;
  ticketId: string;
  customerName: string;
  company: string;
  contractorName: string;
  status: string;
  statusLabel: string;
  createdAt: string;
}

export function mapServiceRow(raw: Record<string, unknown>): ServiceRow {
  const customer =
    raw.customerId && typeof raw.customerId === "object"
      ? (raw.customerId as Record<string, unknown>)
      : null;

  return {
    id: resolveId(raw),
    ticketId: String(raw.ticketId || raw._id || ""),
    customerName: resolvePopulatedName(customer, "—"),
    company: String(customer?.company || "—"),
    contractorName:
      resolvePopulatedName(raw.assignedTo) || "Unassigned",
    status: String(raw.status || "Assigned"),
    statusLabel: formatServiceStatusLabel(String(raw.status || "Assigned")),
    createdAt: String(raw.createdAt || ""),
  };
}

export function mapServiceRows(rawServices: unknown[]): ServiceRow[] {
  if (!Array.isArray(rawServices)) return [];
  return rawServices.map((service) =>
    mapServiceRow(service as Record<string, unknown>)
  );
}

export interface ServiceStats {
  total: number;
  inProgress: number;
  completed: number;
  assigned: number;
}

export function computeServiceStats(rows: ServiceRow[]): ServiceStats {
  return {
    total: rows.length,
    assigned: rows.filter((row) => row.status === "Assigned").length,
    inProgress: rows.filter((row) => row.status === "In Progress").length,
    completed: rows.filter((row) => row.status === "Completed").length,
  };
}
