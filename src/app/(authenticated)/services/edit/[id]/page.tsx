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
  X
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import { canViewModule } from "@/lib/permissions";

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
    material: [] as { item_name: string; issued_qty: number }[]
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

  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      material: [...prev.material, { item_name: "", issued_qty: 1 }]
    }));
  };

  const removeMaterial = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      material: prev.material.filter((_, i) => i !== idx)
    }));
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
        <h1 className={styles.welcomeText}>Edit Service Ticket</h1>
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
            <ClipboardCheck size={22} color="#0076ce" /> Service Items (Survey Reference)
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
            <ShieldCheck size={22} color="#0076ce" /> Status & Assignment
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
            <div className={styles.formGroup}>
              <label>Service Date</label>
              <input
                type="date"
                className={styles.formInput}
                style={{ background: "#eef1f4" }}
                value={formData.serviceDateTime}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceDateTime: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup}>
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
            </div>
          </div>
        </section>

        <section className={styles.formSection}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className={styles.sectionTitle}>
              <Package size={22} color="#0076ce" /> Materials
            </div>
            <button
              type="button"
              onClick={addMaterial}
              className={styles.assignBtn}
              style={{ padding: "0.5rem 1.5rem", borderRadius: "8px" }}
            >
              + Add Material
            </button>
          </div>

          <div className={styles.userTableContainer} style={{ marginTop: "1.5rem" }}>
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th>Material Name</th>
                  <th style={{ width: "150px" }}>Quantity</th>
                  <th style={{ width: "80px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {formData.material.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontStyle: "italic" }}>
                      No materials added yet.
                    </td>
                  </tr>
                ) : (
                  formData.material.map((mat, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="text"
                          className={styles.formInput}
                          style={{ background: "#eef1f4", color: "#0f172a", fontWeight: 600 }}
                          value={mat.item_name}
                          onChange={(e) => handleMaterialChange(idx, "item_name", e.target.value)}
                          placeholder="e.g. LED Driver 50W"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className={styles.formInput}
                          style={{ background: "#eef1f4", color: "#0f172a", fontWeight: 600 }}
                          value={mat.issued_qty}
                          onChange={(e) => handleMaterialChange(idx, "issued_qty", parseInt(e.target.value))}
                          min="1"
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => removeMaterial(idx)}
                          style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}
                        >
                          <Trash2 size={18} />
                        </button>
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
    </div>
  );
}
