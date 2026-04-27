"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "../../../dashboard.module.css";
import {
  User as UserIcon,
  Loader2,
  Save,
  X,
  ClipboardCheck,
  Image as ImageIcon,
  Trash2
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";

export default function WorkflowEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [surveys, setSurveys] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await adminApi.getCustomerWorkflowDetails(id);
        setCustomer(result.customer);
        setSurveys(result.surveys || []);
      } catch (err: any) {
        toast.error(err.message || "Failed to load workflow details.");
        router.push("/workflow");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, router]);

  const handleInputChange = (idx: number, field: string, value: any) => {
    const updatedSurveys = [...surveys];
    updatedSurveys[idx] = { ...updatedSurveys[idx], [field]: value };
    setSurveys(updatedSurveys);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateCustomerWorkflow(id, { customer, surveys });
      toast.success("Survey workflow updated successfully!");
      router.push("/workflow");
    } catch (err: any) {
      toast.error(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className={styles.spinner} color="#0076ce" />
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/workflow")}>WORKFLOW</span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>EDIT SURVEY</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Edit Survey Details</h1>
      </div>

      {/* Customer Information (Read Only) */}
      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <UserIcon size={22} color="#0076ce" /> Customer Information
        </div>
        <p className={styles.sectionSubtitle}>Reviewing primary contact and company details.</p>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Name</label>
            <div className={styles.formInput} style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}>
              {customer.name}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Company</label>
            <div className={styles.formInput} style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}>
              {customer.company}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Sales Person</label>
            <div className={styles.formInput} style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}>
              {customer.salesPerson}
            </div>
          </div>
        </div>
      </div>

      {/* Survey Information Editable Table */}
      <div className={styles.formSection} style={{ marginTop: "2rem" }}>
        <div className={styles.sectionTitle}>
          <ClipboardCheck size={22} color="#10b981" /> Survey Records
        </div>
        <p className={styles.sectionSubtitle}>Modify fixtures, quantities, and pricing for this survey.</p>

        <div className={styles.userTableContainer} style={{ marginTop: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table className={styles.userTable}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ minWidth: "120px" }}>Area</th>
                <th style={{ minWidth: "80px" }}>Height</th>
                <th style={{ minWidth: "150px" }}>Existing Fixture Type</th>
                <th style={{ minWidth: "120px" }}>Existing Bulbs</th>
                <th style={{ minWidth: "80px" }}>Existing Qty</th>
                <th style={{ minWidth: "150px" }}>Proposed Fixture</th>
                <th style={{ minWidth: "80px" }}>Proposed Qty</th>
                <th style={{ minWidth: "100px" }}>Price / Unit</th>
                <th style={{ minWidth: "100px" }}>Total Price</th>
                <th style={{ minWidth: "150px" }}>Note</th>
                <th style={{ minWidth: "100px" }}>Images</th>
                <th style={{ width: "40px" }}></th>
              </tr>
            </thead>
            <tbody>
              {surveys.map((survey, index) => (
                <tr key={survey._id || index}>
                  <td>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      value={survey.area || ""} 
                      onChange={(e) => handleInputChange(index, "area", e.target.value)}
                      style={{ padding: "0.4rem", fontSize: "0.85rem" }}
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      value={survey.heightInInches || ""} 
                      onChange={(e) => handleInputChange(index, "heightInInches", e.target.value)}
                      style={{ padding: "0.4rem", fontSize: "0.85rem" }}
                      placeholder="in"
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      value={survey.existingFixtureType || ""} 
                      onChange={(e) => handleInputChange(index, "existingFixtureType", e.target.value)}
                      style={{ padding: "0.4rem", fontSize: "0.85rem" }}
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      value={survey.existingBulbs || ""} 
                      onChange={(e) => handleInputChange(index, "existingBulbs", e.target.value)}
                      style={{ padding: "0.4rem", fontSize: "0.85rem" }}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      className={styles.formInput} 
                      value={survey.existingQuantity || 0} 
                      onChange={(e) => handleInputChange(index, "existingQuantity", e.target.value)}
                      style={{ padding: "0.4rem", fontSize: "0.85rem" }}
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      value={survey.proposedFixture || ""} 
                      onChange={(e) => handleInputChange(index, "proposedFixture", e.target.value)}
                      style={{ padding: "0.4rem", fontSize: "0.85rem", color: "#0076ce", fontWeight: 600 }}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      className={styles.formInput} 
                      value={survey.proposedQuantity || 0} 
                      onChange={(e) => handleInputChange(index, "proposedQuantity", e.target.value)}
                      style={{ padding: "0.4rem", fontSize: "0.85rem" }}
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      value={survey.pricePerUnit || ""} 
                      onChange={(e) => handleInputChange(index, "pricePerUnit", e.target.value)}
                      style={{ padding: "0.4rem", fontSize: "0.85rem" }}
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      value={survey.totalPrice || ""} 
                      onChange={(e) => handleInputChange(index, "totalPrice", e.target.value)}
                      style={{ padding: "0.4rem", fontSize: "0.85rem", fontWeight: 700 }}
                    />
                  </td>
                  <td>
                    <textarea 
                      className={styles.formInput} 
                      value={survey.note || ""} 
                      onChange={(e) => handleInputChange(index, "note", e.target.value)}
                      style={{ padding: "0.4rem", fontSize: "0.8rem", height: "35px", resize: "none" }}
                    />
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600 }}>
                      <ImageIcon size={14} /> {survey.images?.length || 0}
                    </div>
                  </td>
                  <td>
                    <button 
                      onClick={() => {
                        const updated = surveys.filter((_, i) => i !== index);
                        setSurveys(updated);
                      }}
                      style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {surveys.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                    No survey records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.actionFooter} style={{ background: "#f1f5f9", padding: "2.5rem", borderRadius: "16px", marginTop: "3rem", justifyContent: "flex-end" }}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => router.push(`/workflow/view/${id}`)}
          style={{ padding: "0.875rem 3rem", background: "#64748b", color: "#ffffff" }}
        >
          Cancel
        </button>
        <button
          type="button"
          className={styles.addBtn}
          onClick={handleSave}
          disabled={saving}
          style={{ padding: "0.875rem 3rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          {saving ? <Loader2 size={20} className={styles.spinner} /> : <Save size={20} />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
