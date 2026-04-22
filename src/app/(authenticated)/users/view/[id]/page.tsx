"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "../../../dashboard.module.css";
import {
  UserPlus,
  ShieldCheck,
  X,
  Loader2,
  Edit2
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";

export default function ViewUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await adminApi.getUserById(id);
        const userData = response.user || response.data || response;
        setUser(userData);
      } catch (err: any) {
        toast.error(err.message || "Failed to fetch user details.");
        router.push("/users");
      } finally {
        setFetching(false);
      }
    };

    if (id) fetchUser();
  }, [id, router]);

  if (fetching) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className={styles.spinner} color="#0076ce" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/users")}>USERS</span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>VIEW USER</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>View User Profile</h1>
      </div>

      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <UserPlus size={22} color="#0076ce" /> Profile Information
        </div>
        <p className={styles.sectionSubtitle}>
          Full profile identification details for this user account.
        </p>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Name</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              {user.fullName || "N/A"}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Mobile Number</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              {user.mobileNumber || "N/A"}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Email Address</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              {user.email || "N/A"}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Company</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              {user.company || "N/A"}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <ShieldCheck size={22} color="#0076ce" /> Access & Permissions
        </div>
        <p className={styles.sectionSubtitle}>
          Assigned role and current system status.
        </p>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>User Role</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0", textTransform: "capitalize" }}>
              {user.userRole?.replace("_", " ") || "N/A"}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Status</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: user.status === "active" ? "#059669" : "#dc2626", fontWeight: 700, border: "1px solid #e2e8f0", textTransform: "capitalize" }}>
              {user.status || "Inactive"}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.actionFooter} style={{ background: "#f1f5f9", padding: "2.5rem", borderRadius: "16px", marginTop: "3rem", justifyContent: "flex-end" }}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => router.push("/users")}
          style={{ padding: "0.875rem 3rem", background: "#64748b", color: "#ffffff" }}
        >
          <X size={20} /> Close
        </button>
      </div>
    </div>
  );
}
