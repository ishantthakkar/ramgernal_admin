import { formatLeadStatusLabel } from "@/lib/mappers/status-labels";
import { resolveId, resolveName } from "@/lib/mappers/normalize";

export interface LeadRow {
  id: string;
  leadId: string;
  leadName: string;
  leadSource: string;
  mobileNumber: string;
  phone: string;
  email: string;
  dba: string;
  salesPersonName: string;
  status: string;
  statusLabel: string;
  lastActivity: string;
  createdDate: string;
}

export const ACTIVE_LEAD_STATUSES = ["New", "Assigned", "In Progress"] as const;
export const LOST_LEAD_STATUS = "Lost Leads";
export const CONVERTED_LEAD_STATUS = "Converted To Customer";

export function mapLeadRow(raw: Record<string, unknown>): LeadRow {
  const status = String(raw.status || "");
  return {
    id: resolveId(raw),
    leadId: String(raw.lead_id || ""),
    leadName: resolveName(raw.leadName as string, raw.name as string),
    leadSource: resolveName(raw.leadSourceName as string, raw.leadSource as string),
    mobileNumber: String(raw.mobileNumber || ""),
    phone: String(raw.phone || ""),
    email: String(raw.email || ""),
    dba: String(raw.dba || ""),
    salesPersonName: String(raw.salesPersonName || "—"),
    status,
    statusLabel: formatLeadStatusLabel(status),
    lastActivity: String(raw.lastActivity || ""),
    createdDate: String(raw.createdDate || raw.createdAt || ""),
  };
}

export function mapLeadRows(rawLeads: unknown[]): LeadRow[] {
  if (!Array.isArray(rawLeads)) return [];
  return rawLeads.map((lead) => mapLeadRow(lead as Record<string, unknown>));
}

export interface LeadStats {
  total: number;
  active: number;
  lost: number;
}

export function computeLeadStats(leads: LeadRow[]): LeadStats {
  const open = leads.filter(
    (lead) =>
      lead.status !== CONVERTED_LEAD_STATUS &&
      lead.status !== LOST_LEAD_STATUS &&
      lead.status !== "Closed"
  );
  return {
    total: open.length,
    active: open.filter((lead) =>
      ACTIVE_LEAD_STATUSES.includes(lead.status as (typeof ACTIVE_LEAD_STATUSES)[number])
    ).length,
    lost: leads.filter((lead) => lead.status === LOST_LEAD_STATUS).length,
  };
}
