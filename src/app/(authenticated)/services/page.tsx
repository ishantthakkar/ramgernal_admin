"use client";

import { useState, useEffect } from "react";
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
  const [view, setView] = useState<"list" | "add">("list");
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  // Form State for Add Service
  const [formData, setFormData] = useState({
    customerId: "",
    toFixItems: [] as any[],
    materialDelivered: false,
    assignedTo: "",
    notes: ""
  });

  const loadMockData = () => {
    setSelectedCustomer(MOCK_PREFILL_DATA);
    const items = MOCK_PREFILL_DATA.surveys.map(s => ({
      surveyId: s._id,
      area: s.area,
      fixtureType: s.proposedFixture,
      proposedQty: s.proposedQuantity,
      toFix: 1,
      image: s.images[0],
      issueNote: "Flickering issue reported by staff."
    }));
    setFormData({
      customerId: "mock_prefill",
      toFixItems: items,
      materialDelivered: true,
      assignedTo: "c1",
      notes: "Sample service request note."
    });
  };

  const handleCustomerChange = (customerId: string) => {
    if (customerId === "mock_prefill") {
      loadMockData();
    } else {
      setSelectedCustomer(null);
      setFormData(prev => ({ ...prev, customerId: "", toFixItems: [] }));
    }
  };

  const handleToFixChange = (idx: number, field: string, value: any) => {
    const updated = [...formData.toFixItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData(prev => ({ ...prev, toFixItems: updated }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Service ticket created successfully!");
    setView("list");
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
            <h1 className={styles.welcomeText}>Service Tracking</h1>
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
                >
                  <option value="">Choose a customer...</option>
                  <option value="mock_prefill">Andrew Scoff - Xelectronics</option>
                </select>
                <ChevronDown size={18} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", fontWeight: "bold", pointerEvents: "none", color: "#64748b" }} />
              </div>
            </div>
          </section>

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
                      <label>Street Address</label>
                      <div className={styles.formInput} style={{ background: "#f8fafc", color: "black", fontWeight: 500 }}>{selectedCustomer.customer.address || "N/A"}</div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                      <div className={styles.formGroup}>
                        <label>City</label>
                        <div className={styles.formInput} style={{ background: "#f8fafc", color: "black", fontWeight: 500 }}>{selectedCustomer.customer.city || "N/A"}</div>
                      </div>
                      <div className={styles.formGroup}>
                        <label>State</label>
                        <div className={styles.formInput} style={{ background: "#f8fafc", color: "black", fontWeight: 500 }}>{selectedCustomer.customer.state || "N/A"}</div>
                      </div>
                      <div className={styles.formGroup}>
                        <label>ZIP</label>
                        <div className={styles.formInput} style={{ background: "#f8fafc", color: "black", fontWeight: 500 }}>{selectedCustomer.customer.zipCode || "N/A"}</div>
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
                        <th>Photo/Video</th>
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
                              value={item.toFix}
                              onChange={(e) => handleToFixChange(idx, "toFix", parseInt(e.target.value))}
                              style={{ padding: "0.4rem", textAlign: "center" }}
                            />
                          </td>
                          <td>
                            {item.image ? (
                              <div style={{ width: "50px", height: "50px", borderRadius: "6px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                                <img src={item.image} alt="Ref" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#94a3b8", fontSize: "0.75rem" }}>
                                <ImageIcon size={14} /> None
                              </div>
                            )}
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

              {/* Assignment & Verification */}
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
                        required
                      >
                        <option value="">Select Contractor</option>
                        {MOCK_CONTRACTORS.map(c => (
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
                
                <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
                   <button type="button" className={styles.assignBtn} style={{ background: "#10b981", color: "white", border: "none" }}>
                      Verify Material
                   </button>
                </div>
              </section>

              <div className={styles.actionFooter} style={{ background: "#f8fafc", padding: "2rem", borderRadius: "12px", marginTop: "3rem" }}>
                <button type="submit" className={styles.createBtn} style={{ padding: "0.875rem 4rem" }}>
                  <SaveIcon size={20} style={{ marginRight: "0.5rem" }} /> Create Service Ticket
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
          <h1 className={styles.welcomeText}>Service Tracking</h1>
          <p style={{ color: "#64748b", marginTop: "4px" }}>Manage post-installation service workflows</p>
        </div>
        <button className={styles.createBtn} onClick={() => setView("add")}>
          <Plus size={20} /> Add Service
        </button>
      </div>

      <div style={{ marginTop: "2rem" }}>
         {/* List View Table */}
         <div className={styles.userTableContainer} style={{ borderRadius: "16px", border: "1px solid #e2e8f0" }}>
           <table className={styles.userTable}>
             <thead>
               <tr>
                 <th>Ticket ID</th>
                 <th>Customer</th>
                 <th>Company</th>
                 <th>Contractor</th>
                 <th>Logistics</th>
                 <th>Status</th>
                 <th>Actions</th>
               </tr>
             </thead>
             <tbody>
               {MOCK_SERVICES.map((item) => (
                 <tr key={item._id}>
                   <td style={{ fontWeight: 700, color: "#0076ce" }}>{item._id}</td>
                   <td style={{ fontWeight: 600, color: "#1e293b" }}>{item.customerName}</td>
                   <td style={{ color: "#1e293b" }}>{item.company}</td>
                   <td style={{ fontWeight: 500, color: "#475569" }}>{item.contractor}</td>
                   <td>
                     <span style={{ 
                       padding: "4px 12px", 
                       borderRadius: "20px", 
                       fontSize: "0.75rem", 
                       fontWeight: 700,
                       background: item.logistics === "Delivered" ? "#dcfce7" : "#fef3c7",
                       color: item.logistics === "Delivered" ? "#15803d" : "#92400e"
                     }}>
                       {item.logistics}
                     </span>
                   </td>
                   <td>
                     <span style={{ 
                       padding: "4px 12px", 
                       borderRadius: "6px", 
                       fontSize: "0.75rem", 
                       fontWeight: 600,
                       background: item.status === "Completed" ? "#f0fdf4" : item.status === "In Progress" ? "#eff6ff" : "#f1f5f9",
                       color: item.status === "Completed" ? "#16a34a" : item.status === "In Progress" ? "#2563eb" : "#475569",
                       border: `1px solid ${item.status === "Completed" ? "#bbf7d0" : item.status === "In Progress" ? "#bfdbfe" : "#e2e8f0"}`
                     }}>
                       {item.status}
                     </span>
                   </td>
                   <td>
                      <button 
                        className={styles.assignBtn}
                        onClick={() => toast.info(`Editing ${item._id} (Static Demo)`)}
                      >
                        Edit
                      </button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
}
