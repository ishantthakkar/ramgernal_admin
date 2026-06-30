import { formatCustomerStatusLabel } from "@/lib/mappers/status-labels";
import { resolveId, resolveName } from "@/lib/mappers/normalize";

export interface CustomerRow {
  id: string;
  leadId: string;
  accountNumber: string;
  leadName: string;
  email: string;
  mobileNumber: string;
  dba: string;
  salesPersonName: string;
  salesManagerName: string;
  status: string;
  statusLabel: string;
  verifyStatus: string;
}

export function mapCustomerRow(raw: Record<string, unknown>): CustomerRow {
  const verifyStatus = String(raw.verifyStatus || "");
  const status = String(raw.status || "");
  return {
    id: resolveId(raw),
    leadId: String(raw.lead_id || raw.leadId || ""),
    accountNumber: String(raw.accountNumber || "—"),
    leadName: resolveName(raw.leadName as string, raw.name as string),
    email: String(raw.email || "—"),
    mobileNumber: String(raw.mobileNumber || raw.phone || "—"),
    dba: String(raw.dba || "—"),
    salesPersonName: String(raw.salesPersonName || "—"),
    salesManagerName: String(raw.salesManagerName || "—"),
    status,
    statusLabel: formatCustomerStatusLabel(status, verifyStatus),
    verifyStatus,
  };
}

export function mapCustomerRows(rawCustomers: unknown[]): CustomerRow[] {
  if (!Array.isArray(rawCustomers)) return [];
  return rawCustomers.map((customer) =>
    mapCustomerRow(customer as Record<string, unknown>)
  );
}
