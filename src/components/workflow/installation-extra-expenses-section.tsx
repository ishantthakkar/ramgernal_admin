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

interface ExpenseEntryView {
  id: string;
  index: number;
  notes: string;
  adminExpenseApprovalStatus: string;
  adminApprovalAmount: number;
  totalAmount: number;
  receipts: string[];
  rows: ExtraExpenseRow[];
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

function mapLineItems(
  items: unknown[],
  entryId: string
): ExtraExpenseRow[] {
  return items.map((item, index) => {
    const record = (item || {}) as Record<string, unknown>;
    const price = Number(record.price) || 0;
    const approvedAmount = Number(record.approvedAmount) || 0;
    const description =
      String(record.description || record.itemName || "").trim() || "—";

    return {
      id: `${entryId}-line-${index}`,
      description,
      price,
      approvedAmount: String(approvedAmount),
    };
  });
}

function mapExpenseEntries(
  installationSurvey: Record<string, unknown> | null
): ExpenseEntryView[] {
  const rawEntries = Array.isArray(installationSurvey?.expenses)
    ? installationSurvey.expenses
    : [];

  if (rawEntries.length > 0) {
    return rawEntries.map((entry, index) => {
      const record = (entry || {}) as Record<string, unknown>;
      const id = String(record.id || record._id || `expense-entry-${index}`);
      const expenseItems = Array.isArray(record.expenseItem) ? record.expenseItem : [];
      const receipts = Array.isArray(record.receipt)
        ? record.receipt.map((item) => String(item || "").trim()).filter(Boolean)
        : [];

      return {
        id,
        index: index + 1,
        notes: String(record.notes || "").trim(),
        adminExpenseApprovalStatus: String(
          record.adminExpenseApprovalStatus || "pending"
        ),
        adminApprovalAmount: Number(record.adminApprovalAmount) || 0,
        totalAmount: Number(record.totalAmount) || 0,
        receipts,
        rows: mapLineItems(expenseItems, id),
      };
    });
  }

  const legacyItems = Array.isArray(installationSurvey?.extraExpenses)
    ? installationSurvey.extraExpenses
    : [];

  if (legacyItems.length === 0) {
    return [];
  }

  const legacyId = String(installationSurvey?.expenseId || "legacy-expense-entry");
  const legacyReceipts = Array.isArray(installationSurvey?.uploadReceipts)
    ? installationSurvey.uploadReceipts
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    : [];

  return [
    {
      id: legacyId,
      index: 1,
      notes: "",
      adminExpenseApprovalStatus: String(
        installationSurvey?.adminApprovalStatus || "pending"
      ),
      adminApprovalAmount: Number(installationSurvey?.adminApprovalAmount) || 0,
      totalAmount: Number(installationSurvey?.extraExpensesTotalAmount) || 0,
      receipts: legacyReceipts,
      rows: mapLineItems(legacyItems, legacyId),
    },
  ];
}

export function InstallationExtraExpensesSection({
  installationSurvey,
  canManage = false,
  onRefresh,
  onViewImages,
}: InstallationExtraExpensesSectionProps) {
  const expenseEntries = useMemo(
    () => mapExpenseEntries(installationSurvey),
    [installationSurvey]
  );

  const [entryRows, setEntryRows] = useState<Record<string, ExtraExpenseRow[]>>({});
  const [verifyingEntryId, setVerifyingEntryId] = useState<string | null>(null);

  useEffect(() => {
    const next: Record<string, ExtraExpenseRow[]> = {};
    for (const entry of expenseEntries) {
      next[entry.id] = entry.rows;
    }
    setEntryRows(next);
  }, [expenseEntries]);

  function handleApprovedAmountChange(
    entryId: string,
    rowId: string,
    value: string
  ) {
    setEntryRows((current) => ({
      ...current,
      [entryId]: (current[entryId] || []).map((row) =>
        row.id === rowId ? { ...row, approvedAmount: value } : row
      ),
    }));
  }

  async function handleVerifyEntry(entry: ExpenseEntryView) {
    if (!installationSurvey?._id) {
      toast.error("No survey found for this installation.");
      return;
    }

    const rows = entryRows[entry.id] || [];
    if (!rows.length) {
      toast.error("No extra expenses to verify in this entry.");
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

    if (
      !window.confirm(
        `Verify and approve expense entry #${entry.index}?`
      )
    ) {
      return;
    }

    try {
      setVerifyingEntryId(entry.id);
      const response = await adminApi.approveExtraExpenses(
        String(installationSurvey._id),
        payload as Array<{
          description: string;
          price: number;
          approvedAmount: number;
        }>,
        entry.id
      );
      toast.success(
        response.message || `Expense entry #${entry.index} verified successfully.`
      );
      await onRefresh?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to verify extra expenses.";
      toast.error(message);
    } finally {
      setVerifyingEntryId(null);
    }
  }

  return (
    <section className={styles.formSection}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "2rem",
        }}
      >
        <div
          className={`${styles.sectionTitle} ${detailStyles.viewSectionTitle}`}
          style={{ marginBottom: 0 }}
        >
          <Receipt size={22} color="var(--admin-primary, #004d4d)" />
          Extra Expenses
        </div>
        {expenseEntries.length > 0 ? (
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#64748b",
            }}
          >
            {expenseEntries.length} expense{" "}
            {expenseEntries.length === 1 ? "entry" : "entries"}
          </span>
        ) : null}
      </div>

      {expenseEntries.length === 0 ? (
        <div className={docStyles.fixtureTableCard}>
          <div className={detailStyles.viewEmptyState}>
            No extra expenses recorded yet.
          </div>
        </div>
      ) : (
        <div className={detailStyles.extraExpenseEntryList}>
          {expenseEntries.map((entry) => {
            const rows = entryRows[entry.id] || [];
            const statusColor = getApprovalStatusColor(
              entry.adminExpenseApprovalStatus
            );
            const isApproved =
              entry.adminExpenseApprovalStatus.toLowerCase() === "approved";
            const canEdit = canManage && !isApproved;
            const submittedTotal = rows.reduce(
              (sum, row) => sum + (Number(row.price) || 0),
              0
            );
            const approvedTotal = rows.reduce(
              (sum, row) => sum + (Number(row.approvedAmount) || 0),
              0
            );

            return (
              <article
                key={entry.id}
                className={detailStyles.extraExpenseEntryCard}
              >
                <div className={detailStyles.extraExpenseEntryHeader}>
                  <h4 className={detailStyles.extraExpenseEntryTitle}>
                    Expense Entry #{entry.index}
                  </h4>
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
                    {formatApprovalStatusLabel(entry.adminExpenseApprovalStatus)}
                  </span>
                </div>

                {entry.notes ? (
                  <p className={detailStyles.extraExpenseEntryNotes}>
                    <strong>Notes:</strong> {entry.notes}
                  </p>
                ) : null}

                <div className={docStyles.fixtureTableWrap}>
                  <table className={docStyles.fixtureTable}>
                    <thead>
                      <tr>
                        <th className={docStyles.fixtureColName}>Description</th>
                        <th className={docStyles.fixtureColQty}>Amount</th>
                        <th className={detailStyles.extraExpenseApprovedCol}>
                          Admin Approved Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            style={{
                              textAlign: "center",
                              padding: "2rem",
                              color: "#94a3b8",
                              fontWeight: 600,
                            }}
                          >
                            No line items in this entry.
                          </td>
                        </tr>
                      ) : (
                        rows.map((row, index) => {
                          const isLastRow = index === rows.length - 1;

                          return (
                            <tr
                              key={row.id}
                              className={
                                isLastRow ? docStyles.fixtureRowLast : undefined
                              }
                            >
                              <td className={docStyles.fixtureColName}>
                                <span className={docStyles.fixtureName}>
                                  {row.description}
                                </span>
                              </td>
                              <td className={docStyles.fixtureColQty}>
                                <span className={docStyles.fixtureQtyText}>
                                  {formatMoney(row.price)}
                                </span>
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
                                      handleApprovedAmountChange(
                                        entry.id,
                                        row.id,
                                        event.target.value
                                      )
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
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className={detailStyles.extraExpenseEntryFooter}>
                  <div className={detailStyles.extraExpenseSummary}>
                    <div>
                      <span className={detailStyles.extraExpenseSummaryLabel}>
                        Submitted Total
                      </span>
                      <strong>
                        {formatMoney(
                          entry.totalAmount > 0 ? entry.totalAmount : submittedTotal
                        )}
                      </strong>
                    </div>
                    <div>
                      <span className={detailStyles.extraExpenseSummaryLabel}>
                        Admin Approved Total
                      </span>
                      <strong>
                        {formatMoney(
                          isApproved && entry.adminApprovalAmount > 0
                            ? entry.adminApprovalAmount
                            : approvedTotal
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className={detailStyles.extraExpenseEntryActions}>
                    {entry.receipts.length > 0 ? (
                      <button
                        type="button"
                        className={styles.assignBtn}
                        onClick={() =>
                          onViewImages?.(
                            entry.receipts,
                            `Expense Entry #${entry.index} Receipts`
                          )
                        }
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                        }}
                      >
                        <ClipboardList size={14} /> View Receipts (
                        {entry.receipts.length})
                      </button>
                    ) : (
                      <span
                        style={{
                          fontSize: "0.85rem",
                          color: "#94a3b8",
                          fontWeight: 600,
                        }}
                      >
                        No receipts uploaded
                      </span>
                    )}

                    {canEdit && rows.length > 0 ? (
                      <button
                        type="button"
                        className={styles.createBtn}
                        onClick={() => handleVerifyEntry(entry)}
                        disabled={verifyingEntryId === entry.id}
                        style={{ background: "#10b981" }}
                      >
                        {verifyingEntryId === entry.id ? (
                          <Loader2 size={18} className={styles.spinner} />
                        ) : (
                          <CheckCircle2 size={18} />
                        )}
                        {verifyingEntryId === entry.id
                          ? "Verifying..."
                          : "Verify Entry"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
