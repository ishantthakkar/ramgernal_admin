"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "./customer-edit.module.css";
import dashboardStyles from "../../../dashboard.module.css";
import { 
  X, 
  FileText,
  ChevronDown
} from "lucide-react";

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState({
    fullName: "Jonathan Vance",
    company: "Nexus Grid System",
    email: "j.vance@vancepower.com",
    mobile: "+1 (555) 012-9938",
    role: "sales_person",
    status: "active"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Simulated save logic
    router.push(`/customers/${id}`);
  };

  return (
    <div className={styles.editPage}>
      {/* Breadcrumb */}
      <div className={dashboardStyles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span> 
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/customers")}>COSTUMER</span> 
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span> 
        <span style={{ color: "#0076ce" }}>EDIT COSTUMER</span>
      </div>

      <div className={styles.titleArea}>
        <h1 className={styles.profileTitle}>Costumer Profile: {formData.fullName}</h1>
      </div>

      {/* Customer Information */}
      <section className={styles.formSection}>
        <h2 className={styles.sectionHeading}>Costumer Information</h2>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Full Name</label>
            <input 
              type="text" 
              name="fullName"
              className={styles.formInput} 
              placeholder="e.g. Marcus Aurelius" 
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Company</label>
            <input 
              type="text" 
              name="company"
              className={styles.formInput} 
              placeholder="Industrial Corp Ltd." 
              value={formData.company}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Email Address</label>
            <input 
              type="email" 
              name="email"
              className={styles.formInput} 
              placeholder="m.aurelius@voltcore.com" 
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Mobile Number</label>
            <input 
              type="text" 
              name="mobile"
              className={styles.formInput} 
              placeholder="+1 (555) 000-0000" 
              value={formData.mobile}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      {/* Access & Permissions */}
      <section className={styles.formSection}>
        <h2 className={styles.sectionHeading}>Access & Permissions</h2>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>User Role</label>
            <div style={{ position: "relative" }}>
              <select 
                name="role"
                className={styles.formSelect}
                value={formData.role}
                onChange={handleChange}
              >
                <option value="sales_person">Sales Person</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <ChevronDown size={18} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94a3b8" }} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Account Status</label>
            <div style={{ position: "relative" }}>
              <select 
                name="status"
                className={styles.formSelect}
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
              <ChevronDown size={18} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94a3b8" }} />
            </div>
          </div>
        </div>
      </section>

      {/* Activities (Read-only) */}
      <section className={styles.activitiesSection}>
        <div className={styles.iconBox}>
          <FileText size={20} />
        </div>
        <table className={styles.activityTable}>
          <thead>
            <tr>
              <th>Activity Type</th>
              <th>Date</th>
              <th>Outcome</th>
              <th>Next Follow-up Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Call</td>
              <td>04/07/2026</td>
              <td>Showing Interest</td>
              <td>04/09/2026</td>
            </tr>
            <tr>
              <td>Meeting</td>
              <td>04/10/2026</td>
              <td style={{ maxWidth: "300px", lineHeight: "1.4", wordBreak: "break-all", color: "#64748b" }}>
                xcxcxcxcxcxxxxxcxcxxcxcxcxcxcxcxcxccxssjsncsjdnsjcnsjcnsjcnscjcncsnccscscs
              </td>
              <td>04/09/2026</td>
            </tr>
            <tr>
              <td>Site Visit</td>
              <td>04/10/2026</td>
              <td>Showing Interest</td>
              <td>04/09/2026</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Action Footer */}
      <div className={styles.actionFooter}>
        <button 
          className={styles.cancelBtn}
          onClick={() => router.push(`/customers/${id}`)}
        >
          <X size={18} /> Cancel
        </button>
        <button 
          className={styles.saveBtn}
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  );
}
