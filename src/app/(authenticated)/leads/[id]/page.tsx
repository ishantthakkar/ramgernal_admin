"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../../dashboard.module.css";
import { 
  Info, 
  FileText, 
  RefreshCw, 
  Mail,
  Calendar,
  Layers,
  Loader2,
  XCircle,
  Building,
  Phone,
  MapPin,
  Clock,
  Edit2,
  ArrowLeft,
  X
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";

export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [markingLost, setMarkingLost] = useState(false);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const response = await adminApi.getLeadById(id);
        setLead(response.lead || response.data || response);
      } catch (err) {
        console.error("Failed to fetch lead details:", err);
        toast.error("Failed to load lead details.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchLead();
  }, [id]);

  const handleConvert = async () => {
    if (!window.confirm("Are you sure you want to convert this lead to a customer?")) return;
    
    setConverting(true);
    try {
      await adminApi.convertLead(id);
      toast.success("Lead converted to customer successfully!");
      router.push("/customers");
    } catch (err: any) {
      toast.error(err.message || "Failed to convert lead. Please try again.");
    } finally {
      setConverting(false);
    }
  };

  const handleLost = async () => {
    if (!window.confirm("Are you sure you want to mark this lead as lost?")) return;
    
    setMarkingLost(true);
    try {
      await adminApi.updateLeadStatus(id, "Lost Leads");
      toast.success("Lead marked as lost successfully!");
      router.push("/leads");
    } catch (err: any) {
      toast.error(err.message || "Failed to update lead status.");
    } finally {
      setMarkingLost(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className={styles.spinner} color="#0076ce" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div style={{ display: "flex", flex: 1, height: "60vh", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <XCircle size={48} color="#ef4444" style={{ margin: "0 auto 1rem" }} />
          <p style={{ fontWeight: 600 }}>Lead not found.</p>
          <button 
            className={styles.cancelBtn} 
            onClick={() => router.push("/leads")}
            style={{ marginTop: "1rem" }}
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New": return "#3b82f6";
      case "In Progress": return "#f59e0b";
      case "Converted To Customer": return "#10b981";
      case "Lost Leads": return "#ef4444";
      default: return "#64748b";
    }
  };

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span> 
        <span 
          style={{ cursor: "pointer" }} 
          onClick={() => router.push("/leads")}
        >LEADS</span> <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span> 
        <span style={{ color: "#0076ce" }}>VIEW LEAD</span>
      </div>

      <div className={styles.pageHeader} style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className={styles.welcomeText}>Lead Profile: {lead.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
            <span style={{ 
              backgroundColor: `${getStatusColor(lead.status)}15`, 
              color: getStatusColor(lead.status),
              padding: "0.25rem 0.75rem",
              borderRadius: "99px",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase"
            }}>
              {lead.status || "New"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button 
            className={styles.createBtn} 
            onClick={handleConvert}
            disabled={converting || markingLost || lead.status === "Converted To Customer" || lead.status === "Lost Leads"}
            style={{ background: "#10b981" }}
          >
            {converting ? <Loader2 size={18} className={styles.spinner} /> : <RefreshCw size={18} />} 
            {converting ? "Converting..." : lead.status === "Converted To Customer" ? "Converted" : "Convert to Customer"}
          </button>
          
          <button 
            className={styles.createBtn}
            onClick={handleLost}
            disabled={converting || markingLost || lead.status === "Converted To Customer" || lead.status === "Lost Leads"}
            style={{ background: "#ef4444" }}
          >
            {markingLost ? <Loader2 size={18} className={styles.spinner} /> : <XCircle size={18} />} 
            {markingLost ? "Updating..." : lead.status === "Lost Leads" ? "Lead Lost" : "Mark as Lost"}
          </button>
        </div>
      </div>

      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <Info size={22} color="#0076ce" /> Lead Information
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Full Name</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              {lead.name || "N/A"}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Company</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Building size={16} color="#64748b" />
                {lead.company || "N/A"}
              </div>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Lead Source</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Layers size={16} color="#3b82f6" />
                {lead.leadSource || "N/A"}
              </div>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Assigned Salesperson</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ 
                  background: "#eff6ff", 
                  color: "#1d4ed8", 
                  width: 24, 
                  height: 24, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontWeight: 700, 
                  fontSize: "0.6rem",
                  borderRadius: "50%"
                }}>
                  {lead.salesPerson?.charAt(0) || "S"}
                </div>
                {lead.salesPerson || "Unassigned"}
              </div>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Created Date</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Calendar size={16} color="#64748b" />
                {lead.createdDate ? new Date(lead.createdDate).toLocaleDateString() : "N/A"}
              </div>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Last Activity</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Clock size={16} color="#64748b" />
                {lead.lastActivity ? new Date(lead.lastActivity).toLocaleDateString() : "N/A"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <FileText size={22} color="#0076ce" /> Contact Details
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Email Address</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#0076ce", fontWeight: 600, border: "1px solid #e2e8f0", textDecoration: "underline" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Mail size={16} color="#64748b" />
                {lead.email || "N/A"}
              </div>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Mobile Number</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Phone size={16} color="#64748b" />
                {lead.mobileNumber || "N/A"}
              </div>
            </div>
          </div>
          <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
            <label>Physical Address</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0", minHeight: "3rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                <MapPin size={16} color="#64748b" style={{ marginTop: "0.2rem" }} />
                <span>
                  {lead.street ? `${lead.street}, ` : ""}
                  {lead.city ? `${lead.city}, ` : ""}
                  {lead.state ? `${lead.state} ` : ""}
                  {lead.zip || ""}
                  {(!lead.street && !lead.city && !lead.state && !lead.zip) && "No address provided"}
                </span>
              </div>
            </div>
          </div>
          {lead.notes && lead.notes.length > 0 && (
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label>Additional Notes</label>
              <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 500, border: "1px solid #e2e8f0", minHeight: "5rem", whiteSpace: "pre-wrap", display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem" }}>
                {Array.isArray(lead.notes) ? (
                  lead.notes.map((n: any, index: number) => (
                    <div key={n._id || index} style={{ paddingBottom: index !== lead.notes.length - 1 ? "0.75rem" : "0", borderBottom: index !== lead.notes.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                      <div style={{ color: "#64748b", fontSize: "0.7rem", marginBottom: "0.25rem", display: "flex", justifyContent: "space-between" }}>
                        <span>Note {index + 1}</span>
                        <span>{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}</span>
                      </div>
                      <div style={{ color: "#1e293b", fontSize: "0.9rem" }}>{n.note}</div>
                    </div>
                  ))
                ) : (
                  typeof lead.notes === "string" ? lead.notes : JSON.stringify(lead.notes)
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.actionFooter} style={{ background: "#f1f5f9", padding: "2.5rem", borderRadius: "16px", marginTop: "3rem", justifyContent: "flex-end" }}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => router.push("/leads")}
          style={{ padding: "0.875rem 3rem", background: "#64748b", color: "#ffffff" }}
        >
          <X size={20} /> Close
        </button>
      </div>
    </div>
  );
}
