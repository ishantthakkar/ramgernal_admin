"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(authenticated)/dashboard.module.css";
import docStyles from "@/app/(authenticated)/workflow/quotations/quotations-view.module.css";
import modalStyles from "@/app/(authenticated)/workflow/workflow-details.module.css";
import paymentStyles from "@/app/(authenticated)/commissions/view/payable-view.module.css";
import paymentModalStyles from "@/app/(authenticated)/commissions/commissions-modal.module.css";
import { adminApi } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import {
  fetchInvoiceDetail,
  formatMoney,
  getInvoiceStatusColor,
  INVOICE_PAYMENT_METHODS,
  type InvoiceDetail,
} from "@/lib/invoice-utils";
import { sanitizePdfUrl } from "@/lib/quotation-utils";
import { formatDate } from "@/lib/dateUtils";
import {
  CheckCircle2,
  ChevronDown,
  DollarSign,
  Download,
  FileText,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

interface InvoiceDetailViewProps {
  surveyId: string;
  variant?: "view" | "edit";
}

export function InvoiceDetailView({ surveyId, variant = "view" }: InvoiceDetailViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "",
    paymentDate: new Date().toISOString().split("T")[0],
    note: "",
  });

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

  async function handleAddPayment() {
    if (!detail) return;

    const amount = parseFloat(paymentForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid payment amount.");
      return;
    }
    if (amount > detail.pendingAmount) {
      toast.error(`Payment cannot exceed pending balance of ${formatMoney(detail.pendingAmount)}.`);
      return;
    }
    if (!paymentForm.paymentMethod) {
      toast.error("Select a payment method.");
      return;
    }

    try {
      setSavingPayment(true);
      const response = await adminApi.addInvoicePayment(surveyId, {
        amount,
        paymentMethod: paymentForm.paymentMethod,
        paymentDate: paymentForm.paymentDate,
        note: paymentForm.note,
      });
      toast.success(response.message || "Payment recorded successfully.");
      setShowAddPayment(false);
      setPaymentForm({
        amount: "",
        paymentMethod: "",
        paymentDate: new Date().toISOString().split("T")[0],
        note: "",
      });
      await loadDetail();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to record payment.";
      toast.error(message);
    } finally {
      setSavingPayment(false);
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

  const statusColor = getInvoiceStatusColor(detail.status, {
    hasPdf: detail.hasPdf,
    paidAmount: detail.paidAmount,
    pendingAmount: detail.pendingAmount,
    invoiceAmount: detail.invoiceAmount,
  });
  const breadcrumbLabel = isEdit ? "EDIT INVOICE" : "VIEW INVOICE";
  const canAddPayment = isEdit && detail.hasPdf && detail.pendingAmount > 0 && canManage;

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
              {detail.statusLabel}
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
                <tr className={detail.hasPdf ? undefined : docStyles.fixtureRowLast}>
                  <td className={docStyles.fixtureColName} style={{ fontWeight: 700, color: "#64748b" }}>Survey</td>
                  <td className={docStyles.fixtureColName}>{detail.surveyName}</td>
                </tr>
                {detail.hasPdf ? (
                  <>
                    <tr>
                      <td className={docStyles.fixtureColName} style={{ fontWeight: 700, color: "#64748b" }}>
                        Invoice Amount
                      </td>
                      <td className={docStyles.fixtureColName} style={{ fontWeight: 700, color: "#1e293b" }}>
                        {formatMoney(detail.invoiceAmount)}
                      </td>
                    </tr>
                    <tr>
                      <td className={docStyles.fixtureColName} style={{ fontWeight: 700, color: "#64748b" }}>
                        Paid
                      </td>
                      <td className={docStyles.fixtureColName} style={{ fontWeight: 700, color: "#059669" }}>
                        {formatMoney(detail.paidAmount)}
                      </td>
                    </tr>
                    <tr className={docStyles.fixtureRowLast}>
                      <td className={docStyles.fixtureColName} style={{ fontWeight: 700, color: "#64748b" }}>
                        Pending
                      </td>
                      <td className={docStyles.fixtureColName} style={{ fontWeight: 700, color: "#d97706" }}>
                        {formatMoney(detail.pendingAmount)}
                      </td>
                    </tr>
                  </>
                ) : null}
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

      {detail.hasPdf ? (
        <section className={styles.formSection}>
          <div className={paymentStyles.paymentSectionHeader}>
            <div>
              <div className={styles.sectionTitle} style={{ marginBottom: "0.35rem" }}>
                <DollarSign size={22} color="var(--admin-primary, #004d4d)" /> Payment History
              </div>
              <p className={styles.sectionSubtitle} style={{ margin: 0 }}>
                Pending balance:{" "}
                <strong style={{ color: "#d97706" }}>{formatMoney(detail.pendingAmount)}</strong>
              </p>
            </div>
            {canAddPayment ? (
              <button
                type="button"
                className={styles.addBtn}
                onClick={() => setShowAddPayment(true)}
              >
                <Plus size={20} /> Add Payment
              </button>
            ) : null}
          </div>

          {detail.payments.length === 0 ? (
            <div className={paymentStyles.emptyState}>No payments recorded yet.</div>
          ) : (
            <div className={styles.userTableContainer}>
              <table className={paymentStyles.paymentTable}>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.payments.map((payment, idx) => (
                    <tr key={payment._id || `${payment.paymentDate}-${idx}`}>
                      <td className={paymentStyles.indexCell}>{idx + 1}</td>
                      <td className={paymentStyles.dateCell}>
                        {payment.paymentDate ? formatDate(payment.paymentDate) : "—"}
                      </td>
                      <td className={paymentStyles.amountCell}>{formatMoney(payment.amount)}</td>
                      <td className={paymentStyles.methodCell}>{payment.paymentMethod || "—"}</td>
                      <td className={paymentStyles.methodCell}>
                        {payment.note?.trim() ? payment.note : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

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

        {canAddPayment ? (
          <button
            type="button"
            className={styles.createBtn}
            onClick={() => setShowAddPayment(true)}
            style={{ background: "#10b981", ...(isEdit ? { padding: "0.875rem 3rem" } : {}) }}
          >
            <Plus size={18} /> Add Payment
          </button>
        ) : null}
      </div>

      {showAddPayment && detail ? (
        <div
          className={paymentModalStyles.modalOverlay}
          onClick={() => !savingPayment && setShowAddPayment(false)}
        >
          <div className={paymentModalStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={paymentModalStyles.modalHeader}>
              <div>
                <h3>Add Payment</h3>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.2rem" }}>
                  Pending balance:{" "}
                  <strong style={{ color: "#d97706" }}>{formatMoney(detail.pendingAmount)}</strong>
                </div>
              </div>
              <button
                type="button"
                className={paymentModalStyles.closeBtn}
                onClick={() => !savingPayment && setShowAddPayment(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className={paymentModalStyles.modalBody}>
              <div className={paymentModalStyles.formGrid}>
                <div className={paymentModalStyles.formGroup}>
                  <label>
                    Amount <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    max={detail.pendingAmount}
                    className={paymentModalStyles.formInput}
                    placeholder="0.00"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                  />
                </div>

                <div className={paymentModalStyles.formGroup}>
                  <label>
                    Payment Method <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <select
                      className={paymentModalStyles.formSelect}
                      value={paymentForm.paymentMethod}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({ ...prev, paymentMethod: e.target.value }))
                      }
                    >
                      <option value="">Select Method</option>
                      {INVOICE_PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      style={{
                        position: "absolute",
                        right: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                        color: "#64748b",
                      }}
                    />
                  </div>
                </div>

                <div className={paymentModalStyles.formGroup}>
                  <label>
                    Date <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="date"
                    className={paymentModalStyles.formInput}
                    value={paymentForm.paymentDate}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))
                    }
                  />
                </div>

                <div className={paymentModalStyles.formGroup} style={{ gridColumn: "1 / -1" }}>
                  <label>Note</label>
                  <input
                    type="text"
                    className={paymentModalStyles.formInput}
                    placeholder="Check number, reference, etc."
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, note: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className={paymentModalStyles.modalFooter}>
              <button
                type="button"
                className={paymentModalStyles.cancelBtn}
                onClick={() => setShowAddPayment(false)}
                disabled={savingPayment}
              >
                <X size={18} /> Cancel
              </button>
              <button
                type="button"
                className={paymentModalStyles.saveBtn}
                onClick={handleAddPayment}
                disabled={savingPayment}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                {savingPayment ? <Loader2 size={18} className={styles.spinner} /> : <CheckCircle2 size={18} />}
                {savingPayment ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
