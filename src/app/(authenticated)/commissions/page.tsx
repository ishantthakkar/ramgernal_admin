"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../dashboard.module.css";
import payablesStyles from "./payables.module.css";
import workflowStyles from "../workflow/workflow.module.css";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import { canViewModule } from "@/lib/permissions";
import type {
  SalesPersonPayableRow,
  SalesManagerPayableRow,
  ContractorPayableRow,
  PayablesListResponse,
} from "@/lib/payables-types";

const PAYABLES_TABS = ["Sales Persons", "Sales Manager", "Contractors"] as const;
type PayablesTab = (typeof PAYABLES_TABS)[number];

const ITEMS_PER_PAGE = 10;

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getHeaders(tab: PayablesTab): string[] {
  if (tab === "Sales Persons") {
    return [
      "Legal Name",
      "Sales Person",
      "Survey Name",
      "Survey Date",
      "Quotation Number",
      "Confirmed",
      "Quotation Amount",
      "Commission",
      "Paid",
      "Payable",
    ];
  }
  if (tab === "Sales Manager") {
    return [
      "Legal Name",
      "Sales Manager",
      "Survey Name",
      "Survey Date",
      "Quotation Number",
      "Confirmed",
      "Quotation Amount",
      "Commission",
      "Paid",
      "Payable",
    ];
  }
  return [
    "Legal Name",
    "DBA",
    "Contractor",
    "Job No",
    "Survey Name",
    "Install Date",
    "Total Charges",
    "Commission",
    "Paid",
    "Pending",
  ];
}

export default function PayablesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab = PAYABLES_TABS.includes(tabParam as PayablesTab)
    ? (tabParam as PayablesTab)
    : PAYABLES_TABS[0];

  const [activeTab, setActiveTab] = useState<PayablesTab>(initialTab);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [salesRows, setSalesRows] = useState<SalesPersonPayableRow[]>([]);
  const [salesManagerRows, setSalesManagerRows] = useState<SalesManagerPayableRow[]>([]);
  const [contractorRows, setContractorRows] = useState<ContractorPayableRow[]>([]);

  useEffect(() => {
    if (!canViewModule("Payables")) {
      toast.error("You do not have permission to view payables.");
      router.push("/dashboard");
    }
  }, [router]);

  const fetchPayables = useCallback(async () => {
    try {
      setLoading(true);
      const response = (await adminApi.getCommissionList()) as PayablesListResponse;
      setSalesRows(response.salesPersons || []);
      setSalesManagerRows(response.salesManagers || []);
      setContractorRows(response.contractors || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load payables.";
      console.error("Failed to fetch payables:", err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayables();
  }, [fetchPayables]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (activeTab === "Sales Persons") {
      if (!term) return salesRows;
      return salesRows.filter(
        (row) =>
          row.legalName?.toLowerCase().includes(term) ||
          row.salesPerson?.toLowerCase().includes(term) ||
          row.surveyName?.toLowerCase().includes(term) ||
          row.quotationNumber?.toLowerCase().includes(term)
      );
    }

    if (activeTab === "Sales Manager") {
      if (!term) return salesManagerRows;
      return salesManagerRows.filter(
        (row) =>
          row.legalName?.toLowerCase().includes(term) ||
          row.salesManager?.toLowerCase().includes(term) ||
          row.surveyName?.toLowerCase().includes(term) ||
          row.quotationNumber?.toLowerCase().includes(term)
      );
    }

    if (!term) return contractorRows;
    return contractorRows.filter(
      (row) =>
        row.legalName?.toLowerCase().includes(term) ||
        row.dba?.toLowerCase().includes(term) ||
        row.contractor?.toLowerCase().includes(term) ||
        row.jobNo?.toLowerCase().includes(term) ||
        row.surveyName?.toLowerCase().includes(term)
    );
  }, [activeTab, salesRows, salesManagerRows, contractorRows, searchTerm]);

  const tableColSpan = getHeaders(activeTab).length;
  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  function handlePageChange(page: number) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }

  function handleTabChange(tab: PayablesTab) {
    setActiveTab(tab);
    setSearchTerm("");
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/commissions?${params.toString()}`, { scroll: false });
  }

  const emptyMessage =
    activeTab === "Sales Persons"
      ? "No sales person payables found."
      : activeTab === "Sales Manager"
        ? "No sales manager payables found."
        : "No contractor payables found.";

  return (
    <div className={styles.usersPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>PAYABLES</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Payables</h1>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={workflowStyles.workflowTabs}>
            {PAYABLES_TABS.map((tab) => (
              <div
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
                onClick={() => handleTabChange(tab)}
              >
                {tab}
              </div>
            ))}
          </div>
          <div className={styles.searchUsers}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              className={styles.searchInputSmall}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className={payablesStyles.tableScroll}>
          <div className={styles.userTableContainer}>
            <table className={styles.userTable}>
              <thead>
                <tr>
                  {getHeaders(activeTab).map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={tableColSpan} style={{ textAlign: "center", padding: "4rem" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "1rem",
                          color: "#94a3b8",
                        }}
                      >
                        <Loader2 size={32} className={styles.spinner} />
                        <span style={{ fontWeight: 600 }}>Loading payables...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={tableColSpan} className={payablesStyles.emptyCell}>
                      {emptyMessage}
                    </td>
                  </tr>
                ) : activeTab === "Sales Persons" ? (
                  (currentItems as SalesPersonPayableRow[]).map((row) => (
                    <SalesPersonRow
                      key={row.id}
                      row={row}
                      onView={() =>
                        router.push(
                          `/commissions/view/${row.customerId}?surveyId=${row.surveyId}`
                        )
                      }
                    />
                  ))
                ) : activeTab === "Sales Manager" ? (
                  (currentItems as SalesManagerPayableRow[]).map((row) => (
                    <SalesManagerRow
                      key={row.id}
                      row={row}
                      onView={() =>
                        router.push(
                          `/commissions/view/${row.customerId}?surveyId=${row.surveyId}&for=sales-manager`
                        )
                      }
                    />
                  ))
                ) : (
                  (currentItems as ContractorPayableRow[]).map((row) => (
                    <ContractorRow
                      key={row.id}
                      row={row}
                      onView={() =>
                        router.push(
                          `/commissions/view/${row.customerId}?surveyId=${row.surveyId}&for=contractor`
                        )
                      }
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.tableFooter}>
          <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
            Showing {filteredData.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} results
          </div>
          <div className={styles.pagination}>
            <div
              className={`${styles.pageBtn} ${currentPage === 1 ? styles.disabled : ""}`}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft size={18} />
            </div>
            {[...Array(totalPages)].map((_, i) => (
              <div
                key={i}
                className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.pageActive : ""}`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </div>
            ))}
            <div
              className={`${styles.pageBtn} ${currentPage === totalPages ? styles.disabled : ""}`}
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

interface SalesPersonRowProps {
  row: SalesPersonPayableRow;
  onView: () => void;
}

function SalesPersonRow({ row, onView }: SalesPersonRowProps) {
  return (
    <tr>
      <td>
        <span className={payablesStyles.nameCell} onClick={onView}>
          {row.legalName || "—"}
        </span>
      </td>
      <td className={payablesStyles.textCell}>{row.salesPerson || "—"}</td>
      <td className={payablesStyles.moneyCell}>{row.surveyName || "—"}</td>
      <td className={payablesStyles.mutedCell}>
        {row.surveyDate ? formatDate(row.surveyDate) : "—"}
      </td>
      <td className={payablesStyles.monoCell}>{row.quotationNumber || "—"}</td>
      <td className={payablesStyles.mutedCell}>
        {row.confirmed ? formatDate(row.confirmed) : "—"}
      </td>
      <td className={payablesStyles.priceCell}>{formatMoney(row.quotationAmount)}</td>
      <td className={payablesStyles.priceCell}>{formatMoney(row.commission)}</td>
      <td className={payablesStyles.moneyCell}>{formatMoney(row.paid)}</td>
      <td className={payablesStyles.moneyCell}>{formatMoney(row.pending)}</td>
    </tr>
  );
}

interface SalesManagerRowProps {
  row: SalesManagerPayableRow;
  onView: () => void;
}

function SalesManagerRow({ row, onView }: SalesManagerRowProps) {
  return (
    <tr>
      <td>
        <span className={payablesStyles.nameCell} onClick={onView}>
          {row.legalName || "—"}
        </span>
      </td>
      <td className={payablesStyles.textCell}>{row.salesManager || "—"}</td>
      <td className={payablesStyles.moneyCell}>{row.surveyName || "—"}</td>
      <td className={payablesStyles.mutedCell}>
        {row.surveyDate ? formatDate(row.surveyDate) : "—"}
      </td>
      <td className={payablesStyles.monoCell}>{row.quotationNumber || "—"}</td>
      <td className={payablesStyles.mutedCell}>
        {row.confirmed ? formatDate(row.confirmed) : "—"}
      </td>
      <td className={payablesStyles.priceCell}>{formatMoney(row.quotationAmount)}</td>
      <td className={payablesStyles.priceCell}>{formatMoney(row.commission)}</td>
      <td className={payablesStyles.moneyCell}>{formatMoney(row.paid)}</td>
      <td className={payablesStyles.moneyCell}>{formatMoney(row.pending)}</td>
    </tr>
  );
}

interface ContractorRowProps {
  row: ContractorPayableRow;
  onView: () => void;
}

function ContractorRow({ row, onView }: ContractorRowProps) {
  return (
    <tr>
      <td>
        <span className={payablesStyles.nameCell} onClick={onView}>
          {row.legalName || "—"}
        </span>
      </td>
      <td className={payablesStyles.textCell}>{row.dba || "—"}</td>
      <td className={payablesStyles.textCell}>{row.contractor || "—"}</td>
      <td className={payablesStyles.monoCell}>{row.jobNo || "—"}</td>
      <td className={payablesStyles.moneyCell}>{row.surveyName || "—"}</td>
      <td className={payablesStyles.mutedCell}>
        {row.installDate ? formatDate(row.installDate) : "—"}
      </td>
      <td className={payablesStyles.priceCell}>{formatMoney(row.totalCharges)}</td>
      <td className={payablesStyles.priceCell}>{formatMoney(row.commission)}</td>
      <td className={payablesStyles.moneyCell}>{formatMoney(row.paid)}</td>
      <td className={payablesStyles.moneyCell}>{formatMoney(row.pending)}</td>
    </tr>
  );
}
