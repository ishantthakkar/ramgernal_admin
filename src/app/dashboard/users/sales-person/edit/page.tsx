"use client";

import { useRouter } from "next/navigation";
import styles from "../../../dashboard.module.css";
import { 
  UserPlus, 
  Settings, 
  X, 
  ChevronDown,
  Edit3
} from "lucide-react";

export default function EditSalesPersonPage() {
  const router = useRouter();

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>/</span> 
        TEAM MANAGEMENT <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>/</span> 
        <span style={{ color: "#0076ce" }}>EDIT USER</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Edit Sales Person</h1>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          USER ID : <span style={{ color: "#1e293b" }}>#VC-92410</span>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()}>
        {/* Profile Information Section */}
        <section className={styles.formSection}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <div style={{ color: "#0076ce" }}>
              <Edit3 size={22} />
            </div>
            <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1e293b" }}>Profile Information</span>
          </div>
          <p className={styles.sectionSubtitle}>
            Enter the primary identification details for the new user account.
          </p>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>NAME</label>
              <input 
                type="text" 
                placeholder="e.g. Marcus Aurelius" 
                className={styles.formInput} 
                defaultValue="Andrew Scoff"
              />
            </div>
            <div className={styles.formGroup}>
              <label>COMPANY</label>
              <input 
                type="text" 
                placeholder="Industrial Corp Ltd." 
                className={styles.formInput} 
                defaultValue="Xelectronics"
              />
            </div>
            <div className={styles.formGroup}>
              <label>EMAIL ADDRESS</label>
              <input 
                type="email" 
                placeholder="m.aurelius@voltcore.com" 
                className={styles.formInput} 
                defaultValue="r.mill@gridtech.com"
              />
            </div>
            <div className={styles.formGroup}>
              <label>MOBILE NUMBER</label>
              <input 
                type="text" 
                placeholder="+1 (555) 000-0000" 
                className={styles.formInput} 
                defaultValue="+1 235 1254 2214"
              />
            </div>
          </div>
        </section>

        {/* Work Information Section */}
        <section className={styles.formSection}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <div style={{ color: "#0076ce" }}>
              <Settings size={22} />
            </div>
            <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1e293b" }}>Work Information</span>
          </div>
          <p className={styles.sectionSubtitle}>
            Define the user&apos;s role and initial system status.
          </p>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>ACTIVE LEADS</label>
              <input 
                type="text" 
                placeholder="20" 
                className={styles.formInput} 
                defaultValue="15"
              />
            </div>
            <div className={styles.formGroup}>
              <label>CUSTOMERS</label>
              <input 
                type="text" 
                placeholder="15" 
                className={styles.formInput} 
                defaultValue="14"
              />
            </div>
            <div className={styles.formGroup}>
              <label>CLOSED LEADS</label>
              <input 
                type="text" 
                placeholder="10" 
                className={styles.formInput} 
                defaultValue="10"
              />
            </div>
            <div className={styles.formGroup}>
              <label>STATUS</label>
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
            onClick={() => router.push("/dashboard/users/sales-person")}
          >
            <X size={20} /> Cancel
          </button>
          <button type="submit" className={styles.createBtn} style={{ background: "#0076ce" }}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
