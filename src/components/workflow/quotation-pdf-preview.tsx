"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(authenticated)/dashboard.module.css";
import docStyles from "@/app/(authenticated)/workflow/quotations/quotations-view.module.css";
import addStyles from "@/app/(authenticated)/leads/add/leads-add.module.css";
import modalStyles from "@/app/(authenticated)/workflow/workflow-details.module.css";
import { SignedQuotationUpload } from "@/components/workflow/signed-quotation-upload";
import { adminApi } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import {
  findSurveyQuotationRow,
  formatQuotationCardDate,
  formatQuotationStatusLabel,
  mapSurveyQuotationFiles,
  type QuotationFile,
  type SurveyQuotationApiRow,
} from "@/lib/quotation-utils";
import { CheckCircle2, Download, FileText, Loader2, X } from "lucide-react";
import { toast } from "react-toastify";

function getQuotationStatusColor(status: string): string {
  const normalized = status?.toLowerCase();
  if (normalized === "approved") return "#10b981";
  if (normalized === "pending") return "#f59e0b";
  return "#64748b";
}

function downloadPdf(file: QuotationFile) {
  const link = document.createElement("a");
  link.href = file.url;
  link.download = file.pdfName || "quotation.pdf";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
    downloadPdf(file);
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

interface QuotationProfileHeaderProps {
  customerName: string;
  statusLabel: string;
  statusColor: string;
  company: string;
}

function QuotationProfileHeader({
  customerName,
  statusLabel,
  statusColor,
  company,
}: QuotationProfileHeaderProps) {
  return (
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
  );
}

interface QuotationPdfPreviewProps {
  customerId: string;
  surveyId?: string;
  fromTab?: string;
  variant?: "view" | "edit";
}

export function QuotationPdfPreview({
  customerId,
  surveyId,
  fromTab = "Quotations",
  variant = "view",
}: QuotationPdfPreviewProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [customerName, setCustomerName] = useState("Customer");
  const [company, setCompany] = useState("—");
  const [quotationStatus, setQuotationStatus] = useState("pending");
  const [generatedFile, setGeneratedFile] = useState<QuotationFile | null>(null);
  const [signedFile, setSignedFile] = useState<QuotationFile | null>(null);
  const [activePdf, setActivePdf] = useState<"generated" | "signed">("generated");
  const [resolvedSurveyId, setResolvedSurveyId] = useState(surveyId || "");
  const [surveyName, setSurveyName] = useState("");

  const canUploadSign = hasPermission("Surveys", "create");
  const canVerify = hasPermission("Surveys", "edit");

  const backUrl = `/workflow?tab=${fromTab}`;
  const statusLabel = formatQuotationStatusLabel(quotationStatus);
  const statusColor = getQuotationStatusColor(quotationStatus);
  const isApproved = quotationStatus.toLowerCase() === "approved";
  const breadcrumbLabel = variant === "edit" ? "EDIT QUOTATION" : "VIEW QUOTATION";

  const displayFile = useMemo(() => {
    if (activePdf === "signed" && signedFile) return signedFile;
    if (generatedFile) return generatedFile;
    return signedFile;
  }, [activePdf, generatedFile, signedFile]);

  const fetchQuotationDetails = async () => {
    setLoading(true);
    try {
      const quotationsRes = await adminApi.getQuotationsAdmin();
      const quotations = (quotationsRes.quotations || []) as SurveyQuotationApiRow[];
      const quotation = findSurveyQuotationRow(quotations, customerId, surveyId);

      if (!quotation) {
        toast.error("Quotation record not found for this survey.");
        router.push(backUrl);
        return;
      }

      const files = mapSurveyQuotationFiles(quotation);

      setResolvedSurveyId(String(quotation.survey_id || surveyId || ""));
      setCustomerName(quotation.customerName || "Customer");
      setSurveyName((quotation.surveyName || "").trim());
      setCompany("—");
      setQuotationStatus((quotation.quotationStatus as string) || "pending");
      setGeneratedFile(files.generated);
      setSignedFile(files.signed);
      setActivePdf(files.generated ? "generated" : "signed");
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
  }, [customerId, surveyId]);

  const handleVerify = async () => {
    if (!signedFile) {
      toast.error("Upload a signed quotation before verifying.");
      return;
    }
    if (isApproved) {
      toast.info("This quotation is already verified.");
      return;
    }
    if (!window.confirm(`Verify quotation for ${customerName}?`)) return;

    try {
      setVerifying(true);
      if (!resolvedSurveyId) {
        toast.error("Survey ID is missing for this quotation.");
        return;
      }

      const response = await adminApi.approveQuotation(resolvedSurveyId);
      toast.success(response.message || "Quotation verified successfully.");
      await fetchQuotationDetails();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to verify quotation.";
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  };

  const handleDownload = () => {
    if (!displayFile) {
      toast.error("No quotation PDF available to download.");
      return;
    }
    downloadPdf(displayFile);
  };

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
        <span className={styles.breadcrumbCurrent}>{breadcrumbLabel}</span>
      </div>

      {variant === "edit" ? (
        <>
          <QuotationProfileHeader
            customerName={customerName}
            statusLabel={statusLabel}
            statusColor={statusColor}
            company={company}
          />

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
                      surveyId={resolvedSurveyId}
                      onUploaded={fetchQuotationDetails}
                    />
                  ) : undefined
                }
                trailingAction={
                  canUploadSign && signedFile ? (
                    <SignedQuotationUpload
                      customerId={customerId}
                      surveyId={resolvedSurveyId}
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

            {canVerify ? (
              <button
                type="button"
                className={styles.createBtn}
                onClick={handleVerify}
                disabled={verifying || isApproved || !signedFile}
                style={{
                  padding: "0.875rem 3rem",
                  background: isApproved ? "#94a3b8" : "#10b981",
                }}
              >
                {verifying ? (
                  <Loader2 size={18} className={styles.spinner} />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                {verifying ? "Verifying..." : isApproved ? "Verified" : "Verify"}
              </button>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <QuotationProfileHeader
            customerName={customerName}
            statusLabel={statusLabel}
            statusColor={statusColor}
            company={company}
          />

          {generatedFile && signedFile ? (
            <div className={docStyles.pdfTabs}>
              <button
                type="button"
                className={`${docStyles.pdfTab} ${activePdf === "generated" ? docStyles.pdfTabActive : ""}`}
                onClick={() => setActivePdf("generated")}
              >
                Generated PDF
              </button>
              <button
                type="button"
                className={`${docStyles.pdfTab} ${activePdf === "signed" ? docStyles.pdfTabActive : ""}`}
                onClick={() => setActivePdf("signed")}
              >
                Signed PDF
              </button>
            </div>
          ) : null}

          <section className={docStyles.pdfViewerSection}>
            {displayFile ? (
              <iframe
                title={`Quotation PDF - ${customerName}`}
                src={displayFile.url}
                className={docStyles.pdfFrame}
              />
            ) : (
              <div className={addStyles.emptyState}>
                <p>No quotation PDF available for this customer.</p>
              </div>
            )}
          </section>

          <div className={styles.actionFooter}>
            <button type="button" className={styles.cancelBtn} onClick={() => router.push(backUrl)}>
              <X size={20} /> Cancel
            </button>

            {canVerify ? (
              <button
                type="button"
                className={styles.createBtn}
                onClick={handleVerify}
                disabled={verifying || isApproved || !signedFile}
                style={{ background: isApproved ? "#94a3b8" : "#10b981" }}
              >
                {verifying ? (
                  <Loader2 size={18} className={styles.spinner} />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                {verifying ? "Verifying..." : isApproved ? "Verified" : "Verify"}
              </button>
            ) : null}

            <button
              type="button"
              className={styles.createBtn}
              onClick={handleDownload}
              disabled={!displayFile}
            >
              <Download size={18} /> Download
            </button>
          </div>
        </>
      )}
    </div>
  );
}
