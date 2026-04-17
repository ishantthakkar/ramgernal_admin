"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "./leads-edit.module.css";
import dashboardStyles from "../../../dashboard.module.css";
import { 
  X, 
  Save, 
  FileText,
  MoreVertical,
  Loader2,
  ChevronDown
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";

export default function EditLeadPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    mobileNumber: "",
    salesPerson: "",
    status: "",
    address: ""
  });

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const response = await adminApi.getLeadById(id);
        const lead = response.lead || response.data || response;
        setFormData({
          name: lead.name || "",
          company: lead.company || "",
          email: lead.email || "",
          mobileNumber: lead.mobileNumber || "",
          salesPerson: lead.salesPerson || "",
          status: lead.status || "",
          address: lead.address || ""
        });
      } catch (err) {
        console.error("Failed to fetch lead:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateLead(id, formData);
      toast.success("Lead updated successfully!");
      router.push("/leads");
    } catch (err: any) {
      toast.error(err.message || "Failed to update lead.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.editPage}>
      <div className={dashboardStyles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span> 
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/leads")}>LEADS</span> 
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span> 
        <span style={{ color: "#0076ce" }}>EDIT LEAD</span>
      </div>

      <div className={styles.titleArea}>
        <h1 className={styles.profileTitle}>Lead Profile: {loading ? "Loading..." : formData.name}</h1>
      </div>

      {/* Lead Information */}
      <section className={styles.formSection}>
        <h2 className={styles.sectionHeading}>Lead Information</h2>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Name</label>
            <input 
              type="text" 
              name="name"
              className={styles.formInput} 
              placeholder="e.g. Marcus Aurelius" 
              value={formData.name}
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
              name="mobileNumber"
              className={styles.formInput} 
              placeholder="+1 (555) 000-0000" 
              value={formData.mobileNumber}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
            <label>Office Address</label>
            <input 
              type="text" 
              name="address"
              className={styles.formInput} 
              placeholder="e.g. 8802 Grid Lane, Sector 7, Chicago" 
              value={formData.address}
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
            <label>Salesperson</label>
            <div style={{ position: "relative" }}>
              <select 
                name="salesPerson"
                className={styles.formSelect}
                value={formData.salesPerson}
                onChange={handleChange}
              >
                <option value="Jay Desai">Jay Desai</option>
                <option value="Sarah Abrrams">Sarah Abrrams</option>
                <option value="John Doe">John Doe</option>
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
                <option value="New">New</option>
                <option value="Active">Active</option>
                <option value="In Progress">In Progress</option>
                <option value="Closed">Closed</option>
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
              <td style={{ maxWidth: "300px", lineHeight: "1.4", wordBreak: "break-all" }}>
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
          onClick={() => router.push("/leads")}
        >
          <X size={18} /> Cancel
        </button>
        <button 
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
