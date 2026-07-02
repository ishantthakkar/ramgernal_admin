"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dashboardStyles from "../dashboard.module.css";
import styles from "./audit.module.css";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import { canViewModule } from "@/lib/permissions";
import { formatDateTimeWithSeconds } from "@/lib/dateUtils";
import {
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  Tag,
  Hash,
  Loader2,
  ChevronDown,
  Check,
} from "lucide-react";

interface AuditLog {
  _id: string;
  logName: string;
  byPersonName: string;
  recordName: string;
  recordType: string;
  recordId: string;
  createdAt: string;
}

const ITEMS_PER_PAGE = 10;

function formatRecordId(recordId?: string): string {
  if (!recordId) return "—";
  const id = String(recordId);
  return id.length > 8 ? id.slice(-8).toUpperCase() : id.toUpperCase();
}

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

function getOperationColor(action: string): string {
  const actionLower = action.toLowerCase();
  if (actionLower.includes("delete") || actionLower.includes("failure") || actionLower.includes("lost")) {
    return "#ef4444";
  }
  if (actionLower.includes("create") || actionLower.includes("generated")) {
    return "#0d9488";
  }
  if (actionLower.includes("convert") || actionLower.includes("approved")) {
    return "var(--admin-accent, #f39c12)";
  }
  if (actionLower.includes("payment") || actionLower.includes("commission") || actionLower.includes("contractor")) {
    return "#14b8a6";
  }
  if (actionLower.includes("verify") || actionLower.includes("verified") || actionLower.includes("completed")) {
    return "#10b981";
  }
  if (actionLower.includes("update") || actionLower.includes("assign") || actionLower.includes("saved")) {
    return "var(--admin-primary, #004d4d)";
  }
  return "#64748b";
}

function getRecordTypeStyle(recordType: string): { bg: string; color: string } {
  switch (recordType?.toLowerCase()) {
    case "lead":
      return { bg: "#e8f0fe", color: "#3b6fd9" };
    case "customer":
      return { bg: "#ccfbf1", color: "#0d9488" };
    case "survey":
      return { bg: "#fef3c7", color: "#d97706" };
    case "quotation":
      return { bg: "#eef2ff", color: "#6366f1" };
    case "invoice":
      return { bg: "#e6f2f2", color: "#004d4d" };
    case "payables":
      return { bg: "#ecfdf5", color: "#14b8a6" };
    case "installation":
      return { bg: "#fff7ed", color: "#ea580c" };
    case "inspection":
      return { bg: "#faf5ff", color: "#9333ea" };
    case "user":
      return { bg: "#f1f5f9", color: "#475569" };
    case "role":
      return { bg: "#f8fafc", color: "#334155" };
    case "product":
      return { bg: "#ecfdf5", color: "#059669" };
    case "service":
      return { bg: "#f0f9ff", color: "#0284c7" };
    case "assignment":
      return { bg: "#f5f3ff", color: "#7c3aed" };
    default:
      return { bg: "#f1f5f9", color: "#64748b" };
  }
}

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState("all");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const userFilterRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);

    try {
      const response = await adminApi.getActivityLogs();
      if (response.success) {
        setLogs(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch audit logs";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canViewModule("Audit")) {
      toast.error("You do not have permission to view audit logs.");
      router.push("/dashboard");
      return;
    }

    fetchLogs();
  }, [router, fetchLogs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedUser]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userFilterRef.current && !userFilterRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }

    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userDropdownOpen]);

  const userOptions = useMemo(() => {
    const names = new Set<string>();
    logs.forEach((log) => {
      const name = log.byPersonName?.trim();
      if (name) names.add(name);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return logs.filter((log) => {
      if (selectedUser !== "all" && log.byPersonName !== selectedUser) {
        return false;
      }

      if (!term) return true;

      return (
        log.logName.toLowerCase().includes(term) ||
        log.byPersonName.toLowerCase().includes(term) ||
        log.recordName.toLowerCase().includes(term) ||
        log.recordType.toLowerCase().includes(term) ||
        (log.recordId && String(log.recordId).toLowerCase().includes(term))
      );
    });
  }, [logs, searchTerm, selectedUser]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const paginatedLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  function handlePageChange(page: number) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }

  function handleUserSelect(value: string) {
    setSelectedUser(value);
    setUserDropdownOpen(false);
  }

  const selectedUserLabel = selectedUser === "all" ? "All Users" : selectedUser;

  return (
    <div className={styles.auditPage}>
      <div className={dashboardStyles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={dashboardStyles.breadcrumbCurrent}>AUDIT LOGS</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.directoryTitle}>System Audit Logs</h1>
      </div>

      <div className={dashboardStyles.tableCard}>
        <div className={dashboardStyles.tableHeader}>
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <div className={styles.userFilterWrap} ref={userFilterRef}>
              <button
                type="button"
                className={`${styles.userFilterTrigger} ${
                  userDropdownOpen ? styles.userFilterTriggerOpen : ""
                }`}
                onClick={() => setUserDropdownOpen((open) => !open)}
                aria-haspopup="listbox"
                aria-expanded={userDropdownOpen}
              >
                <span className={styles.userFilterIcon}>
                  <User size={16} />
                </span>
                <span className={styles.userFilterContent}>
                  <span className={styles.userFilterLabel}>User</span>
                  <span className={styles.userFilterValue}>{selectedUserLabel}</span>
                </span>
                <ChevronDown
                  size={16}
                  className={`${styles.userFilterChevron} ${
                    userDropdownOpen ? styles.userFilterChevronOpen : ""
                  }`}
                />
              </button>

              {userDropdownOpen && (
                <div className={styles.userFilterMenu} role="listbox" aria-label="Filter by user">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedUser === "all"}
                    className={`${styles.userFilterOption} ${
                      selectedUser === "all" ? styles.userFilterOptionActive : ""
                    }`}
                    onClick={() => handleUserSelect("all")}
                  >
                    <span className={styles.userFilterOptionText}>All Users</span>
                    {selectedUser === "all" && <Check size={16} className={styles.userFilterCheck} />}
                  </button>
                  {userOptions.length > 0 && <div className={styles.userFilterDivider} />}
                  {userOptions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      role="option"
                      aria-selected={selectedUser === name}
                      className={`${styles.userFilterOption} ${
                        selectedUser === name ? styles.userFilterOptionActive : ""
                      }`}
                      onClick={() => handleUserSelect(name)}
                    >
                      <span className={styles.userFilterOptionAvatar}>
                        <User size={12} />
                      </span>
                      <span className={styles.userFilterOptionText}>{name}</span>
                      {selectedUser === name && (
                        <Check size={16} className={styles.userFilterCheck} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            </div>

            <div className={styles.toolbarRight}>
              <div className={dashboardStyles.searchUsers}>
                <Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Search logs by user, action, record, or ID..."
                  className={dashboardStyles.searchInputSmall}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={dashboardStyles.userTableContainer}>
          <table className={dashboardStyles.userTable}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Operation</th>
                <th>Record Type</th>
                <th>Target Record</th>
                <th>Record ID</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>
                    <div className={styles.loadingWrap}>
                      <Loader2 size={32} className={dashboardStyles.spinner} />
                      <span>Loading audit trails...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>
                    No logs found.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const operationColor = getOperationColor(log.logName);
                  const typeStyle = getRecordTypeStyle(log.recordType);

                  return (
                    <tr key={log._id}>
                      <td>
                        <div className={styles.timestampCell}>
                          <Clock size={14} />
                          <span>{formatDateTimeWithSeconds(log.createdAt)}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.userAvatar}>
                            <User size={14} />
                          </div>
                          <span className={styles.userName}>{log.byPersonName}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.operationCell}>
                          <span
                            className={styles.operationDot}
                            style={{ backgroundColor: operationColor }}
                          />
                          <span
                            className={styles.operationText}
                            style={{ color: operationColor }}
                          >
                            {log.logName}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={styles.typeBadge}
                          style={{ backgroundColor: typeStyle.bg, color: typeStyle.color }}
                        >
                          <Tag size={11} />
                          {log.recordType}
                        </span>
                      </td>
                      <td>
                        <span className={styles.recordName}>{log.recordName}</span>
                      </td>
                      <td>
                        <span className={styles.monoCell}>
                          <Hash size={12} />
                          {formatRecordId(log.recordId)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className={dashboardStyles.tableFooter}>
          <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
            Showing {filteredLogs.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, filteredLogs.length)} of{" "}
            {filteredLogs.length.toLocaleString()} entries
          </div>
          {totalPages > 1 && (
            <div className={dashboardStyles.pagination}>
              <div
                className={`${dashboardStyles.pageBtn} ${
                  currentPage === 1 ? styles.pageBtnDisabled : ""
                }`}
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
                    className={`${dashboardStyles.pageBtn} ${
                      currentPage === page ? dashboardStyles.pageActive : ""
                    }`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </div>
                )
              )}
              <div
                className={`${dashboardStyles.pageBtn} ${
                  currentPage === totalPages ? styles.pageBtnDisabled : ""
                }`}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                <ChevronRight size={18} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
