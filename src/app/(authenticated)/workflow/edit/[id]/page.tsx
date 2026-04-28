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
  Trash2,
  Hammer,
  Plus,
  ArrowLeft
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
  const [materials, setMaterials] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"survey" | "installations">("survey");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await adminApi.getCustomerWorkflowDetails(id);
        setCustomer(result.customer);
        setSurveys(result.surveys || []);
        setMaterials(result.materials || []);
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

  const handleAddMaterial = () => {
    setMaterials([...materials, { item_name: "", issued_qty: 0, image: "" }]);
  };

  const handleRemoveMaterial = (index: number) => {
    const updated = [...materials];
    updated.splice(index, 1);
    setMaterials(updated);
  };

  const handleMaterialChange = (index: number, field: string, value: any) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    setMaterials(updated);
  };

  const handleImageUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      handleMaterialChange(index, "image", reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === "survey") {
        await adminApi.updateCustomerWorkflow(id, { customer, surveys });
        toast.success("Survey workflow updated successfully!");
      } else {
        await adminApi.updateCustomerMaterials(id, { materials });
        toast.success("Materials updated successfully!");
      }
      router.push(`/workflow/view/${id}`);
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

  const isContractorAssigned = !!(customer.assignToContractor || customer.contractorName || customer.contractor);

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/workflow")}>WORKFLOW</span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>EDIT WORKFLOW</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Edit Workflow</h1>
        
        <div className={styles.tabs} style={{ marginTop: "1.5rem", width: "fit-content" }}>
          <button 
            className={`${styles.tab} ${activeTab === "survey" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("survey")}
            style={{ border: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <ClipboardCheck size={18} /> Survey
          </button>
          <button 
            className={`${styles.tab} ${activeTab === "installations" ? styles.tabActive : ""}`}
            onClick={() => {
              if (isContractorAssigned) {
                setActiveTab("installations");
              } else {
                toast.warning("Assign a contractor first to manage materials.");
              }
            }}
            style={{ 
              border: "none", 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem",
              opacity: isContractorAssigned ? 1 : 0.5,
              cursor: isContractorAssigned ? "pointer" : "not-allowed"
            }}
            title={!isContractorAssigned ? "Assign a contractor first" : ""}
          >
            <Hammer size={18} /> Installations
          </button>
        </div>
      </div>

      {/* Customer Information (Read Only) - Always Visible */}
      <div className={styles.formSection} style={{ marginTop: "2rem" }}>
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

      {activeTab === "survey" ? (
        <>
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
                    </tr>
                  ))}
                  {surveys.length === 0 && (
                    <tr>
                      <td colSpan={11} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                        No survey records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className={styles.formSection} style={{ marginTop: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <div className={styles.sectionTitle}>
                <Hammer size={22} color="#475569" /> Installation Materials
              </div>
              <p className={styles.sectionSubtitle}>Manage items and quantities issued for installation.</p>
            </div>
            <button 
              onClick={handleAddMaterial}
              className={styles.addBtn}
              style={{ padding: "0.6rem 1.2rem", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <Plus size={18} /> Add Item
            </button>
          </div>

          <div className={styles.userTableContainer} style={{ marginTop: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <table className={styles.userTable}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ width: "80px" }}>Sr. No</th>
                  <th style={{ minWidth: "250px" }}>Item Name</th>
                  <th style={{ minWidth: "150px" }}>Issued Qty</th>
                  <th style={{ minWidth: "200px" }}>Image</th>
                  <th style={{ width: "100px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((item, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 600, color: "#64748b" }}>{index + 1}</td>
                    <td>
                      <input 
                        type="text" 
                        className={styles.formInput} 
                        value={item.item_name || ""} 
                        onChange={(e) => handleMaterialChange(index, "item_name", e.target.value)}
                        placeholder="e.g. LED Panel 60x60"
                        style={{ padding: "0.6rem" }}
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className={styles.formInput} 
                        value={item.issued_qty || 0} 
                        onChange={(e) => handleMaterialChange(index, "issued_qty", parseInt(e.target.value))}
                        style={{ padding: "0.6rem" }}
                      />
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        {item.image && (
                          <div style={{ width: "40px", height: "40px", borderRadius: "6px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                            <img src={item.image} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => e.target.files && handleImageUpload(index, e.target.files[0])}
                          style={{ fontSize: "0.8rem" }}
                        />
                      </div>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleRemoveMaterial(index)}
                        style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}
                        title="Remove Item"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
                {materials.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                      No materials added yet. Click "Add Item" to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
