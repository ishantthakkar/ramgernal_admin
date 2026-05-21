"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "../../edit/[id]/commission-edit.module.css";
import dashboardStyles from "../../../dashboard.module.css";
import modalStyles from "../../commissions-modal.module.css";
import {
  X,
  Loader2,
  User,
  Building,
  Briefcase,
  HardHat,
  DollarSign
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import { formatDate } from "@/lib/dateUtils";

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

export default function ViewCommissionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<ApiCustomer | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getCommissionList();
        const found = (response.customers || []).find((c: ApiCustomer) => c.id === id);
        if (found) {
          setCustomer(found);
        } else {
          toast.error("Customer not found.");
        }
      } catch (err: any) {
        console.error("Failed to fetch commissions:", err);
        toast.error(err.message || "Failed to load commission data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className={dashboardStyles.spinner} />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className={dashboardStyles.addUserPage}>
        <div className={dashboardStyles.breadcrumb}>
          ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
          <span style={{ cursor: "pointer" }} onClick={() => router.push("/commissions")}>COMMISSIONS</span>
        </div>
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>
          Customer not found.
        </div>
      </div>
    );
  }

  return (
    <div className={dashboardStyles.addUserPage}>
      {/* Breadcrumb */}
      <div className={dashboardStyles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/commissions")}>
          COMMISSIONS
        </span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>VIEW COMMISSION</span>
      </div>

      <div className={dashboardStyles.pageHeader}>
        <h1 className={dashboardStyles.welcomeText}>
          Commission Details: {customer.name}
        </h1>
      </div>

      {/* Customer Information */}
      <div className={dashboardStyles.formSection}>
        <div className={dashboardStyles.sectionTitle}>
          <User size={22} color="#0076ce" /> Commission Profile
        </div>

        <div className={dashboardStyles.formGrid}>
          <div className={dashboardStyles.formGroup}>
            <label>Customer Name</label>
            <div className={dashboardStyles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <User size={16} color="#64748b" />
                {customer.name}
              </div>
            </div>
          </div>

          <div className={dashboardStyles.formGroup}>
            <label>Company Name</label>
            <div className={dashboardStyles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Building size={16} color="#64748b" />
                {customer.company}
              </div>
            </div>
          </div>

          <div className={dashboardStyles.formGroup}>
            <label>Sales Person</label>
            <div className={dashboardStyles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Briefcase size={16} color="#64748b" />
                {customer.salesPerson}
              </div>
            </div>
          </div>

          <div className={dashboardStyles.formGroup}>
            <label>Contractor</label>
            <div className={dashboardStyles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <HardHat size={16} color="#64748b" />
                {customer.contractor}
              </div>
            </div>
          </div>

          <div className={dashboardStyles.formGroup}>
            <label>Total Commission</label>
            <div className={dashboardStyles.formInput} style={{ background: "#f8fafc", color: "#0076ce", fontWeight: 700, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <DollarSign size={16} />
                {(customer.total_overall_amount || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div className={dashboardStyles.formGroup}>
            <label>Paid Amount</label>
            <div className={dashboardStyles.formInput} style={{ background: "#f8fafc", color: "#10b981", fontWeight: 700, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <DollarSign size={16} />
                {(customer.total_paid_amount || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div className={dashboardStyles.formGroup}>
            <label>Pending Amount</label>
            <div className={dashboardStyles.formInput} style={{ background: "#fff1f2", color: "#e11d48", fontWeight: 700, border: "1px solid #fecdd3" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <DollarSign size={16} />
                {(customer.total_pending_amount || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Commission History */}
      <div className={dashboardStyles.formSection}>
        <div className={dashboardStyles.sectionTitle}>
          <DollarSign size={22} color="#0076ce" /> Commission History
        </div>

        {(customer.commissions || []).length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8", fontWeight: 500, background: "#f8fafc", borderRadius: "12px", border: "1px dashed #e2e8f0" }}>
            No commissions recorded for this account.
          </div>
        ) : (
          <div className={dashboardStyles.userTableContainer} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
            <table className={dashboardStyles.userTable}>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Pending</th>
                  <th>Status</th>
                  <th>Method</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(customer.commissions || []).map((comm, idx) => (
                  <tr key={comm._id}>
                    <td style={{ fontWeight: 600, color: "#64748b" }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: "#1e293b" }}>
                      {comm.commissionType === "Other" && comm.otherName
                        ? `${comm.commissionType} (${comm.otherName})`
                        : comm.commissionType}
                    </td>
                    <td style={{ fontWeight: 700, color: "#0076ce" }}>
                      ${(comm.amount || 0).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 700, color: "#10b981" }}>
                      ${(comm.paidAmount || 0).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 700, color: "#e11d48" }}>
                      ${(comm.pending || 0).toLocaleString()}
                    </td>
                    <td>
                      <span
                        className={`${modalStyles.badge} ${comm.paymentStatus === "paid" ? modalStyles.badgeBlue : ""}`}
                        style={{
                          background: comm.paymentStatus === "paid" ? "#ecfdf5" : "#fffbeb",
                          color: comm.paymentStatus === "paid" ? "#10b981" : "#f59e0b",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          textTransform: "uppercase"
                        }}
                      >
                        {comm.paymentStatus === "payment pending" ? "pending" : comm.paymentStatus}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: "#475569" }}>
                      {comm.paymentMethod}
                    </td>
                    <td style={{ color: "#64748b", fontSize: "0.85rem" }}>
                      {comm.paymentDate ? formatDate(comm.paymentDate) : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Back Footer */}
      <div className={dashboardStyles.actionFooter} style={{ background: "#f1f5f9", padding: "2.5rem", borderRadius: "16px", marginTop: "3rem", justifyContent: "flex-end", display: "flex" }}>
        <button
          type="button"
          className={dashboardStyles.cancelBtn}
          onClick={() => router.push("/commissions")}
          style={{ padding: "0.875rem 3rem", background: "#64748b", color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
        >
          <X size={20} /> Close
        </button>
      </div>
    </div>
  );
}
