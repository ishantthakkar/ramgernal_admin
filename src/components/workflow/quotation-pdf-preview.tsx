"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(authenticated)/dashboard.module.css";
import docStyles from "@/app/(authenticated)/workflow/quotations/quotations-view.module.css";
import modalStyles from "@/app/(authenticated)/workflow/workflow-details.module.css";
import { SignedQuotationUpload } from "@/components/workflow/signed-quotation-upload";
import { QuotationFixtureTable, type QuotationProductOption } from "@/components/workflow/quotation-fixture-table";
import { adminApi } from "@/lib/api";
import {
  canApproveQuotation,
  canGenerateQuotation,
  canManageWorkflowQuotation,
  canViewQuotationFixtureTable,
} from "@/lib/permissions";
import {
  buildSurveyQuotationRowFromSurvey,
  findSurveyQuotationRow,
  formatQuotationCardDate,
  formatQuotationStatusLabel,
  mapQuotationFixtureRows,
  mapSurveyQuotationFiles,
  isQuotationFixtureSkuValid,
  type QuotationFixtureRow,
  type QuotationFile,
  type SurveyQuotationApiRow,
} from "@/lib/quotation-utils";
import { CheckCircle2, Download, FileText, Loader2, X } from "lucide-react";
import { toast } from "react-toastify";

const PRIMARY_ICON = "var(--admin-primary, #004d4d)";

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
            <button type="button" className={styles.assignBtn} onClick={handleView}>
              <FileText size={16} /> View
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

function formatPreviewAmount(amount: number | null): string {
  if (amount === null || !Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function QuotationPreviewAmount({ amount, loading }: { amount: number | null; loading: boolean }) {
  return (
    <section className={docStyles.previewAmountCard}>
      <div className={docStyles.previewAmountLabel}>Quotation Preview Amount</div>
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b" }}>
          <Loader2 size={20} className={styles.spinner} />
          <span>Calculating total...</span>
        </div>
      ) : (
        <>
          <div className={docStyles.previewAmountValue}>{formatPreviewAmount(amount)}</div>
        </>
      )}
    </section>
  );
}

interface QuotationPageHeaderProps {
  statusLabel: string;
  statusColor: string;
  company: string;
}

function QuotationPageHeader({ statusLabel, statusColor, company }: QuotationPageHeaderProps) {
  return (
    <div className={styles.pageHeader} style={{ marginBottom: "2rem" }}>
      <div>
        <h1 className={styles.welcomeText}>Quotation</h1>
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
}

export function QuotationPdfPreview({
  customerId,
  surveyId,
  fromTab = "Quotations",
}: QuotationPdfPreviewProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [customerName, setCustomerName] = useState("Customer");
  const [company, setCompany] = useState("—");
  const [quotationStatus, setQuotationStatus] = useState("pending");
  const [generatedFile, setGeneratedFile] = useState<QuotationFile | null>(null);
  const [signedFile, setSignedFile] = useState<QuotationFile | null>(null);
  const [resolvedSurveyId, setResolvedSurveyId] = useState(surveyId || "");
  const [previewAmount, setPreviewAmount] = useState<number | null>(null);
  const [loadingPreviewAmount, setLoadingPreviewAmount] = useState(false);
  const [fixtureRows, setFixtureRows] = useState<QuotationFixtureRow[]>([]);
  const [productOptions, setProductOptions] = useState<QuotationProductOption[]>([]);
  const [savingSkus, setSavingSkus] = useState(false);

  const isQuotationsTab = fromTab === "Quotations";
  const canViewFixtureTable = canViewQuotationFixtureTable();
  const showFixtureTable = isQuotationsTab && canViewFixtureTable;

  const canUploadSign = canManageWorkflowQuotation();
  const canVerify = canApproveQuotation();
  const canGenerate = canGenerateQuotation();

  const backUrl =
    fromTab === "Surveys" && customerId && surveyId
      ? `/workflow/view/${customerId}?from=Surveys&surveyId=${surveyId}`
      : `/workflow?tab=${fromTab}`;
  const statusLabel = formatQuotationStatusLabel(quotationStatus);
  const statusColor = getQuotationStatusColor(quotationStatus);
  const isApproved = quotationStatus.toLowerCase() === "approved";
  const breadcrumbLabel = "QUOTATION";

  const displayFile = useMemo(() => signedFile || generatedFile, [signedFile, generatedFile]);

  const loadPreviewAmount = async (activeSurveyId: string) => {
    if (isQuotationsTab || !activeSurveyId) {
      setPreviewAmount(null);
      return;
    }

    setLoadingPreviewAmount(true);
    try {
      const previewRes = await adminApi.previewQuotation(activeSurveyId);
      const estimate = previewRes.estimate as Record<string, unknown> | undefined;
      const total = Number(estimate?.grandTotal ?? 0);
      setPreviewAmount(Number.isFinite(total) ? total : null);
    } catch {
      setPreviewAmount(null);
    } finally {
      setLoadingPreviewAmount(false);
    }
  };

  const fetchProductOptions = async () => {
    try {
      const response = await adminApi.getProducts("Proposed Fixture");
      const products = (response.products || response.data || []) as Array<{
        sku?: string;
        name?: string;
      }>;
      setProductOptions(
        products
          .map((product) => ({
            sku: String(product.sku || "").trim(),
            name: String(product.name || "").trim(),
          }))
          .filter((product) => product.sku)
      );
    } catch {
      setProductOptions([]);
    }
  };

  const fetchQuotationDetails = async () => {
    setLoading(true);
    try {
      const customerRes = await adminApi.getCustomerWorkflowDetails(customerId);
      const customer = (customerRes.customer as Record<string, unknown>) || {};
      const surveys = (customerRes.surveys || []) as Record<string, unknown>[];

      let activeSurveyId = String(surveyId || resolvedSurveyId || "").trim();
      let surveyRecord = activeSurveyId
        ? surveys.find((item) => String(item._id || item.id || "") === activeSurveyId)
        : undefined;

      if (!surveyRecord && surveys.length === 1) {
        surveyRecord = surveys[0];
        activeSurveyId = String(surveyRecord._id || surveyRecord.id || "");
      }

      let quotation: SurveyQuotationApiRow | undefined = surveyRecord
        ? buildSurveyQuotationRowFromSurvey(surveyRecord, customer)
        : undefined;

      if (!quotation) {
        const quotationsRes = await adminApi.getQuotationsAdmin();
        const quotations = (quotationsRes.quotations || []) as SurveyQuotationApiRow[];
        quotation = findSurveyQuotationRow(quotations, customerId, activeSurveyId || surveyId);

        if (quotation && !surveyRecord && activeSurveyId) {
          surveyRecord = surveys.find(
            (item) => String(item._id || item.id || "") === activeSurveyId
          );
        }
      }

      if (!quotation) {
        toast.error("Survey not found for this quotation.");
        router.push(backUrl);
        return;
      }

      const files = mapSurveyQuotationFiles(quotation);
      const resolvedId = String(quotation.survey_id || activeSurveyId || "");

      if (!surveyRecord && resolvedId) {
        surveyRecord = surveys.find((item) => String(item._id || item.id || "") === resolvedId);
      }

      setResolvedSurveyId(resolvedId);
      setCustomerName(quotation.customerName || String(customer.name || "Customer"));
      setCompany(
        String(customer.company || customer.dba || "").trim() || "—"
      );
      setQuotationStatus((quotation.quotationStatus as string) || "pending");
      setFixtureRows(showFixtureTable ? mapQuotationFixtureRows(surveyRecord) : []);
      setGeneratedFile(files.generated);
      setSignedFile(files.signed);
      await loadPreviewAmount(resolvedId);
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
      if (showFixtureTable) {
        fetchProductOptions();
      }
    }
  }, [customerId, surveyId, showFixtureTable]);

  const handleSkuChange = (rowId: string, sku: string) => {
    setFixtureRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, sku } : row))
    );
  };

  const saveFixtureSkus = async (options?: { silent?: boolean }) => {
    if (!resolvedSurveyId) {
      toast.error("Survey ID is missing for this quotation.");
      return false;
    }

    const updates = fixtureRows
      .filter((row) => row.fixtureId && isQuotationFixtureSkuValid(row.sku))
      .map((row) => ({
        fixtureId: row.fixtureId,
        sku: row.sku.trim(),
      }));

    if (!updates.length || updates.length !== fixtureRows.length) {
      toast.error("Set a valid SKU for each proposed fixture before continuing.");
      return false;
    }

    try {
      setSavingSkus(true);
      const response = await adminApi.updateQuotationFixtureSkus(resolvedSurveyId, updates);
      if (!options?.silent) {
        toast.success(response.message || "Fixture SKUs saved.");
      }
      await fetchQuotationDetails();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save fixture SKUs.";
      toast.error(message);
      return false;
    } finally {
      setSavingSkus(false);
    }
  };

  const handleGenerate = async () => {
    if (!resolvedSurveyId) {
      toast.error("Survey ID is missing for this quotation.");
      return;
    }
    if (!window.confirm(`Generate quotation for ${customerName}?`)) return;

    try {
      setGenerating(true);
      if (showFixtureTable && fixtureRows.length > 0) {
        const skusSaved = await saveFixtureSkus({ silent: true });
        if (!skusSaved) return;
      }

      const response = await adminApi.createQuotation(resolvedSurveyId);
      toast.success(response.message || "Quotation generated successfully.");
      await fetchQuotationDetails();
      if (!isQuotationsTab) {
        await loadPreviewAmount(resolvedSurveyId);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate quotation.";
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

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

      if (showFixtureTable && fixtureRows.length > 0) {
        const skusSaved = await saveFixtureSkus({ silent: true });
        if (!skusSaved) return;
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

      <QuotationPageHeader
        statusLabel={statusLabel}
        statusColor={statusColor}
        company={company}
      />

      {showFixtureTable ? (
        <QuotationFixtureTable
          rows={fixtureRows}
          editable={!isApproved}
          productOptions={productOptions}
          onSkuChange={handleSkuChange}
        />
      ) : !isQuotationsTab ? (
        <QuotationPreviewAmount amount={previewAmount} loading={loadingPreviewAmount} />
      ) : null}

      <section className={styles.formSection}>
        <div className={`${styles.sectionTitle} ${modalStyles.viewSectionTitle}`}>
          <FileText size={22} color={PRIMARY_ICON} /> Quotation Documents
        </div>

        <div className={docStyles.documentList}>
          <QuotationDocumentCard
            title="Generated Quotation"
            file={generatedFile}
            emptyLabel="No generated quotation PDF yet."
            emptyAction={
              canGenerate && !generatedFile ? (
                <button
                  type="button"
                  className={styles.createBtn}
                  onClick={handleGenerate}
                  disabled={generating || !resolvedSurveyId}
                  style={{ marginTop: "0.75rem" }}
                >
                  {generating ? (
                    <Loader2 size={18} className={styles.spinner} />
                  ) : (
                    <FileText size={18} />
                  )}
                  {generating ? "Generating..." : "Generate Quotation"}
                </button>
              ) : undefined
            }
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
          <div className={modalStyles.viewEmptyState} style={{ marginTop: "1rem" }}>
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

        {displayFile ? (
          <button
            type="button"
            className={styles.assignBtn}
            onClick={handleDownload}
            style={{ padding: "0.875rem 3rem" }}
          >
            <Download size={18} /> Download
          </button>
        ) : null}

        {canVerify ? (
          <button
            type="button"
            className={styles.createBtn}
            onClick={handleVerify}
            disabled={verifying || savingSkus || isApproved || !signedFile}
            style={{
              padding: "0.875rem 3rem",
              background: isApproved ? "#94a3b8" : "#10b981",
            }}
          >
            {verifying || savingSkus ? (
              <Loader2 size={18} className={styles.spinner} />
            ) : (
              <CheckCircle2 size={18} />
            )}
            {verifying || savingSkus ? "Verifying..." : isApproved ? "Verified" : "Verify"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
