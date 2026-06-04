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
