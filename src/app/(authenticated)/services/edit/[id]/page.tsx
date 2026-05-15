"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "../../../dashboard.module.css";
import {
  Search,
  User,
  MapPin,
  ClipboardCheck,
  ShieldCheck,
  ChevronDown,
  Loader2,
  Save as SaveIcon,
  ArrowLeft,
  Settings,
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
import modalStyles from "../../../commissions/commissions-modal.module.css";

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contractors, setContractors] = useState<any[]>([]);

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

  const [customerInfo, setCustomerInfo] = useState<any>(null);

  useEffect(() => {
    if (!canViewModule("Services")) {
      toast.error("You do not have permission to access this module.");
      router.push("/dashboard");
      return;
    }
    fetchInitialData();
  }, [id, router]);

  const fetchInitialData = async () => {
    try {
      // Fetch contractors
      const contractorRes = await adminApi.getUserList("Contractor");
      const cList = contractorRes.users || contractorRes.data || (Array.isArray(contractorRes) ? contractorRes : []);
      setContractors(cList);

      // Fetch service details
      const serviceRes = await adminApi.getServiceById(id);
      if (serviceRes.success) {
        const service = serviceRes.data;
        setFormData({
          customerId: service.customerId?._id || service.customerId,
          toFixItems: service.toFixItems || [],
          materialDelivered: service.materialDelivered || false,
          assignedTo: service.assignedTo?._id || service.assignedTo || "",
          notes: service.notes || "",
          status: service.status || "Assigned",
          serviceDateTime: service.serviceDateTime || "",
          material: service.material || []
        });
        setCustomerInfo(service.customerId);
      }
    } catch (error: any) {
      toast.error("Failed to load service details");
      router.push("/services");
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

  const handleSaveNewMaterial = async () => {
    if (!newMaterial.item_name || !newMaterial.issued_qty) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      const multipartData = new FormData();
      multipartData.append("item_name", newMaterial.item_name);
      multipartData.append("issued_qty", newMaterial.issued_qty);
      newMaterial.images.forEach(image => {
        multipartData.append("images", image);
      });

      const response = await adminApi.addServiceMaterial(id, multipartData);
      if (response.success) {
        toast.success("Material added successfully!");
        setShowAddModal(false);
        // Refresh data
        fetchInitialData();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add material.");
    } finally {
      setSaving(false);
    }
  };

  const removeMaterial = (idx: number) => {
    const updated = formData.material.filter((_, i: number) => i !== idx);
    setFormData(prev => ({ ...prev, material: updated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    try {
      const payload = {
        status: formData.status,
        assignedTo: formData.assignedTo || undefined,
        notes: formData.notes,
        materialDelivered: formData.materialDelivered,
        toFixItems: formData.toFixItems,
        serviceDateTime: formData.serviceDateTime,
        material: formData.material
      };
      const response = await adminApi.updateServiceTicket(id, payload);
      if (response.success) {
        toast.success("Service ticket updated successfully!");
        router.push("/services");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update service ticket");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className="animate-spin" color="#0076ce" />
      </div>
    );
  }

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/services")}>SERVICES</span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>EDIT SERVICE</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Edit Service</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {customerInfo && (
          <div className={styles.formGrid}>
            <section className={styles.formSection}>
              <div className={styles.sectionTitle}>
                <User size={22} color="#0076ce" /> Customer Information
              </div>

              <div className={styles.formGrid} style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className={styles.formGroup}>
                  <label>Name</label>
                  <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600 }}>{customerInfo.name}</div>
                </div>
                <div className={styles.formGroup}>
                  <label>Company</label>
                  <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600 }}>{customerInfo.company}</div>
                </div>
              </div>
            </section>

            <section className={styles.formSection}>
              <div className={styles.sectionTitle}>
                <MapPin size={22} color="#0076ce" /> Site Address
              </div>

              <div className={styles.formGrid} style={{ gridTemplateColumns: "1fr" }}>
                <div className={styles.formGroup}>
                  <label>Address</label>
                  <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600 }}>
                    {customerInfo.address?.street}, {customerInfo.address?.city}, {customerInfo.address?.state} {customerInfo.address?.zip}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <ClipboardCheck size={22} color="#0076ce" /> Service Items
          </div>

          <div className={styles.userTableContainer} style={{ marginTop: "1rem" }}>
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Fixture</th>
                  <th>Qty</th>
                  <th style={{ width: "120px" }}>To Fix</th>
                  <th>Note</th>
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
                        style={{ background: "#eef1f4" }}
                        value={item.toFix || 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          handleToFixChange(idx, "toFix", isNaN(val) ? 0 : val);
                        }}
                        min="0"
                      />
                    </td>
                    <td>
                      <textarea
                        className={styles.formInput}
                        style={{ background: "#eef1f4", height: "40px", resize: "none" }}
                        value={item.issueNote}
                        onChange={(e) => handleToFixChange(idx, "issueNote", e.target.value)}
                        placeholder="Describe the issue..."
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
            <ShieldCheck size={22} color="#0076ce" /> Status & Contractor
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Service Status</label>
              <div style={{ position: "relative" }}>
                <select
                  className={styles.formSelect}
                  style={{ background: "#eef1f4" }}
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <ChevronDown size={18} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Contractor</label>
              <div style={{ position: "relative" }}>
                <select
                  className={styles.formSelect}
                  style={{ background: "#eef1f4" }}
                  value={formData.assignedTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                >
                  <option value="">Unassigned</option>
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
                style={{ background: "#eef1f4" }}
                value={formData.serviceDateTime}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceDateTime: e.target.value }))}
              />
            </div> */}
            {/* <div className={styles.formGroup}>
              <label>Material Status</label>
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
              <Package size={22} color="#0076ce" /> Materials
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
                  <th style={{ width: "180px" }}>Images</th>
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
                        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                          {(mat.images || []).map((img: string, i: number) => (
                            <div key={i} style={{ width: "35px", height: "35px", borderRadius: "4px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                              <img src={img} alt="Material" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                          ))}
                          {(!mat.images || mat.images.length === 0) && (
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
            <Clock size={22} color="#0076ce" /> Service Notes
          </div>

          <div className={styles.formGroup} style={{ marginTop: "1.5rem" }}>
            <label>Notes</label>
            <textarea
              className={styles.formInput}
              style={{ background: "#eef1f4", height: "100px", padding: "1rem" }}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional service notes..."
            />
          </div>
        </section>

        <div className={styles.actionFooter} style={{ background: "#f1f5f9", padding: "2.5rem", borderRadius: "16px", marginTop: "3rem" }}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => router.push("/services")}
            disabled={saving}
            style={{ padding: "0.875rem 2.5rem" }}
          >
            <X size={20} /> Cancel
          </button>
          <button type="submit" className={styles.createBtn} disabled={saving} style={{ padding: "0.875rem 3rem" }}>
            {saving ? "Updating..." : <><SaveIcon size={20} /> Save Changes</>}
          </button>
        </div>
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
                disabled={!newMaterial.item_name || !newMaterial.issued_qty || saving}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {saving ? "Saving..." : "Save Material"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
