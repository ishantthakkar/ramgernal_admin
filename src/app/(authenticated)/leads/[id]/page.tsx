"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./lead-details.module.css";
import dashboardStyles from "../../dashboard.module.css";
import { 
  Info, 
  FileText, 
  RefreshCw, 
  Mail,
  Calendar,
  Layers,
  Loader2,
  XCircle
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
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
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
      <div style={{ display: "flex", flex: 1, height: "100%", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <Loader2 size={40} className={styles.spinner} style={{ marginBottom: "1rem" }} />
          <p style={{ fontWeight: 600 }}>Loading Lead Profile...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div style={{ display: "flex", flex: 1, height: "100%", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#64748b", fontWeight: 600 }}>Lead not found.</p>
      </div>
    );
  }

  return (
    <div className={styles.detailsPage}>
      <div className={dashboardStyles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span> 
        <span 
          style={{ cursor: "pointer" }} 
          onClick={() => router.push("/leads")}
        >LEADS</span> <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span> 
        <span style={{ color: "#0076ce" }}>LEAD DETAILS</span>
      </div>

      <div className={styles.headerActions}>
        <div className={styles.titleArea}>
          <h1 className={styles.profileTitle}>Lead Profile: {lead.name}</h1>
          <span className={styles.statusBadge}>{lead.status?.toUpperCase()}</span>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button 
            className={styles.convertBtn} 
            onClick={handleConvert}
            disabled={converting || markingLost || lead.status === "Closed" || lead.status === "Lost Leads"}
          >
            {converting ? <Loader2 size={18} className={styles.spinner} /> : <RefreshCw size={18} />} 
            {converting ? "Converting..." : lead.status === "Closed" ? "Already Converted" : "Convert to Customer"}
          </button>
          <button 
            onClick={handleLost}
            disabled={converting || markingLost || lead.status === "Closed" || lead.status === "Lost Leads"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.6rem 1.25rem",
              backgroundColor: lead.status === "Lost Leads" ? "#f1f5f9" : "#ef4444",
              color: lead.status === "Lost Leads" ? "#94a3b8" : "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: (lead.status === "Lost Leads" || lead.status === "Closed") ? "not-allowed" : "pointer",
              transition: "all 0.2s ease"
            }}
          >
            {markingLost ? <Loader2 size={18} className={styles.spinner} /> : <XCircle size={18} />} 
            {markingLost ? "Updating..." : lead.status === "Lost Leads" ? "Lead Lost" : "Mark as Lost"}
          </button>
        </div>
      </div>

      {/* Lead Information */}
      <section className={styles.infoSection}>
        <div className={styles.sectionHeading}>
          <div className={styles.iconBox}>
            <Info size={20} />
          </div>
          Lead Information
        </div>

        <div className={styles.grid}>
          <div className={styles.fieldGroup}>
            <div className={styles.label}>Company</div>
            <div className={styles.value}>{lead.company || "N/A"}</div>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.label}>Date</div>
            <div className={styles.value}>{lead.createdDate ? new Date(lead.createdDate).toLocaleDateString() : "N/A"}</div>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.label}>Last Activity</div>
            <div className={styles.value}>{lead.lastActivity ? new Date(lead.lastActivity).toLocaleDateString() : "N/A"}</div>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.label}>Lead Source</div>
            <div className={styles.value} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Layers size={18} color="#3b82f6" /> {lead.leadSource || "Unknown"}
            </div>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.label}>Salesperson</div>
            <div className={styles.salespersonBox}>
              <div className={styles.avatarMini} style={{ 
                background: "#eff6ff", 
                color: "#1d4ed8", 
                width: 28, 
                height: 28, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontWeight: 700, 
                fontSize: "0.65rem",
                borderRadius: "50%"
              }}>
                {lead.salesPerson?.charAt(0) || "S"}
              </div>
              <span className={styles.value} style={{ fontSize: "1rem" }}>{lead.salesPerson}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Details */}
      <section className={styles.infoSection}>
        <div className={styles.sectionHeading}>
          <div className={styles.iconBox}>
            <FileText size={20} />
          </div>
          Contact Details
        </div>

        <div className={styles.grid}>
          <div className={styles.fieldGroup}>
            <div className={styles.label}>Email Address</div>
            <div className={`${styles.value} ${styles.linkValue}`}>{lead.email || "N/A"}</div>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.label}>Mobile Number</div>
            <div className={styles.value}>{lead.mobileNumber}</div>
          </div>
          <div className={styles.fieldGroup} style={{ gridColumn: "span 2" }}>
            <div className={styles.label}>Address</div>
            <div className={styles.value}>
              {lead.street ? `${lead.street}, ` : ""}
              {lead.city ? `${lead.city}, ` : ""}
              {lead.state ? `${lead.state} ` : ""}
              {lead.zip || ""}
              {(!lead.street && !lead.city && !lead.state && !lead.zip) && "No address provided"}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
