"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../../dashboard.module.css";
import addStyles from "../../leads/add/leads-add.module.css";
import { Info, Loader2, MapPin, X, XCircle, FileText, Edit2, Calendar } from "lucide-react";
import { adminApi } from "@/lib/api";
import { formatDateTime } from "@/lib/dateUtils";

const SECTION_ICON_COLOR = "var(--admin-primary, #004d4d)";
import { formatNoteAuthorLabel } from "@/lib/leadNotes";
import { hasPermission } from "@/lib/permissions";
import { toast } from "react-toastify";

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
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

  const notes = Array.isArray(customer?.notes) ? (customer.notes as Record<string, unknown>[]) : [];

  const leadSourceCode = customer?.leadSource as string | undefined;
  const leadSourceDisplay = leadSourceCode
    ? leadSourceMap[leadSourceCode] || leadSourceCode
    : "—";

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

  const displayName = String(customer.leadName || customer.name || "Customer");
  const statusLabel = String(customer.status || "New");
  const leadIdLabel = customer.lead_id ?? customer.leadId;
  const hasLeadId =
    leadIdLabel !== null && leadIdLabel !== undefined && String(leadIdLabel).trim() !== "";

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

      <div className={styles.pageHeader} style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className={styles.welcomeText}>Customer Profile: {displayName}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
            <span
              style={{
                backgroundColor: `${getStatusColor(statusLabel)}15`,
                color: getStatusColor(statusLabel),
                padding: "0.25rem 0.75rem",
                borderRadius: "99px",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {statusLabel}
            </span>
            {hasLeadId && (
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
                {String(leadIdLabel)}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          {canEdit && (
            <button type="button" className={styles.addBtn} onClick={() => router.push(`/customers/${id}/edit`)}>
              <Edit2 size={20} /> Edit
            </button>
          )}
        </div>
      </div>

      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <Info size={22} color={SECTION_ICON_COLOR} /> Customer Information
        </div>
        <div className={styles.formGrid}>
          <ReadOnlyField label="Lead Source" value={leadSourceDisplay} />
          <ReadOnlyField label="Lead Name" value={displayValue(customer.leadName || customer.name)} />
          <ReadOnlyField label="DBA" value={displayValue(customer.dba)} />
          <ReadOnlyField label="Utility / Electric Company" value={displayValue(customer.electricCompany)} />
          <ReadOnlyField label="Account Number" value={displayValue(customer.accountNumber)} />
          <ReadOnlyField label="Legal Name" value={displayValue(customer.legalName)} />
          <ReadOnlyField label="Mobile" value={displayValue(customer.mobileNumber)} />
          <ReadOnlyField label="Email" value={displayValue(customer.email)} />
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <MapPin size={22} color={SECTION_ICON_COLOR} /> Address Information
        </div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
            {addresses.length === 0 ? (
              <div className={addStyles.emptyState}>No addresses on file.</div>
            ) : (
              <div className={addStyles.itemGrid}>
                {addresses.map((a, idx) => (
                  <div key={(a._id as string) || idx} className={addStyles.itemCard}>
                    <div className={addStyles.itemHeader}>
                      <span className={addStyles.itemTitle}>{displayValue(a.title) !== "—" ? String(a.title) : `Address ${idx + 1}`}</span>
                    </div>
                    <div className={addStyles.itemContent}>
                      {a.street ? <div>{String(a.street)}</div> : null}
                      {Boolean(a.city || a.state || a.zip) && (
                        <div>
                          {[a.city, a.state, a.zip]
                            .filter((part) => part != null && String(part).trim() !== "")
                            .map(String)
                            .join(", ")}
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
          <FileText size={22} color={SECTION_ICON_COLOR} /> Notes
        </div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
            {notes.length === 0 ? (
              <div className={addStyles.emptyState}>No notes on file.</div>
            ) : (
              <div className={addStyles.itemGrid}>
                {notes.map((n, idx) => (
                  <div key={(n._id as string) || idx} className={addStyles.itemCard}>
                    <div className={addStyles.itemHeader}>
                      <span className={addStyles.itemTitle}>
                        {displayValue(n.title) !== "—" ? String(n.title) : `Note ${idx + 1}`}
                      </span>
                      {n.createdAt ? (
                        <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
                          {formatDateTime(n.createdAt)}
                        </span>
                      ) : null}
                    </div>
                    <div className={addStyles.itemContent}>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.35rem" }}>
                        By {formatNoteAuthorLabel(n)}
                      </div>
                      {displayValue(n.note)}
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
          <Calendar size={22} color={SECTION_ICON_COLOR} /> Activities
        </div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
            {activities.length === 0 ? (
              <div className={addStyles.emptyState}>No activities recorded.</div>
            ) : (
              <div className={addStyles.itemGrid}>
                {activities.map((activity, idx) => (
                  <div key={(activity._id as string) || idx} className={addStyles.itemCard}>
                    <div className={addStyles.itemHeader}>
                      <span className={addStyles.itemTitle}>
                        {displayValue(activity.activityType) !== "—"
                          ? String(activity.activityType)
                          : "Activity"}
                      </span>
                      {activity.date || activity.createdAt ? (
                        <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
                          {formatDateTime(activity.date || activity.createdAt)}
                        </span>
                      ) : null}
                    </div>
                    <div className={addStyles.itemContent}>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.35rem" }}>
                        By {formatActivityUser(activity)}
                      </div>
                      {displayValue(activity.outcome) !== "—" ? (
                        <div>
                          <strong>Outcome:</strong> {displayValue(activity.outcome)}
                        </div>
                      ) : null}
                      {displayValue(activity.notes) !== "—" ? (
                        <div style={{ marginTop: "0.25rem", whiteSpace: "pre-wrap" }}>
                          {displayValue(activity.notes)}
                        </div>
                      ) : null}
                      {displayValue(activity.location) !== "—" ? (
                        <div style={{ marginTop: "0.25rem", fontSize: "0.85rem", color: "#64748b" }}>
                          Location: {displayValue(activity.location)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

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
