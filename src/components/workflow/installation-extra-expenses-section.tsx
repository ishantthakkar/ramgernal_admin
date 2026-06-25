"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "@/app/(authenticated)/dashboard.module.css";
import docStyles from "@/app/(authenticated)/workflow/quotations/quotations-view.module.css";
import detailStyles from "@/app/(authenticated)/workflow/workflow-details.module.css";
import { adminApi } from "@/lib/api";
import { CheckCircle2, ClipboardList, Loader2, Receipt } from "lucide-react";
import { toast } from "react-toastify";

interface ExtraExpenseRow {
  id: string;
  description: string;
  price: number;
  approvedAmount: string;
}

interface InstallationExtraExpensesSectionProps {
  installationSurvey: Record<string, unknown> | null;
  canManage?: boolean;
  onRefresh?: () => Promise<void>;
  onViewImages?: (images: string[], title: string) => void;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatApprovalStatusLabel(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  return "Pending";
}

function getApprovalStatusColor(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (normalized === "approved") return "#10b981";
  if (normalized === "rejected") return "#ef4444";
  return "#f59e0b";
}

function mapExpenseRows(installationSurvey: Record<string, unknown> | null): ExtraExpenseRow[] {
  const expenses = Array.isArray(installationSurvey?.extraExpenses)
    ? installationSurvey.extraExpenses
    : [];

  return expenses.map((item, index) => {
    const record = (item || {}) as Record<string, unknown>;
    const price = Number(record.price) || 0;
    const approvedAmount = Number(record.approvedAmount) || 0;

    return {
      id: `extra-expense-${index}`,
      description: String(record.description || "").trim() || "—",
      price,
      approvedAmount: String(approvedAmount),
    };
  });
}

export function InstallationExtraExpensesSection({
  installationSurvey,
  canManage = false,
  onRefresh,
  onViewImages,
}: InstallationExtraExpensesSectionProps) {
  const [rows, setRows] = useState<ExtraExpenseRow[]>([]);
  const [verifying, setVerifying] = useState(false);

  const approvalStatus = String(installationSurvey?.adminApprovalStatus || "pending");
  const isApproved = approvalStatus.toLowerCase() === "approved";
  const canEdit = canManage && !isApproved;

  const receipts = useMemo(() => {
    const raw = installationSurvey?.uploadReceipts;
    if (!Array.isArray(raw)) return [] as string[];
    return raw.map((item) => String(item || "").trim()).filter(Boolean);
  }, [installationSurvey?.uploadReceipts]);

  const submittedTotal = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row.price) || 0), 0),
    [rows]
  );

  const approvedTotal = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row.approvedAmount) || 0), 0),
    [rows]
  );

  useEffect(() => {
    setRows(mapExpenseRows(installationSurvey));
  }, [installationSurvey]);

  function handleApprovedAmountChange(rowId: string, value: string) {
    setRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, approvedAmount: value } : row))
    );
  }

  async function handleVerify() {
    if (!installationSurvey?._id) {
      toast.error("No survey found for this installation.");
      return;
    }

    if (!rows.length) {
      toast.error("No extra expenses to verify.");
      return;
    }

    const payload = rows.map((row) => {
      const approvedAmount = Number(row.approvedAmount);
      if (!Number.isFinite(approvedAmount) || approvedAmount < 0) {
        return null;
      }

      return {
        description: row.description,
        price: Number(row.price) || 0,
        approvedAmount,
      };
    });

    if (payload.some((item) => item === null)) {
      toast.error("Enter a valid admin approved amount for each expense line.");
      return;
    }

    if (!window.confirm("Verify and approve these extra expenses?")) return;

    try {
      setVerifying(true);
      const response = await adminApi.approveExtraExpenses(
        String(installationSurvey._id),
        payload as Array<{
          description: string;
          price: number;
          approvedAmount: number;
        }>
      );
      toast.success(response.message || "Extra expenses verified successfully.");
      await onRefresh?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to verify extra expenses.";
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  }

  const statusColor = getApprovalStatusColor(approvalStatus);

  return (
    <section className={styles.formSection}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "0.25rem",
        }}
      >
        <div className={styles.sectionTitle} style={{ marginBottom: 0 }}>
          <Receipt size={22} color="var(--admin-primary, #004d4d)" />
          Extra Expenses
        </div>
        <span
          style={{
            backgroundColor: `${statusColor}15`,
            color: statusColor,
            padding: "0.35rem 0.9rem",
            borderRadius: "999px",
            fontSize: "0.75rem",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          {formatApprovalStatusLabel(approvalStatus)}
        </span>
      </div>

      <div className={docStyles.fixtureTableCard}>
        {rows.length === 0 ? (
          <div className={docStyles.fixtureEmptyState}>No extra expenses recorded yet.</div>
        ) : (
          <>
            <div className={docStyles.fixtureTableWrap}>
              <table className={docStyles.fixtureTable}>
                <thead>
                  <tr>
                    <th className={docStyles.fixtureColName}>Description</th>
                    <th className={docStyles.fixtureColQty}>Amount</th>
                    <th className={detailStyles.extraExpenseApprovedCol}>Admin Approved Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const isLastRow = index === rows.length - 1;

                    return (
                      <tr key={row.id} className={isLastRow ? docStyles.fixtureRowLast : undefined}>
                        <td className={docStyles.fixtureColName}>
                          <span className={docStyles.fixtureName}>{row.description}</span>
                        </td>
                        <td className={docStyles.fixtureColQty}>
                          <span className={docStyles.fixtureQtyText}>{formatMoney(row.price)}</span>
                        </td>
                        <td className={detailStyles.extraExpenseApprovedCol}>
                          {canEdit ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className={docStyles.skuInput}
                              value={row.approvedAmount}
                              placeholder="0.00"
                              onChange={(event) =>
                                handleApprovedAmountChange(row.id, event.target.value)
                              }
                            />
                          ) : (
                            <span className={docStyles.fixtureQtyText}>
                              {formatMoney(Number(row.approvedAmount) || 0)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={detailStyles.extraExpenseSummary}>
              <div>
                <span className={detailStyles.extraExpenseSummaryLabel}>Submitted Total</span>
                <strong>{formatMoney(submittedTotal)}</strong>
              </div>
              <div>
                <span className={detailStyles.extraExpenseSummaryLabel}>Admin Approved Total</span>
                <strong>{formatMoney(approvedTotal)}</strong>
              </div>
              {receipts.length > 0 ? (
                <button
                  type="button"
                  className={detailStyles.viewImgBtn}
                  onClick={() => onViewImages?.(receipts, "Extra Expense Receipts")}
                >
                  <ClipboardList size={14} /> View Receipts ({receipts.length})
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>

      {canEdit && rows.length > 0 ? (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "1.25rem",
          }}
        >
          <button
            type="button"
            className={styles.createBtn}
            onClick={handleVerify}
            disabled={verifying}
            style={{ background: "#10b981" }}
          >
            {verifying ? (
              <Loader2 size={18} className={styles.spinner} />
            ) : (
              <CheckCircle2 size={18} />
            )}
            {verifying ? "Verifying..." : "Verify Extra Expenses"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
