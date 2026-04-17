"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./leads-add.module.css";
import dashboardStyles from "../../dashboard.module.css";
import { 
  UserPlus, 
  ShieldCheck, 
  X, 
  ChevronDown,
  Info,
  Building,
  Mail,
  Phone,
  Briefcase
} from "lucide-react";
import { adminApi } from "@/lib/api";

export default function AddLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    mobileNumber: "",
    status: "New",
    source: "",
    salesPerson: "",
    address: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        lastActivity: new Date().toISOString()
      };
      await adminApi.createLead(payload);
      router.push("/leads");
    } catch (err: any) {
      alert(err.message || "Failed to create lead. Please check your data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.leadsAddPage}>
      <div className={dashboardStyles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span> 
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/leads")}>LEADS</span> 
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span> 
        <span style={{ color: "#0076ce" }}>ADD NEW LEAD</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Create New Prospect</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Core Lead Information Section */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <Info size={22} color="#0076ce" /> Core Information
          </div>
          <p className={styles.sectionSubtitle}>
            Primary details of the prospective client and their organization.
          </p>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Full Name</label>
              <input 
                name="name"
                type="text" 
                placeholder="e.g. Robert Millhouse" 
                className={styles.formInput} 
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Company Name</label>
              <input 
                name="company"
                type="text" 
                placeholder="Nexus Grid Systems" 
                className={styles.formInput} 
                value={formData.company}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Email Address</label>
              <input 
                name="email"
                type="email" 
                placeholder="robert@grid.tech" 
                className={styles.formInput} 
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Mobile Number</label>
              <input 
                name="mobileNumber"
                type="text" 
                placeholder="+1 235 1254 2214" 
                className={styles.formInput} 
                value={formData.mobileNumber}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label>Office Address</label>
              <input 
                name="address"
                type="text" 
                placeholder="e.g. 8802 Grid Lane, Sector 7, Chicago" 
                className={styles.formInput} 
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        {/* Lead Classification Section */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <Briefcase size={22} color="#0076ce" /> Lead Classification
          </div>
          <p className={styles.sectionSubtitle}>
            Specify lead status, source, and assign responsible staff.
          </p>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Current Status</label>
              <div style={{ position: "relative" }}>
                <select 
                  name="status"
                  className={styles.formSelect} 
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="New">New</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>
                <ChevronDown size={18} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Salesperson</label>
              <div style={{ position: "relative" }}>
                <select 
                  name="salesPerson"
                  className={styles.formSelect} 
                  value={formData.salesPerson}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Salesperson</option>
                  <option value="Jay Desai">Jay Desai</option>
                  <option value="Sarah Abrrams">Sarah Abrrams</option>
                  <option value="Jonathan Vance">Jonathan Vance</option>
                </select>
                <ChevronDown size={18} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }} />
              </div>
            </div>
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label>Lead Source</label>
              <input 
                name="source"
                type="text" 
                placeholder="Industry Trade Expo 2024" 
                className={styles.formInput} 
                value={formData.source}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        {/* Action Footer */}
        <div className={styles.actionFooter}>
          <button 
            type="button" 
            className={styles.cancelBtn}
            onClick={() => router.push("/leads")}
            disabled={loading}
          >
            <X size={20} /> Cancel
          </button>
          <button type="submit" className={styles.createBtn} disabled={loading}>
            {loading ? "Creating..." : <><UserPlus size={20} /> Create Lead</>}
          </button>
        </div>
      </form>
    </div>
  );
}
