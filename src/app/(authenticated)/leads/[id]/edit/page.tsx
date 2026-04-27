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
  RefreshCw,
  Loader2,
  ChevronDown,
  XCircle
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";

export default function EditLeadPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [markingLost, setMarkingLost] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
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
          id: id,
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
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem("auth_token");
    const res = await fetch(
      "https://ramgeneral-api.onrender.com/api/leads",
      {
        method: "POST", // or POST depending on your API
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // replace with actual token
        },
        body: JSON.stringify(formData),
      }
    );

    const data = await res.json();

    if (res.ok) {
      toast.success("Lead updated successfully!");
      router.push("/leads");
    } else {
      toast.error(data?.message || "Failed to update lead.");
    }

    setSaving(false);
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

  return (
    <div className={styles.editPage}>
      <input type="hidden" name="id" value={formData.id} />
      <div className={dashboardStyles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/leads")}>LEADS</span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>EDIT LEAD</span>
      </div>

      <div className={styles.titleArea} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className={styles.profileTitle}>Lead Profile: {loading ? "Loading..." : formData.name}</h1>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            className={styles.convertBtn}
            onClick={handleConvert}
            disabled={converting || markingLost || formData.status === "Closed" || formData.status === "Lost Leads"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.6rem 1.25rem",
              backgroundColor: (formData.status === "Closed" || formData.status === "Lost Leads") ? "#f1f5f9" : "#0076ce",
              color: (formData.status === "Closed" || formData.status === "Lost Leads") ? "#94a3b8" : "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: (formData.status === "Closed" || formData.status === "Lost Leads") ? "not-allowed" : "pointer",
              transition: "all 0.2s ease"
            }}
          >
            {converting ? <Loader2 size={18} className={styles.spinner} /> : <RefreshCw size={18} />}
            {converting ? "Converting..." : formData.status === "Closed" ? "Already Converted" : "Convert to Customer"}
          </button>
          <button
            onClick={handleLost}
            disabled={converting || markingLost || formData.status === "Closed" || formData.status === "Lost Leads"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.6rem 1.25rem",
              backgroundColor: formData.status === "Lost Leads" ? "#f1f5f9" : "#ef4444",
              color: formData.status === "Lost Leads" ? "#94a3b8" : "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: (formData.status === "Lost Leads" || formData.status === "Closed") ? "not-allowed" : "pointer",
              transition: "all 0.2s ease"
            }}
          >
            {markingLost ? <Loader2 size={18} className={styles.spinner} /> : <XCircle size={18} />}
            {markingLost ? "Updating..." : formData.status === "Lost Leads" ? "Lead Lost" : "Mark as Lost"}
          </button>
        </div>
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
          <div className={styles.formGroup}>
            <label>Lead Source</label>
            <input
              type="text"
              name="leadSource"
              className={styles.formInput}
              placeholder="e.g. Website"
              value={formData.leadSource}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Sales Person</label>
            <input
              type="text"
              name="salesPerson"
              className={styles.formInput}
              placeholder="Assign Salesperson"
              value={formData.salesPerson}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      {/* Address Details */}
      <section className={styles.formSection}>
        <h2 className={styles.sectionHeading}>Address Details</h2>
        <div className={styles.formGrid}>
          <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
            <label>Street</label>
            <input
              type="text"
              name="street"
              className={styles.formInput}
              placeholder="e.g. 123 Industrial Way"
              value={formData.street}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label>City</label>
            <input
              type="text"
              name="city"
              className={styles.formInput}
              placeholder="Newport"
              value={formData.city}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label>State</label>
            <input
              type="text"
              name="state"
              className={styles.formInput}
              placeholder="California"
              value={formData.state}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Zip Code</label>
            <input
              type="text"
              name="zip"
              className={styles.formInput}
              placeholder="92660"
              value={formData.zip}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      {/* Additional Notes */}
      <section className={styles.formSection}>
        <h2 className={styles.sectionHeading}>Internal Notes</h2>
        <div className={styles.formGroup}>
          <textarea
            name="notes"
            className={styles.formInput}
            style={{ height: "120px", resize: "none", paddingTop: "0.75rem" }}
            placeholder="Add internal notes about this lead..."
            value={formData.notes}
            onChange={handleChange}
          />
        </div>
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
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
