"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../dashboard.module.css";
import {
  DollarSign,
  Search as SearchIcon,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  X,
  Pencil,
  Loader2,
} from "lucide-react";
import modalStyles from "./commissions-modal.module.css";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";

interface ApiCommission {
  _id: string;
  commissionType: string;
  salesPerson: string | null;
  contractor: string | null;
  otherName?: string;
  amount: number;
  paidAmount: number;
  paymentMethod: string;
  paymentDate: string;
  paymentStatus: string;
  date: string;
  paidTo: string;
  pending: number;
}

interface ApiCustomer {
  id: string;
  name: string;
  company: string;
  salesPerson: string;
  contractor: string;
  total_overall_amount: number;
  total_paid_amount: number;
  total_pending_amount: number;
  commissions: ApiCommission[];
}

interface OverallSummary {
  totalCommission: number;
  totalPaid: number;
  totalPending: number;
}

export default function CommissionsPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [summary, setSummary] = useState<OverallSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState<{
    title: string;
    customer: string;
    commissions: ApiCommission[];
    amount: number;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCommissions = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getCommissionList();
        setCustomers(response.customers || []);
        setSummary(response.overallSummary || null);
      } catch (err: any) {
        console.error("Failed to fetch commissions:", err);
        toast.error(err.message || "Failed to load commissions.");
      } finally {
        setLoading(false);
      }
    };
    fetchCommissions();
  }, []);

  const stats = useMemo(() => {
    if (summary) {
      return [
        { label: "Total Commissions", value: `$${summary.totalCommission.toLocaleString()}`, icon: DollarSign, color: "#0076ce", bg: "#e0e7ff" },
        { label: "Paid Amount", value: `$${summary.totalPaid.toLocaleString()}`, icon: CheckCircle2, color: "#10b981", bg: "#ecfdf5" },
        { label: "Pending Amount", value: `$${summary.totalPending.toLocaleString()}`, icon: Clock, color: "#f59e0b", bg: "#fffbeb" },
      ];
    }
    const total = customers.reduce((sum, c) => sum + (c.total_overall_amount || 0), 0);
    const paid = customers.reduce((sum, c) => sum + (c.total_paid_amount || 0), 0);
    const pending = customers.reduce((sum, c) => sum + (c.total_pending_amount || 0), 0);
    return [
      { label: "Total Commissions", value: `$${total.toLocaleString()}`, icon: DollarSign, color: "#0076ce", bg: "#e0e7ff" },
      { label: "Paid Amount", value: `$${paid.toLocaleString()}`, icon: CheckCircle2, color: "#10b981", bg: "#ecfdf5" },
      { label: "Pending Amount", value: `$${pending.toLocaleString()}`, icon: Clock, color: "#f59e0b", bg: "#fffbeb" },
    ];
  }, [customers, summary]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        c.company?.toLowerCase().includes(term) ||
        c.salesPerson?.toLowerCase().includes(term) ||
        c.contractor?.toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

  if (loading) {
    return (
      <div className={styles.usersPage}>
        <div className={styles.breadcrumb}>ADMIN <span>/</span> COMMISSIONS</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem" }}>
          <Loader2 size={40} className={styles.spinner} style={{ color: "#64748b" }} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.usersPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span>/</span> COMMISSIONS
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Commissions Overview</h1>
      </div>

      <div className={styles.userStatsGrid} style={{ marginBottom: "2rem" }}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.userStatCard}>
            <div
              className={styles.userStatIcon}
              style={{ backgroundColor: stat.bg, color: stat.color }}
            >
              <stat.icon size={22} />
            </div>
            <div className={styles.userStatValue}>{stat.value}</div>
            <div className={styles.userStatLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Commissions Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
            All Commission Records
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div className={styles.searchUsers}>
              <SearchIcon size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search commissions..."
                className={styles.searchInputSmall}
                style={{ width: 300 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={styles.filterBtn}>
              <Filter size={18} />
            </div>
          </div>
        </div>

        <div className={styles.userTableContainer}>
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Customer Name</th>
                <th>Company Name</th>
                <th>Sales Person</th>
                <th>Contractor</th>
                <th>Total Amount</th>
                <th>Paid Amount</th>
                <th>Pending Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: "#94a3b8" }}>{idx + 1}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: "#1e293b" }}>{item.name}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: "#475569" }}>{item.company}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 500, color: "#1e293b" }}>{item.salesPerson}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 500, color: "#1e293b" }}>{item.contractor}</span>
                  </td>
                  <td
                    style={{ fontWeight: 700, color: "#0076ce", cursor: "pointer" }}
                    onClick={() =>
                      setSelectedDetail({
                        title: "Total Commission Details",
                        customer: item.name,
                        commissions: item.commissions || [],
                        amount: item.total_overall_amount || 0,
                      })
                    }
                  >
                    ${(item.total_overall_amount || 0).toLocaleString()}
                  </td>
                  <td
                    style={{ fontWeight: 700, color: "#10b981", cursor: "pointer" }}
                    onClick={() =>
                      setSelectedDetail({
                        title: "Paid Commission Details",
                        customer: item.name,
                        commissions: (item.commissions || []).filter((c) => c.paidAmount > 0),
                        amount: item.total_paid_amount || 0,
                      })
                    }
                  >
                    ${(item.total_paid_amount || 0).toLocaleString()}
                  </td>
                  <td
                    style={{ fontWeight: 700, color: "#f59e0b", cursor: "pointer" }}
                    onClick={() =>
                      setSelectedDetail({
                        title: "Pending Commission Details",
                        customer: item.name,
                        commissions: (item.commissions || []).filter((c) => c.pending > 0),
                        amount: item.total_pending_amount || 0,
                      })
                    }
                  >
                    ${(item.total_pending_amount || 0).toLocaleString()}
                  </td>
                  <td>
                    <button
                      style={{
                        background: "#f1f5f9",
                        border: "none",
                        color: "#64748b",
                        padding: "0.4rem 0.75rem",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#e2e8f0";
                        e.currentTarget.style.color = "#1e293b";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#f1f5f9";
                        e.currentTarget.style.color = "#64748b";
                      }}
                      onClick={() => router.push(`/commissions/edit/${item.id}`)}
                    >
                      <Pencil size={14} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                    No commission records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.tableFooter}>
          <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
            Showing {filteredCustomers.length} entries
          </div>
          <div className={styles.pagination}>
            <div className={styles.pageBtn}>
              <ChevronLeft size={18} />
            </div>
            <div className={`${styles.pageBtn} ${styles.pageActive}`}>1</div>
            <div className={styles.pageBtn}>
              <ChevronRight size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Commission Detail Modal */}
      {selectedDetail && (
        <div className={modalStyles.modalOverlay} onClick={() => setSelectedDetail(null)}>
          <div className={modalStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={modalStyles.modalHeader}>
              <div>
                <h3>{selectedDetail.title}</h3>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.2rem" }}>
                  Customer: <span style={{ fontWeight: 600, color: "#1e293b" }}>{selectedDetail.customer}</span>
                  <span style={{ margin: "0 0.5rem" }}>|</span>
                  Amount: <span style={{ fontWeight: 600, color: "#1e293b" }}>${(selectedDetail.amount || 0).toLocaleString()}</span>
                </div>
              </div>
              <button className={modalStyles.closeBtn} onClick={() => setSelectedDetail(null)}>
                <X size={24} />
              </button>
            </div>

            <div className={modalStyles.modalBody}>
              {selectedDetail.commissions.length === 0 ? (
                <div className={modalStyles.emptyState}>
                  No commission records found.
                </div>
              ) : (
                <table className={modalStyles.detailTable}>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Paid</th>
                      <th>Pending</th>
                      <th>Status</th>
                      <th>Payment Method</th>
                      <th>Payment Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDetail.commissions.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>
                          {row.commissionType === "Other" && row.otherName
                            ? `${row.commissionType} (${row.otherName})`
                            : row.commissionType}
                        </td>
                        <td className={modalStyles.amount}>${(row.amount || 0).toLocaleString()}</td>
                        <td style={{ color: "#10b981", fontWeight: 600 }}>${(row.paidAmount || 0).toLocaleString()}</td>
                        <td style={{ color: "#f59e0b", fontWeight: 600 }}>${(row.pending || 0).toLocaleString()}</td>
                        <td>
                          <span
                            className={`${modalStyles.badge} ${
                              row.paymentStatus === "paid" ? modalStyles.badgeBlue : ""
                            }`}
                            style={{
                              background: row.paymentStatus === "paid" ? "#ecfdf5" : "#fffbeb",
                              color: row.paymentStatus === "paid" ? "#10b981" : "#f59e0b",
                            }}
                          >
                            {row.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <span className={`${modalStyles.badge} ${modalStyles.badgeBlue}`}>
                            {row.paymentMethod}
                          </span>
                        </td>
                        <td>{row.paymentDate ? new Date(row.paymentDate).toLocaleDateString() : "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
