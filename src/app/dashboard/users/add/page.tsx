"use client";

import { useRouter } from "next/navigation";
import styles from "../../dashboard.module.css";
import { 
  UserPlus, 
  ShieldCheck, 
  X, 
  ChevronDown 
} from "lucide-react";

export default function AddUserPage() {
  const router = useRouter();

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>/</span> 
        TEAM MANAGEMENT <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>/</span> 
        <span style={{ color: "#0076ce" }}>ADD USER</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Register New User</h1>
      </div>

      <form onSubmit={(e) => e.preventDefault()}>
        {/* Profile Information Section */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <UserPlus size={22} color="#0076ce" /> Profile Information
          </div>
          <p className={styles.sectionSubtitle}>
            Enter the primary identification details for the new user account.
          </p>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="e.g. Marcus Aurelius" 
                className={styles.formInput} 
              />
            </div>
            <div className={styles.formGroup}>
              <label>Company</label>
              <input 
                type="text" 
                placeholder="Industrial Corp Ltd." 
                className={styles.formInput} 
              />
            </div>
            <div className={styles.formGroup}>
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="m.aurelius@voltcore.com" 
                className={styles.formInput} 
              />
            </div>
            <div className={styles.formGroup}>
              <label>Mobile Number</label>
              <input 
                type="text" 
                placeholder="+1 (555) 000-0000" 
                className={styles.formInput} 
              />
            </div>
          </div>
        </section>

        {/* Access & Permissions Section */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <ShieldCheck size={22} color="#0076ce" /> Access & Permissions
          </div>
          <p className={styles.sectionSubtitle}>
            Define the user's role and initial system status.
          </p>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>User Role</label>
              <div style={{ position: "relative" }}>
                <select className={styles.formSelect} defaultValue="Sales Person">
                  <option>Sales Person</option>
                  <option>Contractor</option>
                  <option>Project Manager</option>
                  <option>Administrator</option>
                </select>
                <ChevronDown size={18} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Account Status</label>
              <div style={{ position: "relative" }}>
                <select className={styles.formSelect} defaultValue="Active">
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Pending</option>
                </select>
                <ChevronDown size={18} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }} />
              </div>
            </div>
          </div>
        </section>

        {/* Action Footer */}
        <div className={styles.actionFooter}>
          <button 
            type="button" 
            className={styles.cancelBtn}
            onClick={() => router.push("/dashboard/users")}
          >
            <X size={20} /> Cancel
          </button>
          <button type="submit" className={styles.createBtn}>
            <UserPlus size={20} /> Create User
          </button>
        </div>
      </form>
    </div>
  );
}
