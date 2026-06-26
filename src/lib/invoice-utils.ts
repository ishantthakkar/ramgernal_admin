import { adminApi } from "@/lib/api";
import { sanitizePdfUrl } from "@/lib/quotation-utils";

export const INVOICE_PAYMENT_METHODS = [
  "Cash",
  "ACH Transfer",
  "Wire Transfer",
  "Check",
  "Credit Card",
  "Debit Card",
  "PayPal",
  "Stripe",
  "Other",
] as const;

export interface InvoicePaymentEntry {
  _id?: string;
  amount: number;
  paymentMethod: string;
  note?: string;
  paymentDate: string | null;
  createdAt?: string | null;
}

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
  invoiceAmount?: number;
  paidAmount?: number;
  pendingAmount?: number;
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
  invoiceAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function resolveInvoiceStatusLabel(
  status: string,
  options?: { hasPdf?: boolean; paidAmount?: number; pendingAmount?: number; invoiceAmount?: number }
): string {
  if (!options?.hasPdf) return "Ready to Generate";

  const normalized = String(status || "").trim().toLowerCase();
  const paid = Number(options.paidAmount) || 0;
  const pending = Number(options.pendingAmount) || 0;
  const amount = Number(options.invoiceAmount) || 0;

  if (normalized === "fully_paid" || normalized === "fully paid") return "Fully Paid";
  if (amount > 0 && paid > 0 && pending > 0) return "Partially Paid";
  if (normalized === "approved") return "Approved";
  if (!normalized || normalized === "pending") return "Pending";

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function formatInvoiceStatusLabel(value: string): string {
  const status = String(value || "").trim().toLowerCase();
  if (!status || status === "pending") return "Pending";
  if (status === "approved") return "Approved";
  if (status === "fully_paid" || status === "fully paid") return "Fully Paid";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getInvoiceStatusColor(
  status: string,
  options?: { paidAmount?: number; pendingAmount?: number; invoiceAmount?: number; hasPdf?: boolean }
): string {
  const label = resolveInvoiceStatusLabel(status, options);

  switch (label) {
    case "Fully Paid":
      return "#059669";
    case "Partially Paid":
      return "#2563eb";
    case "Approved":
      return "#10b981";
    case "Ready to Generate":
    case "Pending":
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
  const hasPdf = Boolean(pdfUrl);
  const invoiceAmount = Number(apiRow.invoiceAmount) || 0;
  const paidAmount = Number(apiRow.paidAmount) || 0;
  const pendingAmount =
    Number.isFinite(Number(apiRow.pendingAmount))
      ? Number(apiRow.pendingAmount)
      : Math.max(0, invoiceAmount - paidAmount);

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
    statusLabel: resolveInvoiceStatusLabel(status, { hasPdf, paidAmount, pendingAmount, invoiceAmount }),
    pdfUrl,
    hasPdf,
    invoiceAmount,
    paidAmount,
    pendingAmount,
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
  invoiceAmount: number;
  paidAmount: number;
  pendingAmount: number;
  payments: InvoicePaymentEntry[];
}

export async function fetchInvoiceDetail(surveyId: string): Promise<InvoiceDetail> {
  const response = await adminApi.getInvoiceDetails(surveyId);
  const pdfUrl = sanitizePdfUrl(String(response.generateInvoice || ""));
  const status = String(response.invoiceStatus || "pending").trim();
  const hasPdf = Boolean(pdfUrl);
  const invoiceAmount = Number(response.invoiceAmount) || 0;
  const paidAmount = Number(response.paidAmount) || 0;
  const pendingAmount =
    Number.isFinite(Number(response.pendingAmount))
      ? Number(response.pendingAmount)
      : Math.max(0, invoiceAmount - paidAmount);
  const payments = (response.payments || []) as InvoicePaymentEntry[];

  return {
    surveyId: String(response.survey_id || surveyId),
    customerId: String(response.customerId || ""),
    customerName: String(response.customerName || "Customer"),
    recordId: String(response.lead_id || "").trim() || "—",
    surveyName: String(response.surveyName || "Survey"),
    invoiceNo: String(response.invoiceNumber || "—").trim() || "—",
    invoiceDate: response.invoiceDate ? String(response.invoiceDate) : null,
    status,
    statusLabel: resolveInvoiceStatusLabel(status, {
      hasPdf,
      paidAmount,
      pendingAmount,
      invoiceAmount,
    }),
    pdfUrl,
    hasPdf,
    invoiceAmount,
    paidAmount,
    pendingAmount,
    payments,
  };
}
