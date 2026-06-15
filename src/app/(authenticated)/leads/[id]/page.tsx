"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../../dashboard.module.css";
import addStyles from "../add/leads-add.module.css";
import {
  Info,
  FileText,
  RefreshCw,
  Loader2,
  XCircle,
  MapPin,
  Users,
  Calendar,
  X,
  Edit2,
  ShieldAlert,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import modalStyles from "@/components/modals/ConfirmationModal.module.css";
import { formatDate, formatDateTime } from "@/lib/dateUtils";
import { formatNoteAuthorLabel } from "@/lib/leadNotes";
import { getActivityDisplayText } from "@/lib/leadPersistence";

function resolveUploadsUrl(filename: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  return `${base}/uploads/leads/bills/${filename}`;
}

function resolveBusinessCardImageUrl(value: string): string {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  return `${base}/uploads/leads/business-cards/${value.replace(/^\//, "")}`;
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={styles.formGroup}>
      <label>{label}</label>
      <div
        className={styles.formInput}
        style={{
          background: "#f8fafc",
          color: value === "—" ? "#94a3b8" : "#1e293b",
          fontWeight: 600,
          border: "1px solid #e2e8f0",
          minHeight: "2.75rem",
          display: "flex",
          alignItems: "center",
        }}
      >
        {value}
      </div>
    </div>
  );
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
  const [lostReason, setLostReason] = useState("");
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
    setLostReason("");
    setModalConfig({
      type: "lost",
      title: "Mark as Lost",
      message: "Are you sure you want to mark this lead as lost? This action can be reversed by changing the status later.",
      confirmText: "Yes, Mark Lost",
      btnType: "danger"
    });
    setShowConfirmModal(true);
  };

  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
    setLostReason("");
  };

  const handleModalConfirm = async () => {
    setShowConfirmModal(false);
    if (modalConfig.type === "convert") {
      setLostReason("");
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
    const reason = lostReason.trim();
    if (!reason) {
      toast.error("Please enter a lost reason.");
      return;
    }

    setMarkingLost(true);
    try {
      await adminApi.markLeadAsLost(id, reason);
      toast.success("Lead marked as lost successfully!");
      router.push("/leads");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update lead status.";
      toast.error(message);
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

  const displayName = lead.leadName || lead.name || "Lead";
  const addresses = Array.isArray(lead.addresses) ? lead.addresses : [];
  const contacts = Array.isArray(lead.contactInfo) ? lead.contactInfo : [];
  const notes = Array.isArray(lead.notes) ? lead.notes : [];
  const activityLog = Array.isArray(lead.activityLog) ? lead.activityLog : [];

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span
          style={{ cursor: "pointer" }}
          onClick={() => router.push("/leads")}
        >LEADS</span> <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>VIEW LEAD</span>
      </div>

      <div className={styles.pageHeader} style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className={styles.welcomeText}>Lead Profile: {displayName}</h1>
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
            type="button"
            className={styles.addBtn}
            onClick={() => router.push(`/leads/${id}/edit`)}
          >
            <Edit2 size={20} /> Edit
          </button>

          {lead.status !== "Lost Leads" && (
            <>
              <button
                className={styles.createBtn}
                onClick={handleConvertClick}
                disabled={converting || markingLost || lead.status === "Converted To Customer"}
                style={{ background: "#10b981" }}
              >
                {converting ? <Loader2 size={18} className={styles.spinner} /> : <RefreshCw size={18} />}
                {converting ? "Converting..." : lead.status === "Converted To Customer" ? "Converted" : "Convert to Customer"}
              </button>

              <button
                className={styles.createBtn}
                onClick={handleLostClick}
                disabled={converting || markingLost || lead.status === "Converted To Customer"}
                style={{ background: "#ef4444" }}
              >
                {markingLost ? <Loader2 size={18} className={styles.spinner} /> : <XCircle size={18} />}
                {markingLost ? "Updating..." : "Mark as Lost"}
              </button>
            </>
          )}
        </div>
      </div>

      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <Info size={22} color="var(--admin-primary, #004d4d)" /> Lead Information
        </div>
        <div className={styles.formGrid}>
          <ReadOnlyField
            label="Lead Source"
            value={lead.leadSourceName || lead.leadSource || "—"}
          />
          <ReadOnlyField label="Lead Name" value={displayName} />
          <ReadOnlyField label="DBA" value={lead.dba || "—"} />
          <ReadOnlyField
            label="Utility / Electric Company"
            value={lead.electricCompany || "—"}
          />
          <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
            <label>Electricity Bills</label>
            {bills.length === 0 ? (
              <div
                className={styles.formInput}
                style={{
                  background: "#f8fafc",
                  color: "#64748b",
                  border: "1px solid #e2e8f0",
                }}
              >
                No bills uploaded.
              </div>
            ) : (
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
                      <div
                        style={{
                          height: 110,
                          background: "#f8fafc",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isPdf ? (
                          <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
                            PDF
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={url}
                            alt={filename}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        )}
                      </div>
                      <div
                        style={{
                          padding: "0.5rem 0.6rem",
                          fontSize: 12,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {filename}
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          <ReadOnlyField
            label="Bill Date"
            value={lead.billDate ? formatDate(lead.billDate) : "—"}
          />
          <ReadOnlyField label="Account Number" value={lead.accountNumber || "—"} />
          <ReadOnlyField label="Legal Name" value={lead.legalName || "—"} />
          <ReadOnlyField label="Mobile" value={lead.mobileNumber || "—"} />
          <ReadOnlyField label="Email" value={lead.email || "—"} />
          <ReadOnlyField
            label="Assign to Sales Person"
            value={lead.user_id?.fullName || "Unassigned"}
          />
          {lead.status === "Lost Leads" && (
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label>Lost Reason</label>
              <div
                className={styles.formInput}
                style={{
                  background: "#fff7ed",
                  color: "#9a3412",
                  fontWeight: 600,
                  border: "1px solid #fed7aa",
                  minHeight: "3rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <ShieldAlert size={16} color="#9a3412" />
                {lead.lostReason || "—"}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <MapPin size={22} color="var(--admin-primary, #004d4d)" /> Address Information
        </div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
            {addresses.length === 0 ? (
              <div className={addStyles.emptyState}>No addresses on file.</div>
            ) : (
              <div className={addStyles.itemGrid}>
                {addresses.map((a: { _id?: string; title?: string; street?: string; city?: string; state?: string; zip?: string }, idx: number) => (
                  <div key={a._id || idx} className={addStyles.itemCard}>
                    <div className={addStyles.itemHeader}>
                      <span className={addStyles.itemTitle}>
                        {a.title || `Address ${idx + 1}`}
                      </span>
                    </div>
                    <div className={addStyles.itemContent}>
                      {a.street && <div>{a.street}</div>}
                      {(a.city || a.state || a.zip) && (
                        <div>
                          {[a.city, a.state, a.zip].filter(Boolean).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <Users size={22} color="var(--admin-primary, #004d4d)" /> Contact Information
        </div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
            {contacts.length === 0 ? (
              <div className={addStyles.emptyState}>No contacts on file.</div>
            ) : (
              <div className={addStyles.itemGrid}>
                {contacts.map(
                  (
                    c: {
                      _id?: string;
                      name?: string;
                      position?: string;
                      department?: string;
                      email?: string;
                      phone?: string;
                      mobile?: string;
                      businessCard?: string[];
                    },
                    idx: number
                  ) => (
                    <div key={c._id || idx} className={addStyles.itemCard}>
                      <div className={addStyles.itemHeader}>
                        <span className={addStyles.itemTitle}>
                          {c.name || "Contact"}
                          {c.position ? ` (${c.position})` : ""}
                        </span>
                      </div>
                      <div className={addStyles.itemContent}>
                        {c.department && <div>Department: {c.department}</div>}
                        {c.email && <div>Email: {c.email}</div>}
                        {c.phone && <div>Phone: {c.phone}</div>}
                        {c.mobile && <div>Mobile: {c.mobile}</div>}
                        {Array.isArray(c.businessCard) && c.businessCard.length > 0 && (
                          <div style={{ marginTop: "0.75rem" }}>
                            <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.35rem" }}>
                              Contact Card
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                              {c.businessCard.map((cardUrl) => {
                                const imageUrl = resolveBusinessCardImageUrl(cardUrl);
                                return (
                                <a
                                  key={imageUrl}
                                  href={imageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: "block",
                                    width: 96,
                                    height: 64,
                                    borderRadius: 8,
                                    overflow: "hidden",
                                    border: "1px solid #e2e8f0",
                                  }}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={imageUrl}
                                    alt={`${c.name || "Contact"} card`}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  />
                                </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <FileText size={22} color="var(--admin-primary, #004d4d)" /> Notes
        </div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
            {notes.length === 0 ? (
              <div className={addStyles.emptyState}>No notes on file.</div>
            ) : (
              <div className={addStyles.itemGrid}>
                {notes.map(
                  (
                    n: { _id?: string; title?: string; note?: string; createdAt?: string },
                    idx: number
                  ) => (
                    <div key={n._id || idx} className={addStyles.itemCard}>
                      <div className={addStyles.itemHeader}>
                        <span className={addStyles.itemTitle}>
                          {n.title || `Note ${idx + 1}`}
                        </span>
                        {n.createdAt && (
                          <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
                            {formatDateTime(n.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className={addStyles.itemContent}>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.35rem" }}>
                          By {formatNoteAuthorLabel(n)}
                        </div>
                        {n.note || "—"}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <Calendar size={22} color="var(--admin-primary, #004d4d)" /> Activities
        </div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
            {activityLog.length === 0 ? (
              <div className={addStyles.emptyState}>No activities recorded.</div>
            ) : (
              <div className={addStyles.itemGrid}>
                {activityLog.map(
                  (
                    log: {
                      _id?: string;
                      activityType?: string;
                      date?: string;
                      createdAt?: string;
                      note?: string;
                      outcome?: string;
                      notes?: string;
                    },
                    idx: number
                  ) => {
                    const activityText = getActivityDisplayText(log);
                    return (
                      <div key={log._id || idx} className={addStyles.itemCard}>
                        <div className={addStyles.itemHeader}>
                          <span className={addStyles.itemTitle}>
                            {log.activityType || "Activity"}
                          </span>
                        </div>
                        <div className={addStyles.itemContent}>
                          <div>
                            Date:{" "}
                            {log.date
                              ? formatDateTime(log.date)
                              : log.createdAt
                                ? formatDateTime(log.createdAt)
                                : "—"}
                          </div>
                          {activityText && (
                            <div style={{ whiteSpace: "pre-line" }}>{activityText}</div>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>
      </section>

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
        onClose={handleCloseConfirmModal}
        onConfirm={handleModalConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        type={modalConfig.btnType}
        isLoading={converting || markingLost}
        confirmDisabled={modalConfig.type === "lost" && !lostReason.trim()}
      >
        {modalConfig.type === "lost" ? (
          <div>
            <label className={modalStyles.modalFieldLabel} htmlFor="lost-reason-view">
              Lost Reason <span className={modalStyles.modalFieldRequired}>*</span>
            </label>
            <textarea
              id="lost-reason-view"
              className={modalStyles.modalTextarea}
              placeholder="Enter why this lead was lost..."
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              disabled={markingLost}
            />
          </div>
        ) : null}
      </ConfirmationModal>
    </div>
  );
}
