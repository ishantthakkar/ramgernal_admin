import { adminApi } from "@/lib/api";
import { mapInstallationSurveyRow } from "@/lib/workflow-installation";
import { sanitizePdfUrl } from "@/lib/quotation-utils";

export interface InvoiceApiRow {
  customerId?: string;
  customerName?: string;
  survey_id?: string;
  surveyName?: string;
  invoiceNumber?: string;
  invoiceStatus?: string;
  generateInvoice?: string;
}

export interface InvoiceRow {
  id: string;
  surveyId: string;
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

function parseApiDate(value: unknown): string | null {
  if (value == null || value === "") return null;
  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
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

export function mapInvoiceRow(
  survey: Record<string, unknown>,
  invoiceMeta?: InvoiceApiRow | null
): InvoiceRow {
  const base = mapInstallationSurveyRow(survey);
  const pdfUrl = sanitizePdfUrl(String(invoiceMeta?.generateInvoice || ""));
  const status = String(invoiceMeta?.invoiceStatus || "pending");
  const invoiceNumber = String(invoiceMeta?.invoiceNumber || "").trim();
  const updatedAt =
    parseApiDate(survey.updatedAt) ||
    parseApiDate(invoiceMeta?.generateInvoice ? survey.updatedAt : null);

  return {
    id: base.surveyId || base.rowId,
    surveyId: base.surveyId,
    invoiceNo: invoiceNumber || "—",
    invoiceDate: pdfUrl ? updatedAt : null,
    customer: String(invoiceMeta?.customerName || base.customerName || "Unknown"),
    customerId: base.leadId || base.customerCode || base.accountNumber || "—",
    surveyName: String(invoiceMeta?.surveyName || base.surveyName || "Survey"),
    status,
    statusLabel: formatInvoiceStatusLabel(status),
    pdfUrl,
    hasPdf: Boolean(pdfUrl),
  };
}

export async function fetchInvoiceRows(): Promise<InvoiceRow[]> {
  const [invoicesRes, installationsRes] = await Promise.all([
    adminApi.getInvoicesList({ hasInvoices: "all" }),
    adminApi.getInstallations(),
  ]);

  const invoiceBySurvey = new Map<string, InvoiceApiRow>();
  for (const row of (invoicesRes.invoices || []) as InvoiceApiRow[]) {
    const surveyId = String(row.survey_id || "");
    if (surveyId) {
      invoiceBySurvey.set(surveyId, row);
    }
  }

  const surveys = (installationsRes.surveys ||
    installationsRes.installations ||
    installationsRes.data ||
    []) as Record<string, unknown>[];

  const verifiedSurveys = surveys.filter((survey) => {
    const inspectionStatus = String(survey.inspectionStatus || "").trim().toLowerCase();
    return inspectionStatus === "verified";
  });

  return verifiedSurveys.map((survey) => {
    const surveyId = String(survey._id || "");
    return mapInvoiceRow(survey, invoiceBySurvey.get(surveyId) || null);
  });
}
