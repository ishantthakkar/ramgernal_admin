"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { QuotationPdfPreview } from "@/components/workflow/quotation-pdf-preview";
import { canAccessWorkflowQuotations } from "@/lib/permissions";

export default function QuotationViewPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const customerId = params.id as string;
  const fromTab = searchParams.get("from") || "Quotations";
  const surveyId = searchParams.get("surveyId") || undefined;
  const canViewQuotations = canAccessWorkflowQuotations();

  useEffect(() => {
    if (!canViewQuotations) {
      toast.error("You do not have permission to view quotations.");
      router.replace("/workflow?tab=Surveys");
    }
  }, [canViewQuotations, router]);

  if (!canViewQuotations) {
    return null;
  }

  return (
    <QuotationPdfPreview
      customerId={customerId}
      surveyId={surveyId}
      fromTab={fromTab}
    />
  );
}
