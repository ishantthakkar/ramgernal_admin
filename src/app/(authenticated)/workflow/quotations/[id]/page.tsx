"use client";

import { useParams, useSearchParams } from "next/navigation";
import { QuotationPdfPreview } from "@/components/workflow/quotation-pdf-preview";

export default function QuotationViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const customerId = params.id as string;
  const fromTab = searchParams.get("from") || "Quotations";

  return (
    <QuotationPdfPreview customerId={customerId} fromTab={fromTab} variant="view" />
  );
}
