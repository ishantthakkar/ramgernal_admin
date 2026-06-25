"use client";

import { useParams } from "next/navigation";
import { InvoiceDetailView } from "@/components/invoices/invoice-detail-view";

export default function InvoiceEditPage() {
  const params = useParams();
  const surveyId = params.id as string;

  return <InvoiceDetailView surveyId={surveyId} variant="edit" />;
}
