"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import dashboardStyles from "../dashboard.module.css";
import styles from "./payables.module.css";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import type {
  SalesPersonPayableRow,
  ContractorPayableRow,
  PayablesListResponse,
} from "@/lib/payables-types";

type PayablesTab = "Sales Persons" | "Contractors";

const SALES_COL_SPAN = 10;
const CONTRACTOR_COL_SPAN = 10;
const ITEMS_PER_PAGE = 10;

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function PayablesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PayablesTab>("Sales Persons");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [salesRows, setSalesRows] = useState<SalesPersonPayableRow[]>([]);
  const [contractorRows, setContractorRows] = useState<ContractorPayableRow[]>([]);

  useEffect(() => {
    const fetchPayables = async () => {
      try {
        setLoading(true);
        const response = (await adminApi.getCommissionList()) as PayablesListResponse;
        setSalesRows(response.salesPersons || []);
        setContractorRows(response.contractors || []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load payables.";
        console.error("Failed to fetch payables:", err);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchPayables();
  }, []);

  const filteredSalesRows = useMemo(() => {
    if (!searchTerm.trim()) return salesRows;
    const term = searchTerm.toLowerCase();
    return salesRows.filter(
      (row) =>
        row.legalName?.toLowerCase().includes(term) ||
        row.salesPerson?.toLowerCase().includes(term) ||
        row.surveyName?.toLowerCase().includes(term) ||
        row.quotationNumber?.toLowerCase().includes(term)
    );
  }, [salesRows, searchTerm]);

  const filteredContractorRows = useMemo(() => {
    if (!searchTerm.trim()) return contractorRows;
    const term = searchTerm.toLowerCase();
    return contractorRows.filter(
      (row) =>
        row.legalName?.toLowerCase().includes(term) ||
        row.dba?.toLowerCase().includes(term) ||
        row.contractor?.toLowerCase().includes(term) ||
        row.jobNo?.toLowerCase().includes(term) ||
        row.surveyName?.toLowerCase().includes(term)
    );
  }, [contractorRows, searchTerm]);

  const activeRows = activeTab === "Sales Persons" ? filteredSalesRows : filteredContractorRows;
  const tableColSpan = activeTab === "Sales Persons" ? SALES_COL_SPAN : CONTRACTOR_COL_SPAN;
  const totalPages = Math.max(1, Math.ceil(activeRows.length / ITEMS_PER_PAGE));
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentSalesItems = filteredSalesRows.slice(indexOfFirstItem, indexOfLastItem);
  const currentContractorItems = filteredContractorRows.slice(indexOfFirstItem, indexOfLastItem);

  function handlePageChange(page: number) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }

  function handleTabChange(tab: PayablesTab) {
    setActiveTab(tab);
    setSearchTerm("");
    setCurrentPage(1);
  }

  if (loading) {
    return (
      <div className={styles.payablesPage}>
        <div className={dashboardStyles.breadcrumb}>
          ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
          <span className={dashboardStyles.breadcrumbCurrent}>PAYABLES</span>
        </div>
        <div className={styles.loadingWrap} style={{ padding: "4rem" }}>
          <Loader2 size={40} className="animate-spin" />
          <span>Loading payables...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.payablesPage}>
      <div className={dashboardStyles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={dashboardStyles.breadcrumbCurrent}>PAYABLES</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.directoryTitle}>Payables</h1>
      </div>

      <div className={dashboardStyles.tableCard}>
        <div className={dashboardStyles.tableHeader}>
          <div className={styles.payablesTabs}>
            {(["Sales Persons", "Contractors"] as PayablesTab[]).map((tab) => (
              <div
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
                onClick={() => handleTabChange(tab)}
              >
                {tab}
              </div>
            ))}
          </div>
          <div className={dashboardStyles.searchUsers}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              className={dashboardStyles.searchInputSmall}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className={styles.tableScroll}>
          <div className={dashboardStyles.userTableContainer}>
            {activeTab === "Sales Persons" ? (
              <table className={dashboardStyles.userTable}>
                <thead>
                  <tr>
                    <th>Legal Name</th>
                    <th>Sales Person</th>
                    <th>Survey Name</th>
                    <th>Survey Date</th>
                    <th>Quotation Number</th>
                    <th>Confirmed</th>
                    <th>Quotation Amount</th>
                    <th>Commission</th>
                    <th>Paid</th>
                    <th>Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSalesItems.length === 0 ? (
                    <tr>
                      <td colSpan={tableColSpan} className={styles.emptyCell}>
                        No sales person payables found
                      </td>
                    </tr>
                  ) : (
                    currentSalesItems.map((row) => (
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
                  )}
                </tbody>
              </table>
            ) : (
              <table className={dashboardStyles.userTable}>
                <thead>
                  <tr>
                    <th>Legal Name</th>
                    <th>DBA</th>
                    <th>Contractor</th>
                    <th>Job No</th>
                    <th>Survey Name</th>
                    <th>Install Date</th>
                    <th>Total Charges</th>
                    <th>Commission</th>
                    <th>Paid</th>
                    <th>Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {currentContractorItems.length === 0 ? (
                    <tr>
                      <td colSpan={tableColSpan} className={styles.emptyCell}>
                        No contractor payables found. Verified surveys with products will appear here.
                      </td>
                    </tr>
                  ) : (
                    currentContractorItems.map((row) => (
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
            )}
          </div>
        </div>

        <div className={dashboardStyles.tableFooter}>
          <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
            Showing {activeRows.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, activeRows.length)} of {activeRows.length} results
          </div>
          <div className={dashboardStyles.pagination}>
            <div
              className={`${dashboardStyles.pageBtn} ${currentPage === 1 ? dashboardStyles.disabled : ""}`}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft size={18} />
            </div>
            {[...Array(totalPages)].map((_, i) => (
              <div
                key={i}
                className={`${dashboardStyles.pageBtn} ${currentPage === i + 1 ? dashboardStyles.pageActive : ""}`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </div>
            ))}
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

interface SalesPersonRowProps {
  row: SalesPersonPayableRow;
  onView: () => void;
}

function SalesPersonRow({ row, onView }: SalesPersonRowProps) {
  return (
    <tr>
      <td>
        <span className={styles.nameCell} onClick={onView}>
          {row.legalName || "—"}
        </span>
      </td>
      <td className={styles.textCell}>{row.salesPerson || "—"}</td>
      <td className={styles.moneyCell}>{row.surveyName || "—"}</td>
      <td className={styles.mutedCell}>
        {row.surveyDate ? formatDate(row.surveyDate) : "—"}
      </td>
      <td className={styles.monoCell}>{row.quotationNumber || "—"}</td>
      <td className={styles.mutedCell}>
        {row.confirmed ? formatDate(row.confirmed) : "—"}
      </td>
      <td className={styles.priceCell}>{formatMoney(row.quotationAmount)}</td>
      <td className={styles.priceCell}>{formatMoney(row.commission)}</td>
      <td className={styles.moneyCell}>{formatMoney(row.paid)}</td>
      <td className={styles.moneyCell}>{formatMoney(row.pending)}</td>
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
        <span className={styles.nameCell} onClick={onView}>
          {row.legalName || "—"}
        </span>
      </td>
      <td className={styles.textCell}>{row.dba || "—"}</td>
      <td className={styles.textCell}>{row.contractor || "—"}</td>
      <td className={styles.monoCell}>{row.jobNo || "—"}</td>
      <td className={styles.moneyCell}>{row.surveyName || "—"}</td>
      <td className={styles.mutedCell}>
        {row.installDate ? formatDate(row.installDate) : "—"}
      </td>
      <td className={styles.priceCell}>{formatMoney(row.totalCharges)}</td>
      <td className={styles.priceCell}>{formatMoney(row.commission)}</td>
      <td className={styles.moneyCell}>{formatMoney(row.paid)}</td>
      <td className={styles.moneyCell}>{formatMoney(row.pending)}</td>
    </tr>
  );
}
