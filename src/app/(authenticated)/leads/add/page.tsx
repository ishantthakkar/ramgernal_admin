"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../dashboard.module.css";
import {
  X,
  Save,
  FileText,
  Info,
  Loader2,
  ChevronDown,
  Building,
  User,
  Phone,
  Mail,
  Layers,
  MapPin,
  UserPlus
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";

export default function AddLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    mobileNumber: "",
    status: "New",
    leadSource: "",
    salesPerson: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    notes: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      toast.success("Lead created successfully!");
      router.push("/leads");
    } catch (err: any) {
      toast.error(err.message || "Failed to create lead. Please check your data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/leads")}>LEADS</span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>ADD NEW LEAD</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Create New Lead Profile</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Lead Information Section */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <Info size={22} color="#0076ce" /> Lead Information
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Full Name <span style={{ color: "#ef4444" }}>*</span></label>
              <div style={{ position: "relative" }}>
                <input
                  name="name"
                  type="text"
                  placeholder="e.g. Marcus Aurelius"
                  className={styles.formInput}
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <User size={16} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Company <span style={{ color: "#ef4444" }}>*</span></label>
              <div style={{ position: "relative" }}>
                <input
                  name="company"
                  type="text"
                  placeholder="Industrial Corp Ltd."
                  className={styles.formInput}
                  value={formData.company}
                  onChange={handleChange}
                  required
                />
                <Building size={16} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Lead Source</label>
              <div style={{ position: "relative" }}>
                <input
                  name="leadSource"
                  type="text"
                  placeholder="e.g. Google Search"
                  className={styles.formInput}
                  value={formData.leadSource}
                  onChange={handleChange}
                />
                <Layers size={16} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Sales Person <span style={{ color: "#ef4444" }}>*</span></label>
              <div style={{ position: "relative" }}>
                <input
                  name="salesPerson"
                  type="text"
                  placeholder="Assign Salesperson"
                  className={styles.formInput}
                  value={formData.salesPerson}
                  onChange={handleChange}
                  required
                />
                <User size={16} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              </div>
            </div>
          </div>
        </section>

        {/* Contact Details Section */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <FileText size={22} color="#0076ce" /> Contact & Address
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Email Address</label>
              <div style={{ position: "relative" }}>
                <input
                  name="email"
                  type="email"
                  placeholder="m.aurelius@voltcore.com"
                  className={styles.formInput}
                  value={formData.email}
                  onChange={handleChange}
                />
                <Mail size={16} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Mobile Number <span style={{ color: "#ef4444" }}>*</span></label>
              <div style={{ position: "relative" }}>
                <input
                  name="mobileNumber"
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  className={styles.formInput}
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  required
                />
                <Phone size={16} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              </div>
            </div>
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label>Address</label>
              <div style={{ position: "relative" }}>
                <input
                  name="street"
                  type="text"
                  placeholder="e.g. 123 Industrial Way"
                  className={styles.formInput}
                  value={formData.street}
                  onChange={handleChange}
                />
                <MapPin size={16} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>City</label>
              <input
                name="city"
                type="text"
                placeholder="Newport"
                className={styles.formInput}
                value={formData.city}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label>State</label>
              <input
                name="state"
                type="text"
                placeholder="California"
                className={styles.formInput}
                value={formData.state}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Zip Code</label>
              <input
                name="zip"
                type="text"
                placeholder="92660"
                className={styles.formInput}
                value={formData.zip}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        {/* Action Footer */}
        <div className={styles.actionFooter} style={{ background: "#f1f5f9", padding: "2.5rem", borderRadius: "16px", marginTop: "3rem" }}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => router.push("/leads")}
            disabled={loading}
            style={{ padding: "0.875rem 2.5rem" }}
          >
            <X size={20} /> Cancel
          </button>
          <button type="submit" className={styles.createBtn} disabled={loading} style={{ padding: "0.875rem 3rem" }}>
            {loading ? "Creating..." : <><UserPlus size={20} /> Create Lead</>}
          </button>
        </div>
      </form>
    </div>
  );
}
