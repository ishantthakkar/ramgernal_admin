"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dashboardStyles from "../dashboard.module.css";
import styles from "./invoices.module.css";
import { Search, ChevronLeft, ChevronRight, Loader2, FileText } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import {
  fetchInvoiceRows,
  getInvoiceStatusColor,
  type InvoiceRow,
} from "@/lib/invoice-utils";
import { toast } from "react-toastify";
import { canViewModule, hasPermission } from "@/lib/permissions";
import { adminApi } from "@/lib/api";
import { sanitizePdfUrl } from "@/lib/quotation-utils";

const ITEMS_PER_PAGE = 10;

function buildPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (currentPage > 3) pages.push("ellipsis");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (currentPage < totalPages - 2) pages.push("ellipsis");

  pages.push(totalPages);
  return pages;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);

  const canCreateInvoices = hasPermission("Invoices", "create");
  const canEditInvoices = hasPermission("Invoices", "edit");

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchInvoiceRows();
      setInvoices(rows);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load invoices.";
      toast.error(message);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canViewModule("Invoices")) {
      toast.error("You do not have permission to view invoices.");
      router.push("/dashboard");
      return;
    }
    loadInvoices();
  }, [router, loadInvoices]);

  const filteredInvoices = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();

    return invoices.filter((invoice) => {
      if (!term) return true;

      return (
        invoice.invoiceNo.toLowerCase().includes(term) ||
        invoice.customer.toLowerCase().includes(term) ||
        invoice.customerId.toLowerCase().includes(term) ||
        invoice.surveyName.toLowerCase().includes(term) ||
        invoice.statusLabel.toLowerCase().includes(term)
      );
    });
  }, [invoices, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE));
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);
  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  const displayTotal = filteredInvoices.length;

  function handlePageChange(page: number) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }

  function handleViewPdf(invoice: InvoiceRow) {
    if (!invoice.pdfUrl) {
      toast.info("No invoice PDF generated yet.");
      return;
    }
    window.open(invoice.pdfUrl, "_blank", "noopener,noreferrer");
  }

  async function handleGenerateInvoice(invoice: InvoiceRow) {
    if (!invoice.surveyId) {
      toast.error("Survey ID is missing for this invoice.");
      return;
    }

    if (
      !window.confirm(
        `Generate invoice for "${invoice.customer}" (${invoice.surveyName})?`
      )
    ) {
      return;
    }

    try {
      setGeneratingId(invoice.surveyId);
      const response = await adminApi.createInvoice(invoice.surveyId);
      const pdfUrl = sanitizePdfUrl(String(response.pdfUrl || ""));
      toast.success(response.message || "Invoice generated successfully.");
      if (pdfUrl) {
        window.open(pdfUrl, "_blank", "noopener,noreferrer");
      }
      await loadInvoices();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate invoice.";
      toast.error(message);
    } finally {
      setGeneratingId(null);
    }
  }

  async function handleMarkFullyPaid(invoice: InvoiceRow) {
    if (!invoice.surveyId) {
      toast.error("Survey ID is missing for this invoice.");
      return;
    }

    if (
      !window.confirm(
        `Mark invoice for "${invoice.customer}" (${invoice.surveyName}) as fully paid? This unlocks sales manager commission and the remaining sales person commission.`
      )
    ) {
      return;
    }

    try {
      setMarkingPaidId(invoice.surveyId);
      const response = await adminApi.markInvoiceFullyPaid(invoice.surveyId);
      toast.success(response.message || "Invoice marked as fully paid.");
      await loadInvoices();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to mark invoice as fully paid.";
      toast.error(message);
    } finally {
      setMarkingPaidId(null);
    }
  }

  return (
    <div className={styles.invoicesPage}>
      <div className={dashboardStyles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={dashboardStyles.breadcrumbCurrent}>INVOICES</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.directoryTitle}>Invoices</h1>
        
      </div>

      <div className={dashboardStyles.tableCard}>
        <div className={dashboardStyles.tableHeader}>
          <div className={styles.toolbarRight}>
            <div className={dashboardStyles.searchUsers}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search invoices..."
                className={dashboardStyles.searchInputSmall}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>

        <div className={dashboardStyles.userTableContainer}>
          <table className={dashboardStyles.userTable}>
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Invoice Date</th>
                <th>Customer</th>
                <th>Customer ID</th>
                <th>Survey</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className={styles.emptyCell}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "1rem",
                        color: "#94a3b8",
                      }}
                    >
                      <Loader2 size={32} className={dashboardStyles.spinner} />
                      <span style={{ fontWeight: 600 }}>Loading invoices...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyCell}>
                    No invoices found. Surveys show here after inspection admin approval.
                  </td>
                </tr>
              ) : (
                currentItems.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className={styles.monoCell}>{invoice.invoiceNo}</td>
                    <td style={{ color: "#64748b", fontWeight: 500 }}>
                      {invoice.invoiceDate ? formatDate(invoice.invoiceDate) : "—"}
                    </td>
                    <td>
                      <span
                        className={styles.customerLink}
                        onClick={() => handleViewPdf(invoice)}
                      >
                        {invoice.customer}
                      </span>
                    </td>
                    <td className={styles.monoCell}>{invoice.customerId}</td>
                    <td style={{ color: "#1e293b", fontWeight: 600 }}>{invoice.surveyName}</td>
                    <td>
                      <div className={dashboardStyles.statusCell}>
                        <span
                          className={dashboardStyles.statusDotActive}
                          style={{
                            backgroundColor: getInvoiceStatusColor(invoice.status),
                          }}
                        />
                        <span
                          style={{
                            color: getInvoiceStatusColor(invoice.status),
                            fontWeight: 600,
                          }}
                        >
                          {invoice.hasPdf ? invoice.statusLabel : "Ready to Generate"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        {invoice.hasPdf ? (
                          <button
                            type="button"
                            className={dashboardStyles.assignBtn}
                            onClick={() => handleViewPdf(invoice)}
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                          >
                            <FileText size={14} />
                            View PDF
                          </button>
                        ) : null}
                        {invoice.hasPdf &&
                        invoice.status !== "fully_paid" &&
                        (canCreateInvoices || canEditInvoices) ? (
                          <button
                            type="button"
                            className={dashboardStyles.assignBtn}
                            disabled={markingPaidId === invoice.surveyId}
                            onClick={() => handleMarkFullyPaid(invoice)}
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                          >
                            {markingPaidId === invoice.surveyId ? (
                              <Loader2 size={14} className={dashboardStyles.spinner} />
                            ) : null}
                            Mark Fully Paid
                          </button>
                        ) : null}
                        {!invoice.hasPdf && (canCreateInvoices || canEditInvoices) ? (
                          <button
                            type="button"
                            className={dashboardStyles.assignBtn}
                            disabled={generatingId === invoice.surveyId}
                            onClick={() => handleGenerateInvoice(invoice)}
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                          >
                            {generatingId === invoice.surveyId ? (
                              <Loader2 size={14} className={dashboardStyles.spinner} />
                            ) : null}
                            Generate
                          </button>
                        ) : null}
                        {!invoice.hasPdf && !canCreateInvoices && !canEditInvoices ? (
                          <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>—</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={dashboardStyles.tableFooter}>
          <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
            Showing {filteredInvoices.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, filteredInvoices.length)} of{" "}
            {displayTotal.toLocaleString()} entries
          </div>
          <div className={dashboardStyles.pagination}>
            <div
              className={`${dashboardStyles.pageBtn} ${currentPage === 1 ? dashboardStyles.disabled : ""}`}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft size={18} />
            </div>
            {pageNumbers.map((page, index) =>
              page === "ellipsis" ? (
                <div key={`ellipsis-${index}`} className={styles.pageEllipsis}>
                  ...
                </div>
              ) : (
                <div
                  key={page}
                  className={`${dashboardStyles.pageBtn} ${currentPage === page ? dashboardStyles.pageActive : ""}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </div>
              )
            )}
            <div
              className={`${dashboardStyles.pageBtn} ${currentPage === totalPages ? dashboardStyles.disabled : ""}`}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <ChevronRight size={18} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
