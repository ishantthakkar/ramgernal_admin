"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../dashboard.module.css";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import { canViewModule } from "@/lib/permissions";
import {
  User,
  Search as SearchIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Tag,
  Hash
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

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!canViewModule("Audit")) {
      toast.error("You do not have permission to view audit logs.");
      router.push("/dashboard");
      return;
    }

    const fetchLogs = async () => {
      try {
        const response = await adminApi.getActivityLogs();
        if (response.success) {
          setLogs(response.data);
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to fetch audit logs");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // Reset to first page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const getActionColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes("update") || actionLower.includes("assign")) return "#0076ce";
    if (actionLower.includes("create")) return "#10b981";
    if (actionLower.includes("failure") || actionLower.includes("delete")) return "#ef4444";
    if (actionLower.includes("convert")) return "#8b5cf6";
    return "#64748b";
  };

  const filteredLogs = logs.filter(log =>
    log.logName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.byPersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.recordName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.recordType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={styles.usersPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>AUDIT LOGS</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>System Audit Logs</h1>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.searchUsers}>
            <SearchIcon size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search logs by user, action, or record..."
              className={styles.searchInputSmall}
              style={{ width: 440 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
          </div>
        </div>

        <div className={styles.userTableContainer}>
          {loading ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "#94a3b8" }}>
              <div className={styles.spinner} style={{ margin: "0 auto 1rem" }}></div>
              Loading audit trails...
            </div>
          ) : paginatedLogs.length === 0 ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "#94a3b8" }}>
              No logs found matching your criteria.
            </div>
          ) : (
            <table className={styles.userTable}>
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
                {paginatedLogs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                        <Clock size={14} />
                        <span style={{ fontWeight: 600 }}>{formatDate(log.createdAt)}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 24, height: 24, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={12} color="#64748b" />
                        </div>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{log.byPersonName}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        color: getActionColor(log.logName),
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}>
                        {log.logName}
                      </span>
                    </td>
                    <td>
                      <span className={styles.idBadge} style={{ background: '#eff6ff', color: '#1d4ed8', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Tag size={12} />
                        {log.recordType}
                      </span>
                    </td>
                    <td>
                      <div style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>
                        {log.recordName}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#94a3b8' }}>
                        <Hash size={12} />
                        <code>{log._id.slice(-8).toUpperCase()}</code>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.tableFooter}>
          <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
          </div>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer", border: "none", background: "none" }}
              >
                <ChevronLeft size={18} />
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.pageActive : ""}`}
                  onClick={() => setCurrentPage(i + 1)}
                  style={{ border: "none", cursor: "pointer" }}
                >
                  {i + 1}
                </button>
              ))}

              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer", border: "none", background: "none" }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
