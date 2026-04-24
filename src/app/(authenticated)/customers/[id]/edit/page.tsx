"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "./customer-edit.module.css";
import dashboardStyles from "../../../dashboard.module.css";
import {
  X,
  FileText,
  ChevronDown,
  Loader2,
  Save
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";

export default function EditCustomerPage() {
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
    leadSource: "",
    salesPerson: "",
    contractor: "",
    address: {
      street: "",
      city: "",
      state: "",
      zip: ""
    }
  });

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await adminApi.getCustomerWorkflowDetails(id);
        const customer = response.customer;
        if (customer) {
          setFormData({
            name: customer.name || "",
            company: customer.company || "",
            email: customer.email || "",
            mobileNumber: customer.mobileNumber || "",
            leadSource: customer.leadSource || "",
            salesPerson: customer.salesPerson || "",
            contractor: customer.contractor || "",
            address: {
              street: customer.address?.street || "",
              city: customer.address?.city || "",
              state: customer.address?.state || "",
              zip: customer.address?.zip || ""
            }
          });
        }
      } catch (err) {
        console.error("Failed to fetch customer:", err);
        toast.error("Failed to load customer data.");
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateCustomerWorkflow(id, formData);
      toast.success("Customer updated successfully!");
      router.push("/customers");
    } catch (err: any) {
      console.error("Failed to update customer:", err);
      toast.error(err.message || "Failed to update customer.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flex: 1, height: "100%", minHeight: "400px", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={40} className={dashboardStyles.spinner} style={{ color: "#64748b" }} />
      </div>
    );
  }

  return (
    <div className={styles.editPage}>
      {/* Breadcrumb */}
      <div className={dashboardStyles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/customers")}>CUSTOMERS</span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>EDIT CUSTOMER</span>
      </div>

      <div className={styles.titleArea}>
        <h1 className={styles.profileTitle}>Edit Customer: {formData.name}</h1>
      </div>

      {/* Customer Information */}
      <section className={styles.formSection}>
        <h2 className={styles.sectionHeading}>Customer Information</h2>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Full Name</label>
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
        </div>
      </section>

      {/* Location Details */}
      <section className={styles.formSection}>
        <h2 className={styles.sectionHeading}>Location Details</h2>
        <div className={styles.formGrid}>
          <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
            <label>Street Address</label>
            <input
              type="text"
              name="address.street"
              className={styles.formInput}
              placeholder="456 Enterprise Way"
              value={formData.address.street}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label>City</label>
            <input
              type="text"
              name="address.city"
              className={styles.formInput}
              placeholder="Industrial Park"
              value={formData.address.city}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label>State</label>
            <input
              type="text"
              name="address.state"
              className={styles.formInput}
              placeholder="California"
              value={formData.address.state}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Zip Code</label>
            <input
              type="text"
              name="address.zip"
              className={styles.formInput}
              placeholder="90001"
              value={formData.address.zip}
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
        </div>
      </section>

      {/* Action Footer */}
      <div className={styles.actionFooter}>
        <button
          className={styles.cancelBtn}
          onClick={() => router.push(`/customers/${id}`)}
          disabled={saving}
        >
          <X size={18} /> Cancel
        </button>
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          {saving ? <Loader2 size={18} className={dashboardStyles.spinner} /> : <Save size={18} />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
