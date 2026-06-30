"use client";

import { useMemo, useState, useEffect, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../../dashboard.module.css";
import viewStyles from "../../customers/[id]/customer-details.module.css";
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
  Briefcase,
  User,
  Building,
  Zap,
  Hash,
  Phone,
  Mail,
  UserCheck,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import modalStyles from "@/components/modals/ConfirmationModal.module.css";
import { formatDate, formatDateTime } from "@/lib/dateUtils";
import { formatNoteAuthorLabel } from "@/lib/leadNotes";
import { getActivityDisplayText } from "@/lib/leadPersistence";
import { formatUsPhone } from "@/lib/format-us-phone";
import { leadCanConvertToCustomer, leadHasPhoneOrMobile } from "@/lib/lead-validation";

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

const PRIMARY_ICON = "var(--admin-primary, #004d4d)";
const MUTED_ICON = "#64748b";

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function formatAddressLine(address: Record<string, unknown>): string {
  const parts = [address.city, address.state, address.zip]
    .filter((part) => part != null && String(part).trim() !== "")
    .map(String);
  return parts.length > 0 ? parts.join(", ") : "—";
}

interface ReadOnlyFieldProps {
  label: string;
  icon?: ReactNode;
  valueClassName?: string;
  children: ReactNode;
}

function ReadOnlyField({ label, icon, valueClassName, children }: ReadOnlyFieldProps) {
  return (
    <div className={styles.formGroup}>
      <label>{label}</label>
      <div className={`${styles.formInput} ${viewStyles.readonlyField} ${valueClassName || ""}`}>
        {icon ? <div className={viewStyles.fieldRow}>{icon}{children}</div> : children}
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
  const [convertMobileNumber, setConvertMobileNumber] = useState("");
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

  const convertNeedsMobile = lead ? !leadHasPhoneOrMobile(lead) : false;

  const handleConvertClick = () => {
    setConvertMobileNumber(
      lead?.mobileNumber ? formatUsPhone(String(lead.mobileNumber)) : ""
    );
    setModalConfig({
      type: "convert",
      title: "Convert to Customer",
      message: convertNeedsMobile
        ? "Add a mobile number below, then convert this lead to a customer."
        : "Are you sure you want to convert this lead to a customer?",
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
      message: "Are you sure you want to mark this lead as lost?",
      confirmText: "Yes, Mark Lost",
      btnType: "danger"
    });
    setShowConfirmModal(true);
  };

  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
    setLostReason("");
    setConvertMobileNumber("");
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
      const mobileToSave = convertMobileNumber.trim();
      if (mobileToSave) {
        const currentMobile = String(lead?.mobileNumber || "").trim();
        if (mobileToSave !== currentMobile) {
          const data = new FormData();
          data.append("id", id);
          data.append("mobileNumber", mobileToSave);
          await adminApi.updateLead(data);
        }
      }

      await adminApi.convertLead(id);
      toast.success("Lead converted to customer successfully!");
      router.push("/customers");
    } catch (err: any) {
      toast.error(err.message || "Failed to convert lead. Please try again.");
    } finally {
      setConverting(false);
      setConvertMobileNumber("");
    }
  };

  const handleLost = async () => {
    const reason = lostReason.trim();

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
  const emailDisplay = displayValue(lead.email);
  const statusColor = getStatusColor(lead.status || "New");

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

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.welcomeText}>View Lead Profile</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
            <span
              style={{
                backgroundColor: `${statusColor}15`,
                color: statusColor,
                padding: "0.25rem 0.75rem",
                borderRadius: "99px",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {lead.status || "New"}
            </span>
            {lead.lead_id && (
              <span
                style={{
                  backgroundColor: "#f1f5f9",
                  color: "#334155",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "99px",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                {lead.lead_id}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
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
                type="button"
                className={styles.createBtn}
                onClick={handleConvertClick}
                disabled={converting || markingLost || lead.status === "Converted To Customer"}
                style={{ background: "#10b981" }}
              >
                {converting ? <Loader2 size={18} className={styles.spinner} /> : <RefreshCw size={18} />}
                {converting ? "Converting..." : lead.status === "Converted To Customer" ? "Converted" : "Convert to Customer"}
              </button>

              <button
                type="button"
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

      <div className={styles.formSection}>
        <div className={`${styles.sectionTitle} ${viewStyles.viewSectionTitle}`}>
          <Info size={22} color={PRIMARY_ICON} /> Lead Information
        </div>
        <div className={styles.formGrid}>
          <ReadOnlyField label="Lead Source" icon={<Briefcase size={16} color={MUTED_ICON} />}>
            {displayValue(lead.leadSourceName || lead.leadSource)}
          </ReadOnlyField>
          <ReadOnlyField label="Lead Name" icon={<User size={16} color={MUTED_ICON} />}>
            {displayValue(displayName)}
          </ReadOnlyField>
          <ReadOnlyField label="DBA" icon={<Building size={16} color={MUTED_ICON} />}>
            {displayValue(lead.dba)}
          </ReadOnlyField>
          <ReadOnlyField label="Utility / Electric Company" icon={<Zap size={16} color={MUTED_ICON} />}>
            {displayValue(lead.electricCompany)}
          </ReadOnlyField>
          <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
            <label>Electricity Bills</label>
            <div className={`${styles.formInput} ${viewStyles.readonlyField}`} style={{ minHeight: "2.75rem" }}>
              {bills.length === 0 ? (
                <span className={viewStyles.readonlyFieldMuted}>No bills uploaded.</span>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", width: "100%" }}>
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
          </div>
          <ReadOnlyField label="Bill Date" icon={<Calendar size={16} color={MUTED_ICON} />}>
            {lead.billDate ? formatDate(lead.billDate) : "—"}
          </ReadOnlyField>
          <ReadOnlyField label="Account Number" icon={<Hash size={16} color={MUTED_ICON} />}>
            {displayValue(lead.accountNumber)}
          </ReadOnlyField>
          <ReadOnlyField label="Legal Name" icon={<User size={16} color={MUTED_ICON} />}>
            {displayValue(lead.legalName)}
          </ReadOnlyField>
          <ReadOnlyField label="Mobile" icon={<Phone size={16} color={MUTED_ICON} />}>
            {displayValue(lead.mobileNumber)}
          </ReadOnlyField>
          <ReadOnlyField
            label="Email"
            icon={<Mail size={16} color={MUTED_ICON} />}
            valueClassName={emailDisplay !== "—" ? viewStyles.readonlyFieldLink : viewStyles.readonlyFieldMuted}
          >
            {emailDisplay}
          </ReadOnlyField>
          <ReadOnlyField label="Assign to Sales Person" icon={<UserCheck size={16} color={MUTED_ICON} />}>
            {displayValue(lead.user_id?.fullName || "Unassigned")}
          </ReadOnlyField>
          {lead.status === "Lost Leads" && (
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label>Lost Reason</label>
              <div
                className={`${styles.formInput} ${viewStyles.readonlyField}`}
                style={{
                  background: "#fff7ed",
                  color: "#9a3412",
                  border: "1px solid #fed7aa",
                }}
              >
                <div className={viewStyles.fieldRow}>
                  <ShieldAlert size={16} color="#9a3412" />
                  {displayValue(lead.lostReason)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.formSection}>
        <div className={`${styles.sectionTitle} ${viewStyles.viewSectionTitle}`}>
          <MapPin size={22} color={PRIMARY_ICON} /> Address Information
        </div>
        {addresses.length === 0 ? (
          <div className={viewStyles.emptyState}>No addresses on file.</div>
        ) : (
          <div className={styles.userTableContainer}>
            <table className={viewStyles.detailTable}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Street</th>
                  <th>City / State / Zip</th>
                </tr>
              </thead>
              <tbody>
                {addresses.map(
                  (
                    a: {
                      _id?: string;
                      title?: string;
                      street?: string;
                      city?: string;
                      state?: string;
                      zip?: string;
                    },
                    idx: number
                  ) => (
                    <tr key={a._id || idx}>
                      <td className={viewStyles.detailTableName}>
                        {displayValue(a.title) !== "—" ? String(a.title) : `Address ${idx + 1}`}
                      </td>
                      <td>{displayValue(a.street)}</td>
                      <td>{formatAddressLine(a)}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={styles.formSection}>
        <div className={`${styles.sectionTitle} ${viewStyles.viewSectionTitle}`}>
          <Users size={22} color={PRIMARY_ICON} /> Contact Information
        </div>
        {contacts.length === 0 ? (
          <div className={viewStyles.emptyState}>No contacts on file.</div>
        ) : (
          <div className={styles.userTableContainer}>
            <table className={viewStyles.detailTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Mobile</th>
                  <th>Contact Card</th>
                </tr>
              </thead>
              <tbody>
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
                    <tr key={c._id || idx}>
                      <td className={viewStyles.detailTableName}>
                        {displayValue(c.name) !== "—" ? String(c.name) : "Contact"}
                        {c.position ? (
                          <span className={viewStyles.detailTableMuted}> ({String(c.position)})</span>
                        ) : null}
                      </td>
                      <td>{displayValue(c.department)}</td>
                      <td>{displayValue(c.email)}</td>
                      <td>{displayValue(c.phone)}</td>
                      <td>{displayValue(c.mobile)}</td>
                      <td>
                        {Array.isArray(c.businessCard) && c.businessCard.length > 0 ? (
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
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={styles.formSection}>
        <div className={`${styles.sectionTitle} ${viewStyles.viewSectionTitle}`}>
          <FileText size={22} color={PRIMARY_ICON} /> Notes
        </div>
        {notes.length === 0 ? (
          <div className={viewStyles.emptyState}>No notes on file.</div>
        ) : (
          <div className={styles.userTableContainer}>
            <table className={viewStyles.detailTable}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Author</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {notes.map(
                  (
                    n: { _id?: string; title?: string; note?: string; createdAt?: string },
                    idx: number
                  ) => (
                    <tr key={n._id || idx}>
                      <td className={viewStyles.detailTableName}>
                        {displayValue(n.title) !== "—" ? String(n.title) : `Note ${idx + 1}`}
                      </td>
                      <td className={viewStyles.detailTableMuted}>
                        {n.createdAt ? formatDateTime(n.createdAt) : "—"}
                      </td>
                      <td>{formatNoteAuthorLabel(n)}</td>
                      <td>
                        <div className={viewStyles.noteContent}>{displayValue(n.note)}</div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={styles.formSection}>
        <div className={`${styles.sectionTitle} ${viewStyles.viewSectionTitle}`}>
          <Calendar size={22} color={PRIMARY_ICON} /> Activities
        </div>
        {activityLog.length === 0 ? (
          <div className={viewStyles.emptyState}>No activities recorded.</div>
        ) : (
          <div className={styles.userTableContainer}>
            <table className={viewStyles.detailTable}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
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
                      <tr key={log._id || idx}>
                        <td className={viewStyles.detailTableName}>
                          {displayValue(log.activityType) !== "—"
                            ? String(log.activityType)
                            : "Activity"}
                        </td>
                        <td className={viewStyles.detailTableMuted}>
                          {log.date
                            ? formatDateTime(log.date)
                            : log.createdAt
                              ? formatDateTime(log.createdAt)
                              : "—"}
                        </td>
                        <td>
                          {activityText ? (
                            <div className={viewStyles.noteContent}>{activityText}</div>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
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

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCloseConfirmModal}
        onConfirm={handleModalConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        type={modalConfig.btnType}
        isLoading={converting || markingLost}
        confirmDisabled={
          modalConfig.type === "convert" &&
          !leadCanConvertToCustomer(lead || {}, convertMobileNumber)
        }
      >
        {modalConfig.type === "lost" ? (
          <div>
            <label className={modalStyles.modalFieldLabel} htmlFor="lost-reason-view">
              Lost Reason
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
        {modalConfig.type === "convert" && convertNeedsMobile ? (
          <div>
            <label className={modalStyles.modalFieldLabel} htmlFor="convert-mobile-view">
              Mobile Number <span className={modalStyles.modalFieldRequired}>*</span>
            </label>
            <input
              id="convert-mobile-view"
              type="tel"
              className={modalStyles.modalInput}
              placeholder="(555) 555-1234"
              value={convertMobileNumber}
              onChange={(e) => setConvertMobileNumber(formatUsPhone(e.target.value))}
              disabled={converting}
              inputMode="numeric"
              maxLength={14}
            />
          </div>
        ) : null}
      </ConfirmationModal>
    </div>
  );
}
