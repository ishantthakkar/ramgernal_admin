"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
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
  ArrowLeft,
  CheckCircle2
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import modalStyles from "../../../commissions/commissions-modal.module.css";

export default function WorkflowEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const searchParams = useSearchParams();
  const fromTab = searchParams.get("from");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"survey" | "installations">(fromTab?.toLowerCase() === "installations" ? "installations" : "survey");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    item_name: "",
    issued_qty: "",
    images: [] as File[],
    imagePreviews: [] as string[]
  });

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
    setNewMaterial({
      item_name: "",
      issued_qty: "",
      images: [],
      imagePreviews: []
    });
    setShowAddModal(true);
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

  const handleModalImageUpload = (files: FileList) => {
    const fileArray = Array.from(files);
    const previews = fileArray.map(file => URL.createObjectURL(file));
    setNewMaterial(prev => ({
      ...prev,
      images: [...prev.images, ...fileArray],
      imagePreviews: [...prev.imagePreviews, ...previews]
    }));
  };

  const removeNewImage = (index: number) => {
    setNewMaterial(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index)
    }));
  };

  const handleSaveNewMaterial = async () => {
    if (!newMaterial.item_name || !newMaterial.issued_qty) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("item_name", newMaterial.item_name);
      formData.append("issued_qty", newMaterial.issued_qty);
      newMaterial.images.forEach(image => {
        formData.append("images", image);
      });

      await adminApi.updateCustomerMaterials(id, formData);
      toast.success("Material added successfully!");

      // Refresh materials list
      const result = await adminApi.getCustomerWorkflowDetails(id);
      setMaterials(result.materials || []);

      setShowAddModal(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to add material.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === "survey") {
        await adminApi.updateCustomerWorkflow(id, { customer, surveys });
        toast.success("Survey workflow updated successfully!");
        router.push(`/workflow?tab=${fromTab || "Surveys"}`);
      } else {
        // For installations, we now save individually via popup, 
        // but we might still want to save other changes if any.
        // For now, just redirect back.
        router.push(`/workflow?tab=${fromTab || "Installations"}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className={styles.spinner} />
      </div>
    );
  }

  if (!customer) return null;

  const isContractorAssigned = !!(customer.assignToContractor || customer.contractorName || customer.contractor);

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push(`/workflow?tab=${fromTab || (activeTab === "survey" ? "Surveys" : "Installations")}`)}>WORKFLOW</span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>EDIT WORKFLOW</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Edit Workflow</h1>

        <div className={styles.tabs} style={{ marginTop: "1.5rem", width: "fit-content" }}>
          {(fromTab !== "Installations") && (
            <button
              className={`${styles.tab} ${activeTab === "survey" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("survey")}
              style={{ border: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <ClipboardCheck size={18} /> Survey
            </button>
          )}
          {(fromTab !== "Surveys") && (
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
          )}
        </div>
      </div>

      {/* Customer Information (Read Only) - Always Visible */}
      <div className={styles.formSection} style={{ marginTop: "2rem" }}>
        <div className={styles.sectionTitle}>
          <UserIcon size={22} color="#0076ce" /> Customer Information
        </div>


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
              {customer.user_id?.fullName}
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

            <div className={styles.userTableContainer} style={{ marginTop: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", overflowX: "auto" }}>
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

          <div className={styles.userTableContainer} style={{ marginTop: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", overflowX: "auto" }}>
            <table className={styles.userTable}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ width: "80px" }}>Sr. No</th>
                  <th style={{ minWidth: "250px" }}>Item Name</th>
                  <th style={{ minWidth: "150px" }}>Issued Qty</th>
                  <th style={{ minWidth: "200px" }}>Image</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((item, index) => (
                  <tr key={item._id || index}>
                    <td style={{ fontWeight: 600, color: "#64748b" }}>{index + 1}</td>
                    <td style={{ fontWeight: 600, color: "#1e293b" }}>{item.item_name}</td>
                    <td style={{ fontWeight: 600, color: "#0076ce" }}>{item.issued_qty}</td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", maxWidth: "200px" }}>
                        {(item.images || item.image ? [item.image || item.images].flat().filter(Boolean) : []).map((img: string, i: number) => (
                          <div key={i} style={{ width: "40px", height: "40px", borderRadius: "4px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                            <img
                              src={img.startsWith('http') ? img : `${process.env.NEXT_PUBLIC_API_BASE_URL}${img}`}
                              alt="Material"
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                        ))}
                        {(!item.image && (!item.images || item.images.length === 0)) && (
                          <div style={{ color: "#94a3b8", fontSize: "0.75rem" }}>No image</div>
                        )}
                      </div>
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

          {/* Read-only Survey History for reference during Installation editing */}
          <div className={styles.formSection} style={{ marginTop: "2rem" }}>
            <div className={styles.sectionTitle}>
              <ClipboardCheck size={22} color="#10b981" /> Survey Details
            </div>
            <div className={styles.userTableContainer} style={{ marginTop: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", overflowX: "auto" }}>
              <table className={styles.userTable}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ minWidth: "150px" }}>Area</th>
                    <th>Fixture</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {surveys.map((survey, index) => (
                    <tr key={survey._id || index}>
                      <td style={{ fontWeight: 600, color: "#1e293b" }}>{survey.area}</td>
                      <td style={{ color: "#64748b" }}>{survey.proposedFixture}</td>
                      <td style={{ color: "#10b981", fontWeight: 700 }}>{survey.proposedQuantity}</td>
                      <td style={{ color: "#64748b" }}>${survey.totalPrice}</td>
                      <td style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{survey.note || "N/A"}</td>
                    </tr>
                  ))}
                  {surveys.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>No survey data.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className={styles.actionFooter}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => router.push(`/workflow?tab=${fromTab || (activeTab === "survey" ? "Surveys" : "Installations")}`)}
          disabled={saving}
          style={{ padding: "0.875rem 3rem", background: "#ffffff", color: "#4b5563", border: "1.5px solid #e2e8f0" }}
        >
          <X size={20} /> Cancel
        </button>
        <button
          type="button"
          className={styles.createBtn}
          onClick={handleSave}
          disabled={saving}
          style={{ padding: "0.875rem 3rem", display: "flex", alignItems: "center", gap: "0.5rem", background: "#005696" }}
        >
          {saving ? <Loader2 size={20} className={styles.spinner} /> : <Save size={20} />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Add Material Modal */}
      {showAddModal && (
        <div className={modalStyles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={`${modalStyles.modalContent} ${modalStyles.modalMedium}`} onClick={(e) => e.stopPropagation()}>
            <div className={modalStyles.modalHeader}>
              <div>
                <h3>Add Installation Material</h3>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.2rem" }}>
                  Record new items issued for installation.
                </div>
              </div>
              <button className={modalStyles.closeBtn} onClick={() => setShowAddModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className={modalStyles.modalBody}>
              <div className={modalStyles.formGrid} style={{ gridTemplateColumns: "1fr" }}>
                <div className={modalStyles.formGroup}>
                  <label>Item Name <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. LED Panel 60x60"
                    className={modalStyles.formInput}
                    value={newMaterial.item_name}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, item_name: e.target.value }))}
                  />
                </div>

                <div className={modalStyles.formGroup}>
                  <label>Issued Quantity <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    type="number"
                    placeholder="0"
                    className={modalStyles.formInput}
                    value={newMaterial.issued_qty}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, issued_qty: e.target.value }))}
                  />
                </div>

                <div className={modalStyles.formGroup}>
                  <label>Material Images</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {newMaterial.imagePreviews.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "1rem", maxHeight: "300px", overflowY: "auto", padding: "0.5rem", background: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
                        {newMaterial.imagePreviews.map((preview, idx) => (
                          <div key={idx} style={{ position: "relative", aspectRatio: "1/1", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                            <img src={preview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <button
                              onClick={(e) => { e.stopPropagation(); removeNewImage(idx); }}
                              style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(239, 68, 68, 0.9)", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div
                      onClick={() => document.getElementById('materialImages')?.click()}
                      style={{
                        border: "2px dashed #e2e8f0",
                        borderRadius: "12px",
                        padding: "2rem",
                        textAlign: "center",
                        cursor: "pointer",
                        background: "#f8fafc",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = "#0076ce"}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                    >
                      <ImageIcon size={32} color="#94a3b8" style={{ margin: "0 auto 1rem" }} />
                      <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                        Click to upload material photos (Multiple allowed)
                      </div>
                      <input
                        id="materialImages"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => e.target.files && handleModalImageUpload(e.target.files)}
                        style={{ display: "none" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={modalStyles.modalFooter}>
              <button className={modalStyles.cancelBtn} onClick={() => setShowAddModal(false)}>
                <X size={18} /> Cancel
              </button>
              <button
                className={modalStyles.saveBtn}
                onClick={handleSaveNewMaterial}
                disabled={!newMaterial.item_name || !newMaterial.issued_qty || saving}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                {saving ? <Loader2 size={18} className={styles.spinner} /> : <CheckCircle2 size={18} />}
                {saving ? "Saving..." : "Save Material"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
