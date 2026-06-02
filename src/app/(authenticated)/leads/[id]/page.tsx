"use client";

import { useMemo, useState, useEffect } from "react";
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
  X
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { formatDate, formatDateTime } from "@/lib/dateUtils";

function resolveUploadsUrl(filename: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  // Works for both "/api/proxy" and absolute API base URL cases.
  return `${base}/uploads/leads/bills/${filename}`;
}

export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [markingLost, setMarkingLost] = useState(false);

  // Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: "convert" as "convert" | "lost",
    title: "",
    message: "",
    confirmText: "",
    btnType: "info" as "danger" | "success" | "warning" | "info"
  });

  const bills: string[] = useMemo(() => {
    const raw = lead?.uploadElectricityBill;
    if (Array.isArray(raw)) return raw.filter(Boolean);
    return [];
  }, [lead?.uploadElectricityBill]);

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

  const handleConvertClick = () => {
    setModalConfig({
      type: "convert",
      title: "Convert to Customer",
      message: "Are you sure you want to convert this lead to a customer? This will create a new customer record and workflow.",
      confirmText: "Yes, Convert",
      btnType: "success"
    });
    setShowConfirmModal(true);
  };

  const handleLostClick = () => {
    setModalConfig({
      type: "lost",
      title: "Mark as Lost",
      message: "Are you sure you want to mark this lead as lost? This action can be reversed by changing the status later.",
      confirmText: "Yes, Mark Lost",
      btnType: "danger"
    });
    setShowConfirmModal(true);
  };

  const handleModalConfirm = async () => {
    setShowConfirmModal(false);
    if (modalConfig.type === "convert") {
      await handleConvert();
    } else {
      await handleLost();
    }
  };

  const handleConvert = async () => {
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
        <Loader2 size={48} className={styles.spinner} />
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
            {lead.lead_id && (
              <span style={{
                backgroundColor: "#f1f5f9",
                color: "#334155",
                padding: "0.25rem 0.75rem",
                borderRadius: "99px",
                fontSize: "0.75rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.03em"
              }}>
                {lead.lead_id}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            className={styles.createBtn}
            onClick={handleConvertClick}
            disabled={converting || markingLost || lead.status === "Converted To Customer" || lead.status === "Lost Leads"}
            style={{ background: "#10b981" }}
          >
            {converting ? <Loader2 size={18} className={styles.spinner} /> : <RefreshCw size={18} />}
            {converting ? "Converting..." : lead.status === "Converted To Customer" ? "Converted" : "Convert to Customer"}
          </button>

          <button
            className={styles.createBtn}
            onClick={handleLostClick}
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
                {lead.leadSourceName || lead.leadSource || "N/A"}
              </div>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Sales Person</label>
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
                  {(lead.user_id?.fullName || "S").charAt(0)}
                </div>
                {lead.user_id?.fullName || "Unassigned"}
              </div>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Created Date</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Calendar size={16} color="#64748b" />
                {lead.createdAt ? formatDate(lead.createdAt) : "N/A"}
              </div>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Last Activity</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Clock size={16} color="#64748b" />
                {lead.lastActivity ? formatDate(lead.lastActivity) : "N/A"}
              </div>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Account Number</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              {lead.accountNumber || "—"}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Electric Company</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              {lead.electricCompany || "—"}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>DBA</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              {lead.dba || "—"}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Legal Name</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              {lead.legalName || "—"}
            </div>
          </div>
          {lead.status === "Lost Leads" && (
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label>Lost Reason</label>
              <div className={styles.formInput} style={{ background: "#fff7ed", color: "#9a3412", fontWeight: 600, border: "1px solid #fed7aa", minHeight: "3rem" }}>
                {lead.lostReason || "—"}
              </div>
            </div>
          )}
          {bills.length > 0 && (
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label>Electricity Bills</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                {bills.map((filename: string) => {
                  const url = resolveUploadsUrl(filename);
                  const isPdf = filename.toLowerCase().endsWith(".pdf");
                  return (
                    <a
                      key={filename}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        width: 160,
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                        overflow: "hidden",
                        background: "#ffffff",
                        textDecoration: "none",
                        color: "#1e293b",
                      }}
                    >
                      <div style={{ height: 110, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {isPdf ? (
                          <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>PDF</div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt={filename} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}
                      </div>
                      <div style={{ padding: "0.5rem 0.6rem", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {filename}
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
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
            <label>Address</label>
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
          {Array.isArray(lead.addresses) && lead.addresses.length > 0 && (
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label>Addresses</label>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {lead.addresses.map((a: any, idx: number) => (
                  <div
                    key={a._id || idx}
                    className={styles.formInput}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      padding: "1rem",
                      fontWeight: 600,
                      display: "grid",
                      gap: "0.25rem",
                    }}
                  >
                    <div style={{ color: "#0f172a", fontWeight: 800 }}>
                      {a.title || `Address ${idx + 1}`}
                    </div>
                    <div style={{ color: "#334155", fontWeight: 600 }}>
                      {[a.street, a.city, a.state, a.zip].filter(Boolean).join(", ") || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(lead.contactInfo) && lead.contactInfo.length > 0 && (
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label>Contact Info</label>
              <div className={styles.userTableContainer} style={{ border: "1px solid #f1f5f9", borderRadius: "12px", overflow: "hidden" }}>
                <table className={styles.userTable}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Position</th>
                      <th>Department</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Mobile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lead.contactInfo.map((c: any, idx: number) => (
                      <tr key={c._id || idx}>
                        <td style={{ fontWeight: 700, color: "#0f172a" }}>{c.name || "—"}</td>
                        <td>{c.position || "—"}</td>
                        <td>{c.department || "—"}</td>
                        <td style={{ color: c.email ? "#0076ce" : "#64748b" }}>{c.email || "—"}</td>
                        <td>{c.phone || "—"}</td>
                        <td>{c.mobile || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {lead.notes && lead.notes.length > 0 && (
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label>Notes</label>
              <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 500, border: "1px solid #e2e8f0", minHeight: "5rem", whiteSpace: "pre-wrap", display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem" }}>
                {Array.isArray(lead.notes) ? (
                  lead.notes.map((n: any, index: number) => (
                    <div key={n._id || index} style={{ paddingBottom: index !== lead.notes.length - 1 ? "0.75rem" : "0", borderBottom: index !== lead.notes.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                      <div style={{ color: "#64748b", fontSize: "0.7rem", marginBottom: "0.25rem", display: "flex", justifyContent: "space-between" }}>
                        <span>{n.title ? n.title : `Note ${index + 1}`}</span>
                        <span>{n.createdAt ? formatDateTime(n.createdAt) : ""}</span>
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
      {/* Activity Log Section */}
      {lead.activityLog && lead.activityLog.length > 0 && (
        <div className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <Clock size={22} color="#0076ce" /> Activity
          </div>
          <div className={styles.userTableContainer} style={{ border: "1px solid #f1f5f9", borderRadius: "12px", overflow: "hidden", marginTop: "1rem" }}>
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Date</th>
                  <th>Outcome</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {lead.activityLog.map((log: any) => (
                  <tr key={log._id}>
                    <td style={{ fontWeight: 600, color: "#1e293b" }}>
                      <span style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "99px",
                        fontSize: "0.7rem",
                        background: "#f1f5f9",
                        color: "#475569",
                        textTransform: "uppercase",
                        fontWeight: 700
                      }}>
                        {log.activityType || "UPDATE"}
                      </span>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "0.85rem" }}>
                      {log.date ? formatDate(log.date) : formatDate(log.createdAt)}
                    </td>
                    <td style={{ color: "#1e293b", fontWeight: 500 }}>{log.outcome || "N/A"}</td>
                    <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{log.notes || "No additional notes"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleModalConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        type={modalConfig.btnType}
        isLoading={converting || markingLost}
      />
    </div>
  );
}
