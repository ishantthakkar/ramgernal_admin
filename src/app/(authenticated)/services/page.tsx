"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../dashboard.module.css";
import {
  Settings,
  Plus,
  Search,
  User,
  MapPin,
  ClipboardCheck,
  Hammer,
  ShieldCheck,
  X,
  ChevronDown,
  Loader2,
  Calendar,
  Building,
  Phone,
  Mail,
  ExternalLink,
  ArrowRight,
  Save as SaveIcon,
  ImageIcon,
  Edit2
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import { canViewModule, hasPermission } from "@/lib/permissions";

const MOCK_SERVICES = [
  {
    _id: "SRV-2024-001",
    customerName: "Andrew Scoff",
    company: "Xelectronics",
    contractor: "Methew Zynd",
    logistics: "Delivered",
    status: "In Progress",
    date: "2024-05-01"
  },
  {
    _id: "SRV-2024-002",
    customerName: "Cliff Booth",
    company: "Starlight Industries",
    contractor: "Sarah Connor",
    logistics: "Pending",
    status: "Assigned",
    date: "2024-04-28"
  },
  {
    _id: "SRV-2024-003",
    customerName: "Halisen Margot",
    company: "Margot & Sons",
    contractor: "Methew Zynd",
    logistics: "Delivered",
    status: "Completed",
    date: "2024-04-25"
  }
];

const MOCK_PREFILL_DATA = {
  customer: {
    name: "Andrew Scoff",
    mobileNumber: "0412 345 678",
    email: "andrew@xelectronics.com",
    leadSource: "Google Search",
    salesPerson: "Jack Hclison",
    createdAt: "2024-01-15T10:00:00Z",
    convertedDate: "2024-02-10T14:30:00Z",
    company: "Xelectronics",
    address: "123 Technology Drive",
    city: "Sydney",
    state: "NSW",
    zipCode: "2000"
  },
  surveys: [
    {
      _id: "srv_1",
      area: "Main Office",
      proposedFixture: "LED Panel 60x60",
      proposedQuantity: 24,
      images: ["https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=200&h=200&auto=format&fit=crop"]
    },
    {
      _id: "srv_2",
      area: "Warehouse",
      proposedFixture: "LED High Bay 150W",
      proposedQuantity: 12,
      images: ["https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=200&h=200&auto=format&fit=crop"]
    }
  ]
};

const MOCK_CONTRACTORS = [
  { _id: "c1", fullName: "Methew Zynd" },
  { _id: "c2", fullName: "Sarah Connor" },
  { _id: "c3", fullName: "Dave Wilson" }
];

export default function ServicesPage() {
  const router = useRouter();
  const [view, setView] = useState<"list" | "add">("list");
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [eligibleCustomers, setEligibleCustomers] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  useEffect(() => {
    if (!canViewModule("Services")) {
      toast.error("You do not have permission to view services.");
      router.push("/dashboard");
      return;
    }
  }, [router]);

  // Form State for Add Service
  const [formData, setFormData] = useState({
    customerId: "",
    toFixItems: [] as any[],
    materialDelivered: false,
    assignedTo: "",
    notes: "",
    status: "Assigned"
  });

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getServices();
      if (response.success) {
        setServices(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch services");
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    if (view === "list") {
      fetchServices();
    } else if (view === "add") {
      fetchEligibleCustomers();
      fetchContractors();
    }
  }, [view]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out items that don't need fixing if necessary, or just send all
    // Based on the user's curl example, they send specific items.
    // Let's only send items where toFix > 0
    const toFixItems = formData.toFixItems.filter(item => item.toFix > 0);

    if (toFixItems.length === 0) {
      toast.warning("Please specify at least one item to fix.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        toFixItems
      };
      const response = await adminApi.createServiceTicket(payload);
      if (response.success) {
        toast.success("Service ticket created successfully!");
        setView("list");
        // Reset form
        setFormData({
          customerId: "",
          toFixItems: [],
          materialDelivered: false,
          assignedTo: "",
          notes: "",
          status: "Assigned"
        });
        setSelectedCustomer(null);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create service ticket");
    } finally {
      setLoading(false);
    }
  };

  if (view === "add") {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.breadcrumb}>
          ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
          <span style={{ cursor: "pointer" }} onClick={() => setView("list")}>SERVICES</span>
          <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
          <span style={{ color: "#0076ce" }}>ADD SERVICE</span>
        </div>

        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.welcomeText}>Service</h1>
            <p style={{ color: "#64748b", marginTop: "4px" }}>Manage post-installation service workflows</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: "2rem" }}>
          {/* Customer Selection */}
          <section className={styles.formSection}>
            <div className={styles.sectionTitle}>
              <Search size={22} color="#0076ce" /> Select Customer / Company
            </div>
            <div style={{ marginTop: "1.5rem", maxWidth: "500px" }}>
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
          </section>

          {loading && !selectedCustomer && (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
              <Loader2 className="animate-spin" size={32} color="#0076ce" />
            </div>
          )}

          {selectedCustomer && (
            <>
              {/* Customer Info & Address Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "2rem" }}>
                <section className={styles.formSection} style={{ margin: 0 }}>
                  <div className={styles.sectionTitle}>
                    <User size={22} color="#10b981" /> Customer Information
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1.5rem" }}>
                    <div className={styles.formGroup}>
                      <label>Name</label>
                      <div className={styles.formInput} style={{ background: "#f8fafc", color: "black", fontWeight: 500 }}>{selectedCustomer.customer.name}</div>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Mobile</label>
                      <div className={styles.formInput} style={{ background: "#f8fafc", color: "black", fontWeight: 500 }}>{selectedCustomer.customer.mobileNumber}</div>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Email</label>
                      <div className={styles.formInput} style={{ background: "#f8fafc", color: "black", fontWeight: 500 }}>{selectedCustomer.customer.email || "N/A"}</div>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Lead Source</label>
                      <div className={styles.formInput} style={{ background: "#f8fafc", color: "black", fontWeight: 500 }}>{selectedCustomer.customer.leadSource || "N/A"}</div>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Sales Person</label>
                      <div className={styles.formInput} style={{ background: "#f8fafc", color: "black", fontWeight: 500 }}>{selectedCustomer.customer.salesPerson}</div>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Created Date</label>
                      <div className={styles.formInput} style={{ background: "#f8fafc", color: "black", fontWeight: 500 }}>{new Date(selectedCustomer.customer.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Converted Date</label>
                      <div className={styles.formInput} style={{ background: "#f8fafc", color: "black", fontWeight: 500 }}>
                        {selectedCustomer.customer.convertedDate ? new Date(selectedCustomer.customer.convertedDate).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                  </div>
                </section>

                <section className={styles.formSection} style={{ margin: 0 }}>
                  <div className={styles.sectionTitle}>
                    <MapPin size={22} color="#f59e0b" /> Address Details
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem", marginTop: "1.5rem" }}>
                    <div className={styles.formGroup}>
                      <label>Company</label>
                      <div className={styles.formInput} style={{ background: "#f8fafc", color: "black", fontWeight: 600 }}>{selectedCustomer.customer.company}</div>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Address</label>
                      <div className={styles.formInput} style={{ background: "#f8fafc", color: "black", fontWeight: 500 }}>{selectedCustomer.customer.address?.street || "N/A"}</div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                      <div className={styles.formGroup}>
                        <label>City</label>
                        <div className={styles.formInput} style={{ background: "#f8fafc", color: "black", fontWeight: 500 }}>{selectedCustomer.customer.address?.city || "N/A"}</div>
                      </div>
                      <div className={styles.formGroup}>
                        <label>State</label>
                        <div className={styles.formInput} style={{ background: "#f8fafc", color: "black", fontWeight: 500 }}>{selectedCustomer.customer.address?.state || "N/A"}</div>
                      </div>
                      <div className={styles.formGroup}>
                        <label>ZIP</label>
                        <div className={styles.formInput} style={{ background: "#f8fafc", color: "black", fontWeight: 500 }}>{selectedCustomer.customer.address?.zip || "N/A"}</div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Service Table */}
              <section className={styles.formSection} style={{ marginTop: "2rem" }}>
                <div className={styles.sectionTitle}>
                  <ClipboardCheck size={22} color="#8b5cf6" /> Service Details (Survey Reference)
                </div>
                <div className={styles.userTableContainer} style={{ marginTop: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <table className={styles.userTable}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        <th>Area</th>
                        <th>Type of Fixture</th>
                        <th>Original Qty</th>
                        <th style={{ width: "120px" }}>To Fix</th>
                        <th style={{ minWidth: "250px" }}>Issue Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.toFixItems.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, color: "black" }}>{item.area}</td>
                          <td style={{ color: "#0076ce", fontWeight: 500 }}>{item.fixtureType}</td>
                          <td style={{ textAlign: "center", fontWeight: 700, color: "black" }}>{item.proposedQty}</td>
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

              {/* Assignment & Logistics */}
              <section className={styles.formSection} style={{ marginTop: "2rem" }}>
                <div className={styles.sectionTitle}>
                  <ShieldCheck size={22} color="#ef4444" /> Assignment & Logistics
                </div>
                <div className={styles.formGrid} style={{ marginTop: "1.5rem" }}>
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

                <div className={styles.formGroup} style={{ marginTop: "1.5rem" }}>
                  <label>Notes</label>
                  <textarea
                    className={styles.formInput}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="General service notes..."
                    style={{ padding: "0.8rem", height: "80px" }}
                  />
                </div>
              </section>

              <div className={styles.actionFooter} style={{ background: "#f8fafc", padding: "2rem", borderRadius: "12px", marginTop: "3rem" }}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setView("list")}
                  style={{ padding: "0.875rem 3rem" }}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.createBtn} style={{ padding: "0.875rem 4rem" }} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <SaveIcon size={20} style={{ marginRight: "0.5rem" }} />}
                  Create Service Ticket
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>SERVICES</span>
      </div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.welcomeText}>Service</h1>
          <p style={{ color: "#64748b", marginTop: "4px" }}>Manage post-installation service workflows</p>
        </div>
        {hasPermission("Services", "create") && (
          <button className={styles.createBtn} onClick={() => setView("add")}>
            <Plus size={20} /> Add Service
          </button>
        )}
      </div>

      <div style={{ marginTop: "2rem" }}>
        {/* List View Table */}
        <div className={styles.userTableContainer} style={{ borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Company</th>
                <th>Contractor</th>
                <th>Material</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "3rem" }}>
                    <Loader2 className="animate-spin" style={{ margin: "0 auto" }} />
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                    No service tickets found.
                  </td>
                </tr>
              ) : (
                services.map((item) => (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 700, color: "#0076ce" }}>{item.ticketId || item._id}</td>
                    <td style={{ fontWeight: 600, color: "#1e293b" }}>{item.customerId?.name}</td>
                    <td style={{ color: "#1e293b" }}>{item.customerId?.company}</td>
                    <td style={{ fontWeight: 600, color: "#475569" }}>
                      {item.assignedTo?.fullName || item.customerId?.assignToContractor?.fullName || "Unassigned"}
                    </td>
                    <td>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background: item.materialDelivered ? "#dcfce7" : "#fef3c7",
                        color: item.materialDelivered ? "#15803d" : "#92400e"
                      }}>
                        {item.materialDelivered ? "Delivered" : "Pending"}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        background: item.status === "Completed" ? "#f0fdf4" : item.status === "Assigned" ? "#eff6ff" : "#f1f5f9",
                        color: item.status === "Completed" ? "#16a34a" : item.status === "Assigned" ? "#2563eb" : "#475569",
                        border: `1px solid ${item.status === "Completed" ? "#bbf7d0" : item.status === "Assigned" ? "#bfdbfe" : "#e2e8f0"}`
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "0.85rem" }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className={styles.assignBtn}
                        onClick={() => toast.info(`View details for ${item.ticketId}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
