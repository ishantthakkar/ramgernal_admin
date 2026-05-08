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
  X
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import { canViewModule } from "@/lib/permissions";

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
    materials: [] as { name: string; quantity: number }[]
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
    const updated = [...formData.materials];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData(prev => ({ ...prev, materials: updated }));
  };

  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, { name: "", quantity: 1 }]
    }));
  };

  const removeMaterial = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== idx)
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
      const payload = {
        customerId: formData.customerId,
        notes: formData.notes,
        toFixItems: toFixItems.map(item => ({
          surveyId: item.surveyId,
          area: item.area,
          fixtureType: item.fixtureType,
          proposedQty: item.proposedQty,
          toFix: item.toFix,
          issueNote: item.issueNote
        })),
        assignedTo: formData.assignedTo || undefined,
        materialDelivered: formData.materialDelivered,
        status: formData.status,
        serviceDateTime: formData.serviceDateTime,
        materials: formData.materials
      };
      const response = await adminApi.createServiceTicket(payload);
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
        <h1 className={styles.welcomeText}>Create Service Ticket</h1>
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
                <ClipboardCheck size={22} color="#8b5cf6" /> Service Items (Survey Reference)
              </div>
              <p className={styles.sectionSubtitle}>Specify which items from the original survey need fixing.</p>
              
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
                <ShieldCheck size={22} color="#ef4444" /> Assignment & Logistics
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
                <div className={styles.formGroup}>
                  <label>Service Date</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={formData.serviceDateTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceDateTime: e.target.value }))}
                  />
                </div>
                <div className={styles.formGroup}>
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
                </div>
              </div>
            </section>

            <section className={styles.formSection}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className={styles.sectionTitle}>
                  <Package size={22} color="#0ea5e9" /> Materials
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
                    {formData.materials.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontStyle: "italic" }}>
                          No materials added yet.
                        </td>
                      </tr>
                    ) : (
                      formData.materials.map((mat, idx) => (
                        <tr key={idx}>
                          <td>
                            <input
                              type="text"
                              className={styles.formInput}
                              value={mat.name}
                              onChange={(e) => handleMaterialChange(idx, "name", e.target.value)}
                              placeholder="e.g. LED Driver 50W"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className={styles.formInput}
                              value={mat.quantity}
                              onChange={(e) => handleMaterialChange(idx, "quantity", parseInt(e.target.value))}
                              min="1"
                              style={{ textAlign: "center" }}
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
                {loading ? "Creating..." : <><SaveIcon size={20} /> Create Ticket</>}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
