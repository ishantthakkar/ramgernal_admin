"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../../dashboard.module.css";
import {
  Search,
  User,
  MapPin,
  ClipboardCheck,
  ShieldCheck,
  ChevronDown,
  Loader2,
  Save as SaveIcon,
  Clock,
  Package,
  Trash2,
  X,
  Image as ImageIcon,
  Plus,
  CheckCircle2
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import { canViewModule } from "@/lib/permissions";
import modalStyles from "../../commissions/commissions-modal.module.css";

export default function AddServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [eligibleCustomers, setEligibleCustomers] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    customerId: "",
    toFixItems: [] as any[],
    materialDelivered: false,
    assignedTo: "",
    notes: "",
    status: "Assigned",
    serviceDateTime: "",
    material: [] as any[]
  });

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    item_name: "",
    issued_qty: "",
    images: [] as File[],
    imagePreviews: [] as string[]
  });

  useEffect(() => {
    if (!canViewModule("Services")) {
      toast.error("You do not have permission to access this module.");
      router.push("/dashboard");
      return;
    }
    fetchEligibleCustomers();
    fetchContractors();
  }, [router]);

  const fetchEligibleCustomers = async () => {
    try {
      const response = await adminApi.getEligibleCustomers();
      if (response.success) {
        setEligibleCustomers(response.data);
      }
    } catch (error: any) {
      toast.error("Failed to load eligible customers");
    }
  };

  const fetchContractors = async () => {
    try {
      const response = await adminApi.getUserList("Contractor");
      const results = response.users || response.data || (Array.isArray(response) ? response : []);
      setContractors(results);
    } catch (error: any) {
      console.error("Failed to fetch contractors:", error);
    }
  };

  const handleCustomerChange = async (customerId: string) => {
    if (!customerId) {
      setSelectedCustomer(null);
      setFormData(prev => ({ ...prev, customerId: "", toFixItems: [] }));
      return;
    }

    setLoading(true);
    try {
      const response = await adminApi.getServiceCustomerDetails(customerId);
      if (response.success) {
        setSelectedCustomer(response.data);
        const items = response.data.surveys.map((s: any) => ({
          surveyId: s._id,
          area: s.area,
          fixtureType: s.proposedFixture,
          proposedQty: s.proposedQuantity,
          toFix: 0,
          issueNote: ""
        }));
        setFormData(prev => ({
          ...prev,
          customerId,
          toFixItems: items
        }));
      }
    } catch (error: any) {
      toast.error("Failed to fetch customer details");
    } finally {
      setLoading(false);
    }
  };

  const handleToFixChange = (idx: number, field: string, value: any) => {
    const updated = [...formData.toFixItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData(prev => ({ ...prev, toFixItems: updated }));
  };

  const handleMaterialChange = (idx: number, field: string, value: any) => {
    const updated = [...formData.material];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData(prev => ({ ...prev, material: updated }));
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

  const handleSaveNewMaterial = () => {
    if (!newMaterial.item_name || !newMaterial.issued_qty) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setFormData(prev => ({
      ...prev,
      material: [...prev.material, {
        item_name: newMaterial.item_name,
        issued_qty: parseInt(newMaterial.issued_qty),
        images: newMaterial.images,
        imagePreviews: newMaterial.imagePreviews
      }]
    }));
    setShowAddModal(false);
  };

  const removeMaterial = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      material: prev.material.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const toFixItems = formData.toFixItems.filter(item => item.toFix > 0);

    if (toFixItems.length === 0) {
      toast.warning("Please specify at least one item to fix.");
      return;
    }

    setLoading(true);
    try {
      // If we have materials with images, we need to send them.
      // The current backend supports one material with multiple images via multipart/form-data.
      // If there are multiple materials, we'll send the first one with images via multipart
      // and the rest as JSON (though backend might need to be updated to handle that fully).
      
      const multipartData = new FormData();
      multipartData.append("customerId", formData.customerId);
      multipartData.append("notes", formData.notes);
      multipartData.append("toFixItems", JSON.stringify(toFixItems.map(item => ({
        surveyId: item.surveyId,
        area: item.area,
        fixtureType: item.fixtureType,
        proposedQty: item.proposedQty,
        toFix: item.toFix,
        issueNote: item.issueNote
      }))));
      multipartData.append("assignedTo", formData.assignedTo || "");
      multipartData.append("materialDelivered", String(formData.materialDelivered));
      multipartData.append("status", formData.status);
      multipartData.append("serviceDateTime", formData.serviceDateTime);

      // If we have materials
      if (formData.material.length > 0) {
        // Send the first material's details in the top level as per curl
        multipartData.append("item_name", formData.material[0].item_name);
        multipartData.append("issued_qty", String(formData.material[0].issued_qty));
        
        // Add images for the first material
        if (formData.material[0].images && formData.material[0].images.length > 0) {
          formData.material[0].images.forEach((file: File) => {
            multipartData.append("images", file);
          });
        }

        // If there are more materials, send them as a JSON string in 'material' field
        // The backend handles 'material' array too.
        if (formData.material.length > 1) {
          multipartData.append("material", JSON.stringify(formData.material.slice(1).map(m => ({
            item_name: m.item_name,
            issued_qty: m.issued_qty
          }))));
        }
      }

      const response = await adminApi.createServiceTicket(multipartData);
      if (response.success) {
        toast.success("Service ticket created successfully!");
        router.push("/services");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create service ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/services")}>SERVICES</span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>ADD SERVICE</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Create Service</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Customer Selection */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <Search size={22} color="#0076ce" /> Select Customer / Company
          </div>
          <p className={styles.sectionSubtitle}>Choose an eligible customer to begin the service workflow.</p>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Customer Name <span style={{ color: "#ef4444" }}>*</span></label>
              <div style={{ position: "relative" }}>
                <select
                  className={styles.formSelect}
                  value={formData.customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">Choose a customer...</option>
                  {eligibleCustomers.map(cust => (
                    <option key={cust._id} value={cust._id}>
                      {cust.name} {cust.company ? `- ${cust.company}` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", fontWeight: "bold", pointerEvents: "none", color: "#64748b" }} />
              </div>
            </div>
          </div>
        </section>

        {loading && !selectedCustomer && (
          <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
            <Loader2 className="animate-spin" size={32} color="#0076ce" />
          </div>
        )}

        {selectedCustomer && (
          <>
            <div className={styles.formGrid}>
              <section className={styles.formSection}>
                <div className={styles.sectionTitle}>
                  <User size={22} color="#10b981" /> Customer Information
                </div>
                <div className={styles.formGrid} style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div className={styles.formGroup}>
                    <label>Name</label>
                    <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 500 }}>{selectedCustomer.customer.name}</div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Mobile</label>
                    <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 500 }}>{selectedCustomer.customer.mobileNumber}</div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Email</label>
                    <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 500 }}>{selectedCustomer.customer.email || "N/A"}</div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Lead Source</label>
                    <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 500 }}>{selectedCustomer.customer.leadSource || "N/A"}</div>
                  </div>
                </div>
              </section>

              <section className={styles.formSection}>
                <div className={styles.sectionTitle}>
                  <MapPin size={22} color="#f59e0b" /> Address Details
                </div>
                <div className={styles.formGrid} style={{ gridTemplateColumns: "1fr" }}>
                  <div className={styles.formGroup}>
                    <label>Company</label>
                    <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600 }}>{selectedCustomer.customer.company}</div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Address</label>
                    <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 500 }}>
                      {selectedCustomer.customer.address?.street || "N/A"}, {selectedCustomer.customer.address?.city}, {selectedCustomer.customer.address?.state} {selectedCustomer.customer.address?.zip}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <section className={styles.formSection}>
              <div className={styles.sectionTitle}>
                <ClipboardCheck size={22} color="#8b5cf6" /> Service Items
              </div>


              <div className={styles.userTableContainer} style={{ marginTop: "1rem" }}>
                <table className={styles.userTable}>
                  <thead>
                    <tr>
                      <th>Area</th>
                      <th>Type of Fixture</th>
                      <th>Original Qty</th>
                      <th style={{ width: "120px" }}>To Fix</th>
                      <th>Issue Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.toFixItems.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: "#1e293b" }}>{item.area}</td>
                        <td style={{ color: "#0076ce", fontWeight: 500 }}>{item.fixtureType}</td>
                        <td style={{ textAlign: "center", fontWeight: 700, color: "#1e293b" }}>{item.proposedQty}</td>
                        <td>
                          <input
                            type="number"
                            className={styles.formInput}
                            value={item.toFix || 0}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              handleToFixChange(idx, "toFix", isNaN(val) ? 0 : val);
                            }}
                            style={{ padding: "0.4rem", textAlign: "center" }}
                            min="0"
                          />
                        </td>
                        <td>
                          <textarea
                            className={styles.formInput}
                            value={item.issueNote}
                            onChange={(e) => handleToFixChange(idx, "issueNote", e.target.value)}
                            placeholder="Describe the issue..."
                            style={{ padding: "0.5rem", height: "40px", resize: "none", fontSize: "0.85rem" }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={styles.formSection}>
              <div className={styles.sectionTitle}>
                <ShieldCheck size={22} color="#ef4444" />Assign Contractor
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Assign to Contractor</label>
                  <div style={{ position: "relative" }}>
                    <select
                      className={styles.formSelect}
                      value={formData.assignedTo}
                      onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                    >
                      <option value="">Select Contractor</option>
                      {contractors.map(c => (
                        <option key={c._id} value={c._id}>{c.fullName}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }} />
                  </div>
                </div>
                {/* <div className={styles.formGroup}>
                  <label>Service Date</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={formData.serviceDateTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceDateTime: e.target.value }))}
                  />
                </div> */}
                {/* <div className={styles.formGroup}>
                  <label>Logistics Status</label>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.materialDelivered}
                        onChange={(e) => setFormData(prev => ({ ...prev, materialDelivered: e.target.checked }))}
                        style={{ width: "18px", height: "18px" }}
                      />
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>Material delivered to site</span>
                    </label>
                  </div>
                </div> */}
              </div>
            </section>

            <section className={styles.formSection}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className={styles.sectionTitle}>
                  <Package size={22} color="#0ea5e9" /> Materials
                </div>
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  className={styles.addBtn}
                  style={{ padding: "0.5rem 1.5rem", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.4rem" }}
                >
                  <Plus size={18} /> Add Material
                </button>
              </div>

              <div className={styles.userTableContainer} style={{ marginTop: "1.5rem" }}>
                <table className={styles.userTable}>
                  <thead>
                    <tr>
                      <th style={{ width: "60px" }}>No.</th>
                      <th>Material Name</th>
                      <th style={{ width: "150px" }}>Quantity</th>
                      <th style={{ width: "150px" }}>Images</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.material.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontStyle: "italic" }}>
                          No materials added yet. Click "+ Add Material" to begin.
                        </td>
                      </tr>
                    ) : (
                      formData.material.map((mat, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, color: "#64748b" }}>{idx + 1}</td>
                          <td style={{ fontWeight: 600, color: "#1e293b" }}>{mat.item_name}</td>
                          <td style={{ fontWeight: 700, color: "#0076ce" }}>{mat.issued_qty}</td>
                          <td>
                            <div style={{ display: "flex", gap: "0.3rem" }}>
                              {mat.imagePreviews && mat.imagePreviews.length > 0 ? (
                                mat.imagePreviews.map((prev: string, i: number) => (
                                  <div key={i} style={{ width: "30px", height: "30px", borderRadius: "4px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                                    <img src={prev} alt="Material" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  </div>
                                ))
                              ) : (
                                <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>No images</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={styles.formSection}>
              <div className={styles.sectionTitle}>
                <Clock size={22} color="#6366f1" /> Additional Notes
              </div>
              <div className={styles.formGroup} style={{ marginTop: "1.5rem" }}>
                <textarea
                  className={styles.formInput}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="General service notes..."
                  style={{ padding: "1rem", height: "100px" }}
                />
              </div>
            </section>

            <div className={styles.actionFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => router.push("/services")}
                disabled={loading}
              >
                <X size={20} /> Cancel
              </button>
              <button type="submit" className={styles.createBtn} disabled={loading}>
                {loading ? "Creating..." : <><SaveIcon size={20} /> Create Service</>}
              </button>
            </div>
          </>
        )}
      </form>

      {/* Add Material Modal */}
      {showAddModal && (
        <div className={modalStyles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={`${modalStyles.modalContent} ${modalStyles.modalMedium}`} onClick={(e) => e.stopPropagation()}>
            <div className={modalStyles.modalHeader}>
              <div>
                <h3>Add Service Material</h3>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.2rem" }}>
                  Record new items issued for this service.
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
                    placeholder="e.g. Copper Pipe 15mm"
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
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "1rem", maxHeight: "200px", overflowY: "auto", padding: "0.5rem", background: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
                        {newMaterial.imagePreviews.map((preview, idx) => (
                          <div key={idx} style={{ position: "relative", aspectRatio: "1/1", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                            <img src={preview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <button
                              type="button"
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
              <button type="button" className={modalStyles.cancelBtn} onClick={() => setShowAddModal(false)}>
                <X size={18} /> Cancel
              </button>
              <button
                type="button"
                className={modalStyles.saveBtn}
                onClick={handleSaveNewMaterial}
                disabled={!newMaterial.item_name || !newMaterial.issued_qty}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <CheckCircle2 size={18} /> Save Material
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
