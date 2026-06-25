import { adminApi } from "@/lib/api";
import { sanitizePdfUrl } from "@/lib/quotation-utils";

export interface InvoiceApiRow {
  customerId?: string;
  customerName?: string;
  lead_id?: string;
  survey_id?: string;
  surveyName?: string;
  invoiceNumber?: string;
  invoiceStatus?: string;
  invoiceDate?: string | null;
  generateInvoice?: string;
}

export interface InvoiceRow {
  id: string;
  surveyId: string;
  recordId: string;
  invoiceNo: string;
  invoiceDate: string | null;
  customer: string;
  customerId: string;
  surveyName: string;
  status: string;
  statusLabel: string;
  pdfUrl: string;
  hasPdf: boolean;
}

export function formatInvoiceStatusLabel(value: string): string {
  const status = String(value || "").trim().toLowerCase();
  if (!status || status === "pending") return "Pending";
  if (status === "approved") return "Approved";
  if (status === "fully_paid" || status === "fully paid") return "Fully Paid";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getInvoiceStatusColor(status: string): string {
  switch (String(status || "").toLowerCase()) {
    case "fully_paid":
    case "fully paid":
      return "#059669";
    case "approved":
      return "#10b981";
    case "pending":
      return "#f59e0b";
    default:
      return "#64748b";
  }
}

export function mapInvoiceRow(apiRow: InvoiceApiRow): InvoiceRow {
  const surveyId = String(apiRow.survey_id || "").trim();
  const pdfUrl = sanitizePdfUrl(String(apiRow.generateInvoice || ""));
  const status = String(apiRow.invoiceStatus || "pending").trim();
  const invoiceNumber = String(apiRow.invoiceNumber || "").trim();
  const customerId = String(apiRow.customerId || "").trim();
  const customerName = String(apiRow.customerName || "").trim();
  const surveyName = String(apiRow.surveyName || "").trim();
  const recordId = String(apiRow.lead_id || "").trim();
  const invoiceDate = apiRow.invoiceDate ? String(apiRow.invoiceDate) : null;

  return {
    id: surveyId || invoiceNumber || customerId || `${customerName}-${surveyName}` || "invoice-row",
    surveyId,
    recordId: recordId || "—",
    invoiceNo: invoiceNumber || "—",
    invoiceDate,
    customer: customerName || "Unknown",
    customerId: customerId || "—",
    surveyName: surveyName || "Survey",
    status,
    statusLabel: formatInvoiceStatusLabel(status),
    pdfUrl,
    hasPdf: Boolean(pdfUrl),
  };
}

export async function fetchInvoiceRows(): Promise<InvoiceRow[]> {
  const invoicesRes = await adminApi.getInvoicesList({ hasInvoices: "all" });
  const rows = (invoicesRes.invoices || []) as InvoiceApiRow[];
  return rows.map(mapInvoiceRow);
}

export interface InvoiceDetail {
  surveyId: string;
  customerId: string;
  customerName: string;
  recordId: string;
  surveyName: string;
  invoiceNo: string;
  invoiceDate: string | null;
  status: string;
  statusLabel: string;
  pdfUrl: string;
  hasPdf: boolean;
}

export async function fetchInvoiceDetail(surveyId: string): Promise<InvoiceDetail> {
  const response = await adminApi.getInvoiceDetails(surveyId);
  const pdfUrl = sanitizePdfUrl(String(response.generateInvoice || ""));
  const status = String(response.invoiceStatus || "pending").trim();

  return {
    surveyId: String(response.survey_id || surveyId),
    customerId: String(response.customerId || ""),
    customerName: String(response.customerName || "Customer"),
    recordId: String(response.lead_id || "").trim() || "—",
    surveyName: String(response.surveyName || "Survey"),
    invoiceNo: String(response.invoiceNumber || "—").trim() || "—",
    invoiceDate: response.invoiceDate ? String(response.invoiceDate) : null,
    status,
    statusLabel: formatInvoiceStatusLabel(status),
    pdfUrl,
    hasPdf: Boolean(pdfUrl),
  };
}
