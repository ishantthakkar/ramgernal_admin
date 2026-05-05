"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "../../../dashboard.module.css";
import {
  X,
  Save,
  FileText,
  Info,
  RefreshCw,
  Loader2,
  ChevronDown,
  XCircle,
  Building,
  User,
  Phone,
  Mail,
  Layers,
  MapPin,
  Calendar
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";

export default function EditLeadPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [markingLost, setMarkingLost] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    mobileNumber: "",
    salesPerson: "",
    status: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    leadSource: "",
    notes: ""
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
          street: lead.street || "",
          city: lead.city || "",
          state: lead.state || "",
          zip: lead.zip || "",
          leadSource: lead.leadSource || "",
          notes: lead.notes || ""
        });
      } catch (err) {
        console.error("Failed to fetch lead:", err);
        toast.error("Failed to load lead details.");
      } finally {
        setFetching(false);
      }
    };
    if (id) fetchLead();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateLead({ id, ...formData });
      toast.success("Lead updated successfully!");
      router.push("/leads");
    } catch (err: any) {
      toast.error(err.message || "Failed to update lead.");
    } finally {
      setSaving(false);
    }
  };

  const handleConvert = async () => {
    if (!window.confirm("Are you sure you want to convert this lead to a customer?")) return;
    setConverting(true);
    try {
      await adminApi.convertLead(id);
      toast.success("Lead converted to customer successfully!");
      router.push("/customers");
    } catch (err: any) {
      toast.error(err.message || "Failed to convert lead.");
    } finally {
      setConverting(false);
    }
  };

  const handleLost = async () => {
    if (!window.confirm("Are you sure you want to mark this lead as lost?")) return;
    setMarkingLost(true);
    try {
      await adminApi.updateLeadStatus(id, "Lost Leads");
      toast.success("Lead marked as lost successfully!");
      router.push("/leads");
    } catch (err: any) {
      toast.error(err.message || "Failed to update lead status.");
    } finally {
      setMarkingLost(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className={styles.spinner} color="#0076ce" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New": return "#3b82f6";
      case "In Progress": return "#f59e0b";
      case "Converted To Customer": return "#10b981";
      case "Lost Leads": return "#ef4444";
      default: return "#64748b";
    }
  };

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/leads")}>LEADS</span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>EDIT LEAD</span>
      </div>

      <div className={styles.pageHeader} style={{ marginBottom: "2.5rem" }}>
        <div>
          <h1 className={styles.welcomeText}>Edit Lead Profile</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
            <span style={{ 
              backgroundColor: `${getStatusColor(formData.status)}15`, 
              color: getStatusColor(formData.status),
              padding: "0.25rem 0.75rem",
              borderRadius: "99px",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase"
            }}>
              {formData.status || "New"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            type="button"
            className={styles.createBtn}
            onClick={handleConvert}
            disabled={converting || markingLost || formData.status === "Converted To Customer" || formData.status === "Lost Leads"}
            style={{ background: "#10b981" }}
          >
            {converting ? <Loader2 size={18} className={styles.spinner} /> : <RefreshCw size={18} />}
            {converting ? "Converting..." : formData.status === "Converted To Customer" ? "Converted" : "Convert to Customer"}
          </button>
          <button
            type="button"
            className={styles.createBtn}
            onClick={handleLost}
            disabled={converting || markingLost || formData.status === "Converted To Customer" || formData.status === "Lost Leads"}
            style={{ background: "#ef4444" }}
          >
            {markingLost ? <Loader2 size={18} className={styles.spinner} /> : <XCircle size={18} />}
            {markingLost ? "Updating..." : formData.status === "Lost Leads" ? "Lead Lost" : "Mark Lost"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave}>
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
              <label>Street Address</label>
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

        {/* Notes Section */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <FileText size={22} color="#0076ce" /> Internal Notes
          </div>
          <div className={styles.formGroup} style={{ marginTop: "1rem" }}>
            <textarea
              name="notes"
              className={styles.formInput}
              style={{ height: "120px", resize: "none", paddingTop: "0.875rem" }}
              placeholder="Add internal notes about this lead..."
              value={formData.notes}
              onChange={handleChange}
            />
          </div>
        </section>

        {/* Action Footer */}
        <div className={styles.actionFooter} style={{ background: "#f1f5f9", padding: "2.5rem", borderRadius: "16px", marginTop: "3rem" }}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => router.push("/leads")}
            disabled={saving}
            style={{ padding: "0.875rem 2.5rem" }}
          >
            <X size={20} /> Cancel
          </button>
          <button type="submit" className={styles.createBtn} disabled={saving} style={{ padding: "0.875rem 3rem" }}>
            {saving ? "Saving..." : <><Save size={20} /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
}
