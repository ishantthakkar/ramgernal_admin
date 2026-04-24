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
  Loader2
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
        <button 
          className={styles.convertBtn} 
          onClick={handleConvert}
          disabled={converting || lead.status === "Closed"}
        >
          {converting ? <Loader2 size={18} className={styles.spinner} /> : <RefreshCw size={18} />} 
          {converting ? "Converting..." : lead.status === "Closed" ? "Already Converted" : "Convert to Customer"}
        </button>
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
            <div className={styles.label}>Lead ID</div>
            <div className={styles.value}>#{lead.id?.slice(-5).toUpperCase() || lead._id?.slice(-5).toUpperCase() || "N/A"}</div>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.label}>Company</div>
            <div className={styles.value}>{lead.company || "N/A"}</div>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.label}>Created Date</div>
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

      {/* Activities */}
      <section className={styles.infoSection}>
        <div className={styles.sectionHeading}>
          <div className={styles.iconBox}>
            <FileText size={20} />
          </div>
          Activities
        </div>

        <table className={styles.activityTable}>
          <thead>
            <tr>
              <th>Activity Type</th>
              <th>Date</th>
              <th>Outcome</th>
              <th>Next Follow-up Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Call</td>
              <td>04/07/2026</td>
              <td>Showing Interest</td>
              <td>04/09/2026</td>
            </tr>
            <tr>
              <td>Meeting</td>
              <td>04/10/2026</td>
              <td className={styles.outcomeText}>
                xcxcxcxcxcxxxxxcxcxxcxcxcxcxcxcxcxccxssjsncsjdnsjcnsjcnsjcnscjcncsnccscscs
              </td>
              <td>04/09/2026</td>
            </tr>
            <tr>
              <td>Site Visit</td>
              <td>04/10/2026</td>
              <td>Showing Interest</td>
              <td>04/09/2026</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
