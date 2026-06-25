"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(authenticated)/dashboard.module.css";
import docStyles from "@/app/(authenticated)/workflow/quotations/quotations-view.module.css";
import modalStyles from "@/app/(authenticated)/workflow/workflow-details.module.css";
import { adminApi } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import {
  fetchInvoiceDetail,
  getInvoiceStatusColor,
  type InvoiceDetail,
} from "@/lib/invoice-utils";
import { sanitizePdfUrl } from "@/lib/quotation-utils";
import { formatDate } from "@/lib/dateUtils";
import { CheckCircle2, Download, FileText, Loader2, X } from "lucide-react";
import { toast } from "react-toastify";

interface InvoiceDetailViewProps {
  surveyId: string;
  variant?: "view" | "edit";
}

export function InvoiceDetailView({ surveyId, variant = "view" }: InvoiceDetailViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);

  const canCreateInvoices = hasPermission("Invoices", "create");
  const canEditInvoices = hasPermission("Invoices", "edit");
  const canManage = canCreateInvoices || canEditInvoices;
  const isEdit = variant === "edit";
  const backUrl = "/invoices";

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchInvoiceDetail(surveyId);
      setDetail(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load invoice details.";
      toast.error(message);
      router.push(backUrl);
    } finally {
      setLoading(false);
    }
  }, [router, surveyId]);

  useEffect(() => {
    if (surveyId) loadDetail();
  }, [surveyId, loadDetail]);

  async function handleGenerate() {
    if (!detail) return;
    if (!window.confirm(`Generate invoice for "${detail.customerName}" (${detail.surveyName})?`)) return;

    try {
      setGenerating(true);
      const response = await adminApi.createInvoice(surveyId);
      const pdfUrl = sanitizePdfUrl(String(response.pdfUrl || ""));
      toast.success(response.message || "Invoice generated successfully.");
      if (pdfUrl) window.open(pdfUrl, "_blank", "noopener,noreferrer");
      await loadDetail();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate invoice.";
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleMarkFullyPaid() {
    if (!detail) return;
    if (
      !window.confirm(
        `Mark invoice for "${detail.customerName}" (${detail.surveyName}) as fully paid?`
      )
    ) {
      return;
    }

    try {
      setMarkingPaid(true);
      const response = await adminApi.markInvoiceFullyPaid(surveyId);
      toast.success(response.message || "Invoice marked as fully paid.");
      await loadDetail();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to mark invoice as fully paid.";
      toast.error(message);
    } finally {
      setMarkingPaid(false);
    }
  }

  function handleViewPdf() {
    if (!detail?.pdfUrl) {
      toast.info("No invoice PDF available to view.");
      return;
    }
    window.open(detail.pdfUrl, "_blank", "noopener,noreferrer");
  }

  function handleDownload() {
    if (!detail?.pdfUrl) {
      toast.info("No invoice PDF available to download.");
      return;
    }
    const link = document.createElement("a");
    link.href = detail.pdfUrl;
    link.download = `invoice-${detail.invoiceNo}.pdf`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className={styles.spinner} />
      </div>
    );
  }

  if (!detail) return null;

  const statusColor = getInvoiceStatusColor(detail.status);
  const statusDisplay = detail.hasPdf ? detail.statusLabel : "Ready to Generate";
  const breadcrumbLabel = isEdit ? "EDIT INVOICE" : "VIEW INVOICE";

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push(backUrl)}>
          INVOICES
        </span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>{breadcrumbLabel}</span>
      </div>

      <div className={styles.pageHeader} style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className={styles.welcomeText}>Invoice: {detail.customerName}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
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
              {statusDisplay}
            </span>
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
              {detail.recordId}
            </span>
          </div>
        </div>
      </div>

      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <FileText size={22} color="var(--admin-primary, #004d4d)" /> Invoice Details
        </div>
        <div className={docStyles.fixtureTableCard}>
          <div className={docStyles.fixtureTableWrap}>
            <table className={docStyles.fixtureTable}>
              <tbody>
                <tr>
                  <td className={docStyles.fixtureColName} style={{ fontWeight: 700, color: "#64748b" }}>ID</td>
                  <td className={docStyles.fixtureColName}>{detail.recordId}</td>
                </tr>
                <tr>
                  <td className={docStyles.fixtureColName} style={{ fontWeight: 700, color: "#64748b" }}>Customer</td>
                  <td className={docStyles.fixtureColName}>{detail.customerName}</td>
                </tr>
                <tr>
                  <td className={docStyles.fixtureColName} style={{ fontWeight: 700, color: "#64748b" }}>Invoice No</td>
                  <td className={docStyles.fixtureColName}>{detail.invoiceNo}</td>
                </tr>
                <tr>
                  <td className={docStyles.fixtureColName} style={{ fontWeight: 700, color: "#64748b" }}>Invoice Date</td>
                  <td className={docStyles.fixtureColName}>
                    {detail.invoiceDate ? formatDate(detail.invoiceDate) : "—"}
                  </td>
                </tr>
                <tr className={docStyles.fixtureRowLast}>
                  <td className={docStyles.fixtureColName} style={{ fontWeight: 700, color: "#64748b" }}>Survey</td>
                  <td className={docStyles.fixtureColName}>{detail.surveyName}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <FileText size={22} color="var(--admin-primary, #004d4d)" /> Invoice Documents
        </div>
        <p className={styles.sectionSubtitle}>Generated invoice PDF for this survey.</p>

        <div className={docStyles.documentList}>
          <div className={docStyles.documentCard}>
            <div>
              <span className={docStyles.documentLabel}>Generated Invoice</span>
              {detail.invoiceDate ? (
                <span className={docStyles.documentTimestamp}>{formatDate(detail.invoiceDate)}</span>
              ) : null}
              {!detail.hasPdf ? (
                <p className={docStyles.emptyHint}>No invoice PDF generated yet.</p>
              ) : null}
            </div>

            <div className={docStyles.documentActions}>
              {detail.hasPdf ? (
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
                      onClick={handleViewPdf}
                    >
                      <FileText size={18} color="#dc2626" />
                    </button>
                  </div>
                  <button type="button" className={modalStyles.viewImgBtn} onClick={handleViewPdf}>
                    VIEW
                  </button>
                </>
              ) : isEdit && canManage ? (
                <button
                  type="button"
                  className={styles.createBtn}
                  onClick={handleGenerate}
                  disabled={generating}
                  style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                >
                  {generating ? <Loader2 size={16} className={styles.spinner} /> : <FileText size={16} />}
                  {generating ? "Generating..." : "Generate Invoice"}
                </button>
              ) : (
                <span className={docStyles.emptyHint}>—</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div
        className={styles.actionFooter}
        style={
          isEdit
            ? {
                background: "#f1f5f9",
                padding: "2.5rem",
                borderRadius: "16px",
                marginTop: "3rem",
                justifyContent: "flex-end",
              }
            : undefined
        }
      >
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => router.push(backUrl)}
          style={isEdit ? { padding: "0.875rem 3rem", background: "#64748b", color: "#ffffff" } : undefined}
        >
          <X size={20} /> Close
        </button>

        {detail.hasPdf ? (
          <button type="button" className={styles.createBtn} onClick={handleViewPdf}>
            <FileText size={18} /> View PDF
          </button>
        ) : null}

        {isEdit && !detail.hasPdf && canManage ? (
          <button
            type="button"
            className={styles.createBtn}
            onClick={handleGenerate}
            disabled={generating}
            style={isEdit ? { padding: "0.875rem 3rem" } : undefined}
          >
            {generating ? <Loader2 size={18} className={styles.spinner} /> : <FileText size={18} />}
            {generating ? "Generating..." : "Generate Invoice"}
          </button>
        ) : null}

        {isEdit && detail.hasPdf && detail.status !== "fully_paid" && canManage ? (
          <button
            type="button"
            className={styles.createBtn}
            onClick={handleMarkFullyPaid}
            disabled={markingPaid}
            style={{ background: "#10b981", ...(isEdit ? { padding: "0.875rem 3rem" } : {}) }}
          >
            {markingPaid ? <Loader2 size={18} className={styles.spinner} /> : <CheckCircle2 size={18} />}
            {markingPaid ? "Updating..." : "Mark Fully Paid"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
