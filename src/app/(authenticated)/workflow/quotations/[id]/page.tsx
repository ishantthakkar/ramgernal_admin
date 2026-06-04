"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import styles from "../../../dashboard.module.css";
import modalStyles from "../../workflow-details.module.css";
import docStyles from "../quotations-view.module.css";
import addStyles from "../../../leads/add/leads-add.module.css";
import { SignedQuotationUpload } from "@/components/workflow/signed-quotation-upload";
import { adminApi } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import {
  formatQuotationCardDate,
  formatQuotationStatusLabel,
  getGeneratedQuotationFromCustomer,
  getSignedQuotationFromCustomer,
  mapQuotationFile,
  type QuotationFile,
} from "@/lib/quotation-utils";
import { Download, FileText, Loader2, X } from "lucide-react";
import { toast } from "react-toastify";

function getQuotationStatusColor(status: string): string {
  const normalized = status?.toLowerCase();
  if (normalized === "approved") return "#10b981";
  if (normalized === "pending") return "#f59e0b";
  return "#64748b";
}

interface QuotationDocumentCardProps {
  title: string;
  file: QuotationFile | null;
  emptyLabel?: string;
  emptyAction?: React.ReactNode;
  trailingAction?: React.ReactNode;
}

function QuotationDocumentCard({
  title,
  file,
  emptyLabel,
  emptyAction,
  trailingAction,
}: QuotationDocumentCardProps) {
  const timestamp = file ? formatQuotationCardDate(file.createdAt) : "";

  const handleDownload = () => {
    if (!file?.url) return;
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.pdfName || "quotation.pdf";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = () => {
    if (!file?.url) return;
    window.open(file.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={docStyles.documentCard}>
      <div>
        <span className={docStyles.documentLabel}>{title}</span>
        {timestamp ? <span className={docStyles.documentTimestamp}>{timestamp}</span> : null}
        {!file && emptyLabel ? <p className={docStyles.emptyHint}>{emptyLabel}</p> : null}
      </div>

      <div className={docStyles.documentActions}>
        {file ? (
          <>
            <div className={docStyles.iconGroup}>
              <button
                type="button"
                className={docStyles.iconBtn}
                title="Download PDF"
                onClick={handleDownload}
              >
                <Download size={18} />
              </button>
              <div className={docStyles.iconBtnDivider} />
              <button
                type="button"
                className={docStyles.iconBtn}
                title="Open PDF"
                onClick={handleView}
              >
                <FileText size={18} color="#dc2626" />
              </button>
            </div>
            <button type="button" className={modalStyles.viewImgBtn} onClick={handleView}>
              VIEW
            </button>
            {trailingAction}
          </>
        ) : (
          emptyAction || trailingAction || <span className={docStyles.emptyHint}>—</span>
        )}
      </div>
    </div>
  );
}

export default function QuotationViewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = params.id as string;
  const fromTab = searchParams.get("from") || "Quotations";

  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("Customer");
  const [company, setCompany] = useState("—");
  const [quotationStatus, setQuotationStatus] = useState("pending");
  const [generatedFile, setGeneratedFile] = useState<QuotationFile | null>(null);
  const [signedFile, setSignedFile] = useState<QuotationFile | null>(null);

  const canUploadSign = hasPermission("Surveys", "create");

  const backUrl = `/workflow?tab=${fromTab}`;
  const statusLabel = formatQuotationStatusLabel(quotationStatus);
  const statusColor = getQuotationStatusColor(quotationStatus);

  const fetchQuotationDetails = async () => {
    setLoading(true);
    try {
      const quotationsRes = await adminApi.getQuotationsAdmin();
      const customers = quotationsRes.customers || [];
      const customer = customers.find(
        (row: Record<string, unknown>) => String(row.customerId) === customerId
      );

      if (!customer) {
        toast.error("Quotation record not found for this customer.");
        router.push(backUrl);
        return;
      }

      setCustomerName((customer.customerName as string) || "Customer");
      setCompany((customer.company as string) || "—");
      setQuotationStatus((customer.quotationStatus as string) || "pending");
      setGeneratedFile(mapQuotationFile(getGeneratedQuotationFromCustomer(customer)));
      setSignedFile(mapQuotationFile(getSignedQuotationFromCustomer(customer)));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load quotation details.";
      toast.error(message);
      router.push(backUrl);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchQuotationDetails();
    }
  }, [customerId]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push(backUrl)}>
          WORKFLOW
        </span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>VIEW QUOTATION</span>
      </div>

      <div className={styles.pageHeader} style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className={styles.welcomeText}>Quotation Profile: {customerName}</h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                backgroundColor: `${statusColor}15`,
                color: statusColor,
                padding: "0.25rem 0.75rem",
                borderRadius: "99px",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {statusLabel}
            </span>
            {company && company !== "—" ? (
              <span
                style={{
                  backgroundColor: "#f1f5f9",
                  color: "#64748b",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "99px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                {company}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <FileText size={22} color="var(--admin-primary, #004d4d)" /> Quotation Documents
        </div>
        <p className={styles.sectionSubtitle}>
          Generated quotation PDF and customer-signed copy.
        </p>

        <div className={docStyles.documentList}>
          <QuotationDocumentCard
            title="Generated Quotation"
            file={generatedFile}
            emptyLabel="No generated quotation PDF yet."
          />

          <QuotationDocumentCard
            title="Signed Quotation"
            file={signedFile}
            emptyLabel="No signed quotation uploaded yet."
            emptyAction={
              canUploadSign ? (
                <SignedQuotationUpload
                  customerId={customerId}
                  onUploaded={fetchQuotationDetails}
                />
              ) : undefined
            }
            trailingAction={
              canUploadSign && signedFile ? (
                <SignedQuotationUpload
                  customerId={customerId}
                  onUploaded={fetchQuotationDetails}
                  hasSignedFile
                  variant="outline"
                />
              ) : undefined
            }
          />
        </div>

        {!generatedFile && !signedFile ? (
          <div className={addStyles.emptyState} style={{ marginTop: "1rem" }}>
            No quotation documents available for this customer.
          </div>
        ) : null}
      </section>

      <div
        className={styles.actionFooter}
        style={{
          background: "#f1f5f9",
          padding: "2.5rem",
          borderRadius: "16px",
          marginTop: "3rem",
          justifyContent: "flex-end",
        }}
      >
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => router.push(backUrl)}
          style={{ padding: "0.875rem 3rem", background: "#64748b", color: "#ffffff" }}
        >
          <X size={20} /> Close
        </button>
      </div>

    </div>
  );
}
