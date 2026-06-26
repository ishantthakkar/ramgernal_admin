"use client";

import { useMemo, useState, useEffect, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../../dashboard.module.css";
import viewStyles from "./customer-details.module.css";
import {
  UserPlus,
  Loader2,
  MapPin,
  X,
  XCircle,
  FileText,
  Edit2,
  Calendar,
  Users,
  Phone,
  Mail,
  Building,
  Hash,
  Briefcase,
  Zap,
  Activity,
  User,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { formatDateTime } from "@/lib/dateUtils";
import { formatNoteAuthorLabel } from "@/lib/leadNotes";
import { hasPermission } from "@/lib/permissions";
import { toast } from "react-toastify";

const PRIMARY_ICON = "var(--admin-primary, #004d4d)";
const MUTED_ICON = "#64748b";

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
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

function formatActivityUser(activity: Record<string, unknown>): string {
  const user = activity.user_id;
  if (user && typeof user === "object") {
    const record = user as Record<string, unknown>;
    return String(record.fullName || record.email || "—");
  }
  return "—";
}

function getStatusColor(status: string): string {
  switch (status) {
    case "New":
      return "#3b82f6";
    case "in_progress":
    case "In Progress":
      return "#f59e0b";
    case "completed":
    case "Completed":
      return "#10b981";
    case "reopen":
      return "#8b5cf6";
    case "pending_edit_approval":
      return "#ef4444";
    default:
      return "#64748b";
  }
}

function formatAddressLine(address: Record<string, unknown>): string {
  const parts = [address.city, address.state, address.zip]
    .filter((part) => part != null && String(part).trim() !== "")
    .map(String);
  return parts.length > 0 ? parts.join(", ") : "—";
}

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [customer, setCustomer] = useState<Record<string, unknown> | null>(null);
  const [activities, setActivities] = useState<Record<string, unknown>[]>([]);
  const [leadSourceMap, setLeadSourceMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const canEdit = hasPermission("Customers", "edit");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customerRes, sourcesRes] = await Promise.all([
          adminApi.getCustomerWorkflowDetails(id),
          adminApi.getLeadSources().catch(() => ({ leadSources: [] })),
        ]);

        setCustomer((customerRes.customer as Record<string, unknown>) || null);

        const activityList = Array.isArray(customerRes.activities)
          ? customerRes.activities
          : [];
        if (activityList.length > 0) {
          setActivities(activityList as Record<string, unknown>[]);
        } else {
          try {
            const activitiesRes = await adminApi.getCustomerActivities(id);
            setActivities(
              Array.isArray(activitiesRes.activities)
                ? (activitiesRes.activities as Record<string, unknown>[])
                : []
            );
          } catch {
            setActivities([]);
          }
        }

        const map: Record<string, string> = {};
        const sources = sourcesRes.leadSources || [];
        if (Array.isArray(sources)) {
          sources.forEach((s: { code?: string; name?: string }) => {
            if (s.code) map[s.code] = s.name || s.code;
          });
        }
        setLeadSourceMap(map);
      } catch (err) {
        console.error("Failed to fetch customer details:", err);
        toast.error("Failed to load customer details.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const addresses = useMemo(() => {
    const list = Array.isArray(customer?.addresses) ? (customer.addresses as Record<string, unknown>[]) : [];
    if (list.length > 0) return list;
    const addr = customer?.address as Record<string, string> | undefined;
    if (addr && (addr.street || addr.city || addr.state || addr.zip)) {
      return [{ title: "Primary Address", ...addr }];
    }
    return [];
  }, [customer?.addresses, customer?.address]);

  const contacts = useMemo(() => {
    if (!customer) return [];
    return Array.isArray(customer.contactInfo)
      ? (customer.contactInfo as Record<string, unknown>[])
      : [];
  }, [customer]);

  const notes = Array.isArray(customer?.notes) ? (customer.notes as Record<string, unknown>[]) : [];

  const leadRecord =
    customer?.leadId && typeof customer.leadId === "object"
      ? (customer.leadId as Record<string, unknown>)
      : null;

  const dbaDisplay = String(
    customer?.dba || leadRecord?.dba || customer?.company || ""
  ).trim();
  const electricCompanyDisplay = String(
    customer?.electricCompany || leadRecord?.electricCompany || ""
  ).trim();
  const leadNameDisplay = String(
    customer?.leadName || leadRecord?.leadName || leadRecord?.name || customer?.name || ""
  ).trim();

  const leadSourceCode = customer?.leadSource as string | undefined;
  const leadSourceDisplay = leadSourceCode
    ? leadSourceMap[leadSourceCode] || leadSourceCode
    : "—";

  const leadIdDisplay = useMemo(() => {
    if (leadRecord?.lead_id) return String(leadRecord.lead_id);
    if (customer?.lead_id != null && typeof customer.lead_id !== "object") {
      return String(customer.lead_id);
    }
    if (typeof customer?.leadId === "string") return customer.leadId;
    return "—";
  }, [customer?.leadId, customer?.lead_id, leadRecord?.lead_id]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className={styles.spinner} />
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ display: "flex", flex: 1, height: "60vh", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <XCircle size={48} color="#ef4444" style={{ margin: "0 auto 1rem" }} />
          <p style={{ fontWeight: 600 }}>Customer not found.</p>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => router.push("/customers")}
            style={{ marginTop: "1rem" }}
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  const statusLabel = String(customer.status || "New");
  const statusColor = getStatusColor(statusLabel);
  const emailDisplay = displayValue(customer.email);
  const mobileDisplay = displayValue(customer.mobileNumber);

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/customers")}>
          CUSTOMERS
        </span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>VIEW CUSTOMER</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>View Customer Profile</h1>
        {canEdit && (
          <button type="button" className={styles.addBtn} onClick={() => router.push(`/customers/${id}/edit`)}>
            <Edit2 size={20} /> Edit
          </button>
        )}
      </div>

      <div className={styles.formSection}>
        <div className={`${styles.sectionTitle} ${viewStyles.viewSectionTitle}`}>
          <UserPlus size={22} color={PRIMARY_ICON} /> Customer Information
        </div>
        <div className={styles.formGrid}>
          <ReadOnlyField label="Lead Source" icon={<Briefcase size={16} color={MUTED_ICON} />}>
            {leadSourceDisplay}
          </ReadOnlyField>
          <ReadOnlyField label="Lead Name" icon={<User size={16} color={MUTED_ICON} />}>
            {displayValue(leadNameDisplay)}
          </ReadOnlyField>
          <ReadOnlyField label="DBA" icon={<Building size={16} color={MUTED_ICON} />}>
            {displayValue(dbaDisplay)}
          </ReadOnlyField>
          <ReadOnlyField label="Utility / Electric Company" icon={<Zap size={16} color={MUTED_ICON} />}>
            {displayValue(electricCompanyDisplay)}
          </ReadOnlyField>
          <ReadOnlyField label="Account Number" icon={<Hash size={16} color={MUTED_ICON} />}>
            {displayValue(customer.accountNumber)}
          </ReadOnlyField>
          <ReadOnlyField label="Legal Name" icon={<User size={16} color={MUTED_ICON} />}>
            {displayValue(customer.legalName)}
          </ReadOnlyField>
          <ReadOnlyField label="Mobile" icon={<Phone size={16} color={MUTED_ICON} />}>
            {mobileDisplay}
          </ReadOnlyField>
          <ReadOnlyField
            label="Email"
            icon={<Mail size={16} color={MUTED_ICON} />}
            valueClassName={emailDisplay !== "—" ? viewStyles.readonlyFieldLink : viewStyles.readonlyFieldMuted}
          >
            {emailDisplay}
          </ReadOnlyField>
          <ReadOnlyField label="Lead ID" icon={<Hash size={16} color={MUTED_ICON} />}>
            {leadIdDisplay}
          </ReadOnlyField>
          <ReadOnlyField
            label="Status"
            icon={<Activity size={16} color={statusColor} />}
            valueClassName=""
          >
            <span style={{ color: statusColor, fontWeight: 700, textTransform: "capitalize" }}>
              {statusLabel.replace(/_/g, " ")}
            </span>
          </ReadOnlyField>
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
                {addresses.map((address, idx) => (
                  <tr key={(address._id as string) || idx}>
                    <td className={viewStyles.detailTableName}>
                      {displayValue(address.title) !== "—" ? String(address.title) : `Address ${idx + 1}`}
                    </td>
                    <td>{displayValue(address.street)}</td>
                    <td>{formatAddressLine(address)}</td>
                  </tr>
                ))}
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
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact, idx) => (
                  <tr key={(contact._id as string) || idx}>
                    <td className={viewStyles.detailTableName}>
                      {displayValue(contact.name) !== "—" ? String(contact.name) : "Contact"}
                      {contact.position ? (
                        <span className={viewStyles.detailTableMuted}> ({String(contact.position)})</span>
                      ) : null}
                    </td>
                    <td>{displayValue(contact.department)}</td>
                    <td>{displayValue(contact.email)}</td>
                    <td>{displayValue(contact.phone)}</td>
                    <td>{displayValue(contact.mobile)}</td>
                  </tr>
                ))}
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
                {notes.map((note, idx) => (
                  <tr key={(note._id as string) || idx}>
                    <td className={viewStyles.detailTableName}>
                      {displayValue(note.title) !== "—" ? String(note.title) : `Note ${idx + 1}`}
                    </td>
                    <td className={viewStyles.detailTableMuted}>
                      {note.createdAt ? formatDateTime(note.createdAt) : "—"}
                    </td>
                    <td>{formatNoteAuthorLabel(note)}</td>
                    <td>
                      <div className={viewStyles.noteContent}>{displayValue(note.note)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={styles.formSection}>
        <div className={`${styles.sectionTitle} ${viewStyles.viewSectionTitle}`}>
          <Calendar size={22} color={PRIMARY_ICON} /> Activities
        </div>
        {activities.length === 0 ? (
          <div className={viewStyles.emptyState}>No activities recorded.</div>
        ) : (
          <div className={styles.userTableContainer}>
            <table className={viewStyles.detailTable}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Date</th>
                  <th>User</th>
                  <th>Outcome</th>
                  <th>Notes</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity, idx) => (
                  <tr key={(activity._id as string) || idx}>
                    <td className={viewStyles.detailTableName}>
                      {displayValue(activity.activityType) !== "—"
                        ? String(activity.activityType)
                        : "Activity"}
                    </td>
                    <td className={viewStyles.detailTableMuted}>
                      {activity.date || activity.createdAt
                        ? formatDateTime(activity.date || activity.createdAt)
                        : "—"}
                    </td>
                    <td>{formatActivityUser(activity)}</td>
                    <td>{displayValue(activity.outcome)}</td>
                    <td>
                      <div className={viewStyles.noteContent}>{displayValue(activity.notes)}</div>
                    </td>
                    <td>{displayValue(activity.location)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
        className={styles.actionFooter}
        style={{ background: "#f1f5f9", padding: "2.5rem", borderRadius: "16px", marginTop: "3rem", justifyContent: "flex-end" }}
      >
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => router.push("/customers")}
          style={{ padding: "0.875rem 3rem", background: "#64748b", color: "#ffffff" }}
        >
          <X size={20} /> Close
        </button>
      </div>
    </div>
  );
}
