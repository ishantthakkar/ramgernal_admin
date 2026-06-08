export interface QuotationFile {
  url: string;
  pdfName: string;
  createdAt?: string;
}

export function sanitizePdfUrl(url: string): string {
  return url?.replace(/%22$/i, "").replace(/"$/, "").trim() || "";
}

export function getLatestQuotation(quotations: Record<string, unknown>[]) {
  if (!quotations?.length) return null;
  return [...quotations].sort(
    (a, b) =>
      new Date((b.createdAt as string) || 0).getTime() -
      new Date((a.createdAt as string) || 0).getTime()
  )[0];
}

function isGeneratedQuotationItem(item: Record<string, unknown>): boolean {
  const source = String(item.source || "");
  if (source === "generated") return true;
  return Boolean(item.surveyId);
}

function isSignedQuotationItem(item: Record<string, unknown>): boolean {
  const source = String(item.source || "");
  if (source === "uploaded" && !item.surveyId) return true;
  return false;
}

export function resolveGenerateQuotationList(
  customer: Record<string, unknown>
): Record<string, unknown>[] {
  if (Array.isArray(customer.generateQuotation)) {
    return customer.generateQuotation as Record<string, unknown>[];
  }

  const quotations = (customer.quotations as Record<string, unknown>[]) || [];
  return quotations.filter(isGeneratedQuotationItem);
}

export function resolveUploadSignedQuotationList(
  customer: Record<string, unknown>
): Record<string, unknown>[] {
  if (Array.isArray(customer.uploadSignedQuotation)) {
    return customer.uploadSignedQuotation as Record<string, unknown>[];
  }

  const quotations = (customer.quotations as Record<string, unknown>[]) || [];
  return quotations.filter(isSignedQuotationItem);
}

export function getGeneratedQuotation(quotations: Record<string, unknown>[]) {
  return getLatestQuotation((quotations || []).filter(isGeneratedQuotationItem));
}

export function getSignedQuotation(quotations: Record<string, unknown>[]) {
  return getLatestQuotation((quotations || []).filter(isSignedQuotationItem));
}

export function getGeneratedQuotationFromCustomer(customer: Record<string, unknown>) {
  return getLatestQuotation(resolveGenerateQuotationList(customer));
}

export function getSignedQuotationFromCustomer(customer: Record<string, unknown>) {
  return getLatestQuotation(resolveUploadSignedQuotationList(customer));
}

export function mapQuotationFile(
  quotation: Record<string, unknown> | null
): QuotationFile | null {
  if (!quotation) return null;
  const url = sanitizePdfUrl((quotation.url as string) || "");
  if (!url) return null;
  return {
    url,
    pdfName:
      (quotation.pdfName as string) ||
      (quotation.filename as string) ||
      "quotation.pdf",
    createdAt: quotation.createdAt as string | undefined,
  };
}

export function formatQuotationCardDate(dateInput: unknown): string {
  if (!dateInput) return "";
  const date = new Date(dateInput as string);
  if (isNaN(date.getTime())) return "";

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, "0");

  return `(${month}/${day}/${year} ${hoursStr}:${minutes} ${ampm})`;
}

export function formatQuotationStatusLabel(status: string): string {
  const normalized = status?.toLowerCase();
  if (normalized === "approved") return "Approved";
  if (normalized === "pending") return "Pending";
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending";
}

export interface SurveyQuotationApiRow {
  customerId?: string;
  customerName?: string;
  survey_id?: string;
  surveyName?: string;
  quotationStatus?: string;
  quotationApprovedAt?: string | null;
  quotationApprovedBy?: string | null;
  generateQuotation?: string[];
  uploadSignedQuotation?: string[];
}

export interface WorkflowQuotationRow {
  _id: string;
  customerId: string;
  surveyId: string;
  leadId: string;
  customerName: string;
  surveyName: string;
  salesManager: string;
  salesPerson: string;
  generatedPdfUrl: string;
  generatedPdfName: string;
  signedPdfUrl: string;
  signedPdfName: string;
  quotationStatus: string;
  statusLabel: string;
}

export function getLatestQuotationUrl(urls: string[] | undefined): string {
  const list = (urls || []).map((url) => url?.trim()).filter(Boolean);
  if (!list.length) return "";
  return sanitizePdfUrl(list[list.length - 1]);
}

export function findSurveyQuotationRow(
  rows: SurveyQuotationApiRow[],
  customerId: string,
  surveyId?: string
): SurveyQuotationApiRow | undefined {
  if (surveyId) {
    return rows.find((row) => String(row.survey_id) === surveyId);
  }
  return rows.find((row) => String(row.customerId) === customerId);
}

export function mapSurveyQuotationListItem(
  row: SurveyQuotationApiRow,
  index: number,
  meta?: {
    leadId?: string;
    salesManagerName?: string;
    salesPersonName?: string;
  }
): WorkflowQuotationRow {
  const customerId = String(row.customerId || "");
  const surveyId = String(row.survey_id || "");
  const generatedUrl = getLatestQuotationUrl(row.generateQuotation);
  const signedUrl = getLatestQuotationUrl(row.uploadSignedQuotation);
  const quotationStatus = (row.quotationStatus || "pending").toLowerCase();
  const surveyName = (row.surveyName || "").trim() || `Room${index + 1}`;

  return {
    _id: surveyId || `${customerId}-${index}`,
    customerId,
    surveyId,
    leadId: meta?.leadId || "—",
    customerName: row.customerName || "—",
    surveyName,
    salesManager: meta?.salesManagerName || "—",
    salesPerson: meta?.salesPersonName || "—",
    generatedPdfUrl: generatedUrl,
    generatedPdfName: "Generated",
    signedPdfUrl: signedUrl,
    signedPdfName: "Signed",
    quotationStatus,
    statusLabel: formatQuotationStatusLabel(quotationStatus),
  };
}

export function mapSurveyQuotationFiles(row: SurveyQuotationApiRow | undefined): {
  generated: QuotationFile | null;
  signed: QuotationFile | null;
} {
  const generatedUrl = getLatestQuotationUrl(row?.generateQuotation);
  const signedUrl = getLatestQuotationUrl(row?.uploadSignedQuotation);

  return {
    generated: generatedUrl
      ? { url: generatedUrl, pdfName: "Generated Quotation" }
      : null,
    signed: signedUrl ? { url: signedUrl, pdfName: "Signed Quotation" } : null,
  };
}
