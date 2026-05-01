"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "../../edit/[id]/commission-edit.module.css";
import dashboardStyles from "../../../dashboard.module.css";
import modalStyles from "../../commissions-modal.module.css";
import {
  X,
  Loader2,
} from "lucide-react";
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
      <div className={styles.editPage}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem" }}>
          <Loader2 size={40} className={dashboardStyles.spinner} style={{ color: "#64748b" }} />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className={styles.editPage}>
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
    <div className={styles.editPage}>
      {/* Breadcrumb */}
      <div className={dashboardStyles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/commissions")}>
          COMMISSIONS
        </span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>VIEW COMMISSION</span>
      </div>

      <div className={styles.titleArea}>
        <h1 className={styles.profileTitle}>
          Commission Details: {customer.name}
        </h1>
      </div>

      {/* Customer Information */}
      <section className={styles.formSection}>
        <h2 className={styles.sectionHeading}>Customer Information</h2>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Customer Name</label>
            <div className={styles.readOnlyField}>{customer.name}</div>
          </div>

          <div className={styles.formGroup}>
            <label>Company Name</label>
            <div className={styles.readOnlyField}>{customer.company}</div>
          </div>

          <div className={styles.formGroup}>
            <label>Sales Person</label>
            <div className={styles.readOnlyField}>{customer.salesPerson}</div>
          </div>

          <div className={styles.formGroup}>
            <label>Contractor</label>
            <div className={styles.readOnlyField}>{customer.contractor}</div>
          </div>

          <div className={styles.formGroup}>
            <label>Total Commission</label>
            <div className={styles.readOnlyField}>${(customer.total_overall_amount || 0).toLocaleString()}</div>
          </div>

          <div className={styles.formGroup}>
            <label>Paid Amount</label>
            <div className={styles.readOnlyField}>${(customer.total_paid_amount || 0).toLocaleString()}</div>
          </div>

          <div className={styles.formGroup}>
            <label>Pending Amount</label>
            <div className={styles.readOnlyField}>${(customer.total_pending_amount || 0).toLocaleString()}</div>
          </div>
        </div>
      </section>

      {/* Commission History */}
      <section className={styles.paymentsSection}>
        <h2 className={styles.sectionHeading}>Commission History</h2>
        {(customer.commissions || []).length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontWeight: 500 }}>
            No commissions recorded.
          </div>
        ) : (
          <table className={styles.paymentTable}>
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
              {(customer.commissions || []).map((comm, idx) => (
                <tr key={comm._id}>
                  <td style={{ fontWeight: 600, color: "#64748b" }}>{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>
                    {comm.commissionType === "Other" && comm.otherName
                      ? `${comm.commissionType} (${comm.otherName})`
                      : comm.commissionType}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    ${(comm.amount || 0).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    ${(comm.paidAmount || 0).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    ${(comm.pending || 0).toLocaleString()}
                  </td>
                  <td>
                    <span
                      className={`${modalStyles.badge} ${comm.paymentStatus === "paid" ? modalStyles.badgeBlue : ""}`}
                      style={{
                        background: comm.paymentStatus === "paid" ? "#ecfdf5" : "#fffbeb",
                        color: comm.paymentStatus === "paid" ? "#10b981" : "#f59e0b",
                      }}
                    >
                      {comm.paymentStatus === "payment pending" ? "pending" : comm.paymentStatus}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {comm.paymentMethod}
                  </td>
                  <td>
                    {comm.paymentDate ? new Date(comm.paymentDate).toLocaleDateString() : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

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
