"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dashboardStyles from "../dashboard.module.css";
import styles from "./invoices.module.css";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import { MOCK_INVOICES, type InvoiceRow } from "@/lib/invoices-mock-data";
import { toast } from "react-toastify";
import { canViewModule } from "@/lib/permissions";

const ITEMS_PER_PAGE = 4;

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

  useEffect(() => {
    if (!canViewModule("Invoices")) {
      toast.error("You do not have permission to view invoices.");
      router.push("/dashboard");
    }
  }, [router]);

  const filteredInvoices = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();

    return MOCK_INVOICES.filter((invoice) => {
      if (!term) return true;

      return (
        invoice.invoiceNo.toLowerCase().includes(term) ||
        invoice.customer.toLowerCase().includes(term) ||
        invoice.customerId.toLowerCase().includes(term) ||
        invoice.status.toLowerCase().includes(term)
      );
    });
  }, [searchQuery]);

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

  function handleView(invoice: InvoiceRow) {
    toast.info(`Invoice ${invoice.invoiceNo} — view coming soon.`);
  }

  function handleEdit(invoice: InvoiceRow) {
    toast.info(`Invoice ${invoice.invoiceNo} — edit coming soon.`);
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
                placeholder="Search Users"
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
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>
                    No invoices found.
                  </td>
                </tr>
              ) : (
                currentItems.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className={styles.monoCell}>{invoice.invoiceNo}</td>
                    <td style={{ color: "#64748b", fontWeight: 500 }}>
                      {formatDate(invoice.invoiceDate)}
                    </td>
                    <td>
                      <span
                        className={styles.customerLink}
                        onClick={() => handleView(invoice)}
                      >
                        {invoice.customer}
                      </span>
                    </td>
                    <td className={styles.monoCell}>{invoice.customerId}</td>
                    <td>
                      <div className={dashboardStyles.statusCell}>
                        <span className={dashboardStyles.statusDotInactive} />
                        {invoice.status}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                       
                        <button
                          type="button"
                          className={dashboardStyles.assignBtn}
                          onClick={() => handleEdit(invoice)}
                        >
                          Edit
                        </button>
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
