"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import styles from "../../../dashboard.module.css";
import viewStyles from "../payable-view.module.css";
import modalStyles from "../../commissions-modal.module.css";
import {
  X,
  Loader2,
  User,
  DollarSign,
  Plus,
  ChevronDown,
  CheckCircle2,
  Hash,
  Briefcase,
  FileText,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import { formatDate } from "@/lib/dateUtils";

interface PaymentEntry {
  _id?: string;
  amount: number;
  paymentMethod: string;
  note?: string;
  paymentDate: string;
  createdAt?: string;
}

interface CommissionMilestone {
  key: string;
  label: string;
  share: string;
  amount: number;
  unlocked: boolean;
}

interface PayableDetails {
  customerId: string;
  surveyId: string | null;
  commissionId: string | null;
  legalName: string;
  commission: number;
  eligible: number;
  paid: number;
  pending: number;
  locked: number;
  balance: number;
  milestones?: {
    projectApproved: boolean;
    invoiceFullyPaid: boolean;
    schedule: CommissionMilestone[];
  };
  leadId: string;
  leadSource: string;
  quotationNumber: string;
  quotationAmount: number;
  surveyName?: string;
  jobNo?: string;
  extraExpenses?: Array<{
    description: string;
    price: number;
    approvedAmount: number;
  }>;
  payments: PaymentEntry[];
}

const PAYMENT_METHODS = [
  "Cash",
  "ACH Transfer",
  "Wire Transfer",
  "Check",
  "Credit Card",
  "Debit Card",
  "PayPal",
  "Stripe",
  "Other",
];

const PRIMARY_ICON = "var(--admin-primary, #004d4d)";
const MUTED_ICON = "#64748b";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export default function ViewCommissionPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const surveyId = searchParams.get("surveyId") || undefined;
  const payableFor =
    searchParams.get("for") === "contractor"
      ? ("contractor" as const)
      : searchParams.get("for") === "sales-manager"
        ? ("sales-manager" as const)
        : searchParams.get("for") === "extra-expenses"
          ? ("extra-expenses" as const)
          : undefined;

  const isExtraExpenses = payableFor === "extra-expenses";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState<PayableDetails | null>(null);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "",
    paymentDate: new Date().toISOString().split("T")[0],
    note: "",
  });

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPayableDetails(id, { surveyId, for: payableFor });
      setDetails(response.details || null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load payable data.";
      console.error("Failed to fetch payable details:", err);
      toast.error(message);
      setDetails(null);
    } finally {
      setLoading(false);
    }
  }, [id, surveyId, payableFor]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleAddPayment = async () => {
    if (!details?.surveyId) {
      toast.error("Survey not found for this payable.");
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid payment amount.");
      return;
    }
    if (amount > details.pending) {
      toast.error(`Payment cannot exceed payable amount of ${formatMoney(details.pending)}.`);
      return;
    }
    if (!paymentForm.paymentMethod) {
      toast.error("Select a payment method.");
      return;
    }

    try {
      setSaving(true);
      await adminApi.addCommissionPayment(id, {
        surveyId: details.surveyId,
        ...(payableFor ? { for: payableFor } : {}),
        amount,
        paymentMethod: paymentForm.paymentMethod,
        paymentDate: paymentForm.paymentDate,
        note: paymentForm.note,
      });
      await fetchDetails();
      setShowAddPayment(false);
      setPaymentForm({
        amount: "",
        paymentMethod: "",
        paymentDate: new Date().toISOString().split("T")[0],
        note: "",
      });
      toast.success("Payment added successfully.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add payment.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className={styles.spinner} />
      </div>
    );
  }

  if (!details) {
    return (
      <div className={styles.addUserPage}>
        <div className={styles.breadcrumb}>
          ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
          <span style={{ cursor: "pointer" }} onClick={() => router.push("/commissions")}>
            PAYABLES
          </span>
        </div>
        <div className={viewStyles.emptyState} style={{ marginTop: "2rem" }}>
          Payable details not found.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/commissions")}>
          PAYABLES
        </span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>
          {isExtraExpenses ? "VIEW EXTRA EXPENSES" : "VIEW PAYABLE"}
        </span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>
          {isExtraExpenses ? "View Extra Expenses" : "View Payable Details"}
        </h1>
      </div>

      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <User size={22} color={PRIMARY_ICON} /> Customer Information
        </div>
        <div className={styles.formGrid}>
          <ReadOnlyField label="Legal Name" icon={<User size={16} color={MUTED_ICON} />}>
            {details.legalName || "—"}
          </ReadOnlyField>
          {isExtraExpenses ? (
            <>
              <ReadOnlyField label="Survey Name" icon={<FileText size={16} color={MUTED_ICON} />}>
                {details.surveyName || "—"}
              </ReadOnlyField>
              <ReadOnlyField label="Job No" icon={<Hash size={16} color={MUTED_ICON} />}>
                {details.jobNo || "—"}
              </ReadOnlyField>
            </>
          ) : null}
          {!isExtraExpenses ? (
            <>
              <ReadOnlyField label="Lead ID" icon={<Hash size={16} color={MUTED_ICON} />}>
                {details.leadId || "—"}
              </ReadOnlyField>
              <ReadOnlyField label="Lead Source" icon={<Briefcase size={16} color={MUTED_ICON} />}>
                {details.leadSource || "—"}
              </ReadOnlyField>
              <ReadOnlyField label="Quotation Number" icon={<FileText size={16} color={MUTED_ICON} />}>
                {details.quotationNumber || "—"}
              </ReadOnlyField>
              <ReadOnlyField
                label="Quotation Amount"
                icon={<DollarSign size={16} color={MUTED_ICON} />}
                valueClassName={viewStyles.readonlyFieldPrimary}
              >
                {formatMoney(details.quotationAmount)}
              </ReadOnlyField>
            </>
          ) : null}
          <ReadOnlyField
            label="Total Amount"
            icon={<DollarSign size={16} color={MUTED_ICON} />}
            valueClassName={viewStyles.readonlyFieldPrimary}
          >
            {formatMoney(details.commission)}
          </ReadOnlyField>
          <ReadOnlyField
            label="Payable Amount"
            icon={<DollarSign size={16} color="#d97706" />}
            valueClassName={viewStyles.readonlyFieldWarning}
          >
            {formatMoney(details.eligible ?? 0)}
          </ReadOnlyField>
        </div>
      </div>

      {isExtraExpenses && (details.extraExpenses?.length ?? 0) > 0 ? (
        <div className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <FileText size={22} color={PRIMARY_ICON} /> Extra Expense Items
          </div>
          <div className={styles.userTableContainer}>
            <table className={viewStyles.paymentTable}>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Admin Approved Amount</th>
                </tr>
              </thead>
              <tbody>
                {details.extraExpenses?.map((item, idx) => (
                  <tr key={`${item.description}-${idx}`}>
                    <td className={viewStyles.indexCell}>{idx + 1}</td>
                    <td className={viewStyles.methodCell}>{item.description || "—"}</td>
                    <td className={viewStyles.amountCell}>{formatMoney(item.price)}</td>
                    <td className={viewStyles.amountCell}>{formatMoney(item.approvedAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!isExtraExpenses && details.milestones?.schedule?.length ? (
        <div className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <CheckCircle2 size={22} color={PRIMARY_ICON} /> Commission Milestones
          </div>
          <div className={styles.userTableContainer}>
            <table className={viewStyles.paymentTable}>
              <thead>
                <tr>
                  <th>Milestone</th>
                  <th>Share</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {details.milestones.schedule.map((milestone) => (
                  <tr key={milestone.key}>
                    <td className={viewStyles.methodCell}>{milestone.label}</td>
                    <td className={viewStyles.methodCell}>{milestone.share}</td>
                    <td className={viewStyles.amountCell}>{formatMoney(milestone.amount)}</td>
                    <td className={viewStyles.methodCell}>
                      <span
                        style={{
                          color: milestone.unlocked ? "#059669" : "#94a3b8",
                          fontWeight: 600,
                        }}
                      >
                        {milestone.unlocked ? "Unlocked" : "Locked"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className={styles.formSection}>
        <div className={viewStyles.paymentSectionHeader}>
          <div>
            <div className={styles.sectionTitle} style={{ marginBottom: "0.35rem" }}>
              <DollarSign size={22} color={PRIMARY_ICON} /> Payment History
            </div>
          </div>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setShowAddPayment(true)}
            disabled={details.pending <= 0}
            style={{ opacity: details.pending <= 0 ? 0.55 : 1 }}
          >
            <Plus size={20} /> Add Payment
          </button>
        </div>

        {details.payments.length === 0 ? (
          <div className={viewStyles.emptyState}>No payments recorded yet.</div>
        ) : (
          <div className={styles.userTableContainer}>
            <table className={viewStyles.paymentTable}>
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
                {details.payments.map((payment, idx) => (
                  <tr key={payment._id || `${payment.paymentDate}-${idx}`}>
                    <td className={viewStyles.indexCell}>{idx + 1}</td>
                    <td className={viewStyles.dateCell}>
                      {payment.paymentDate ? formatDate(payment.paymentDate) : "—"}
                    </td>
                    <td className={viewStyles.amountCell}>{formatMoney(payment.amount)}</td>
                    <td className={viewStyles.methodCell}>{payment.paymentMethod || "—"}</td>
                    <td className={viewStyles.methodCell}>{payment.note?.trim() ? payment.note : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
          onClick={() => router.push("/commissions")}
          style={{ padding: "0.875rem 3rem", background: "#64748b", color: "#ffffff" }}
        >
          <X size={20} /> Close
        </button>
      </div>

      {showAddPayment && (
        <div className={modalStyles.modalOverlay} onClick={() => !saving && setShowAddPayment(false)}>
          <div className={modalStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={modalStyles.modalHeader}>
              <div>
                <h3>Add Payment</h3>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.2rem" }}>
                  Payable balance:{" "}
                  <strong style={{ color: "#d97706" }}>{formatMoney(details.pending)}</strong>
                </div>
              </div>
              <button className={modalStyles.closeBtn} onClick={() => !saving && setShowAddPayment(false)}>
                <X size={24} />
              </button>
            </div>

            <div className={modalStyles.modalBody}>
              <div className={modalStyles.formGrid}>
                <div className={modalStyles.formGroup}>
                  <label>Amount <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    max={details.pending}
                    className={modalStyles.formInput}
                    placeholder="0.00"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                  />
                </div>

                <div className={modalStyles.formGroup}>
                  <label>Payment Method <span style={{ color: "#ef4444" }}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <select
                      className={modalStyles.formSelect}
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                    >
                      <option value="">Select Method</option>
                      {PAYMENT_METHODS.map((method) => (
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

                <div className={modalStyles.formGroup}>
                  <label>Date <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    type="date"
                    className={modalStyles.formInput}
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))}
                  />
                </div>

                <div className={modalStyles.formGroup} style={{ gridColumn: "1 / -1" }}>
                  <label>Note</label>
                  <input
                    type="text"
                    className={modalStyles.formInput}
                    placeholder="Check Number, etc."
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, note: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className={modalStyles.modalFooter}>
              <button className={modalStyles.cancelBtn} onClick={() => setShowAddPayment(false)} disabled={saving}>
                <X size={18} /> Cancel
              </button>
              <button
                className={modalStyles.saveBtn}
                onClick={handleAddPayment}
                disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                {saving ? <Loader2 size={18} className={styles.spinner} /> : <CheckCircle2 size={18} />}
                {saving ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ReadOnlyFieldProps {
  label: string;
  icon?: React.ReactNode;
  valueClassName?: string;
  children: React.ReactNode;
}

function ReadOnlyField({ label, icon, valueClassName, children }: ReadOnlyFieldProps) {
  return (
    <div className={styles.formGroup}>
      <label>{label}</label>
      <div className={`${styles.formInput} ${viewStyles.readonlyField} ${valueClassName || ""}`}>
        {icon ? <div className={viewStyles.fieldRow}>{icon}{children}</div> : children}
      </div>
    </div>
  );
}
