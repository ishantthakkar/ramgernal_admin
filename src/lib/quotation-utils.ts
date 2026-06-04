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

export function getGeneratedQuotation(quotations: Record<string, unknown>[]) {
  const generated = (quotations || []).filter((q) => {
    const source = String(q.source || "");
    if (source === "generated") return true;
    return Boolean(q.surveyId);
  });
  return getLatestQuotation(generated);
}

export function getSignedQuotation(quotations: Record<string, unknown>[]) {
  const signed = (quotations || []).filter((q) => {
    const source = String(q.source || "");
    return source === "uploaded" && !q.surveyId;
  });
  return getLatestQuotation(signed);
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
