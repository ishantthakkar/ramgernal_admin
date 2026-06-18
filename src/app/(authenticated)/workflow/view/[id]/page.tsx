"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import styles from "../../../dashboard.module.css";
import modalStyles from "../../workflow-details.module.css";
import {
  Loader2,
  X,
  ClipboardCheck,
  Image as ImageIcon,
  Download,
  FileText,
  Hammer,
  Edit2,
  Info,
  User,
  Briefcase,
  UserPlus,
} from "lucide-react";
import addStyles from "../../../leads/add/leads-add.module.css";
import assignModalStyles from "../../assign-modal.module.css";
import { adminApi } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { toast } from "react-toastify";
import { formatDate, formatNoteListDateTime } from "@/lib/dateUtils";
import { SiteSurveyVerifyControl } from "@/components/workflow/site-survey-verify-control";
import {
  mapNotes,
  mapSiteDetailGroups,
  mapSurveyDetails,
  type NoteEntry,
  type SiteDetailRow,
  type SiteDetailSurveyGroup,
} from "@/lib/workflow-survey-view";
import {
  resolveInstallationSurvey,
  resolveSurveyContractorName,
  resolveSurveyProjectManagerName,
  resolveSurveySalesPersonName,
} from "@/lib/workflow-installation-details";
import { InstallationWorkflowSections } from "@/components/workflow/installation-workflow-sections";

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  const display = value?.trim() || "—";
  return (
    <div className={styles.formGroup}>
      <label>{label}</label>
      <div
        className={styles.formInput}
        style={{
          background: "#f8fafc",
          color: display === "—" ? "#94a3b8" : "#1e293b",
          fontWeight: 600,
          border: "1px solid #e2e8f0",
          minHeight: "2.75rem",
          display: "flex",
          alignItems: "center",
        }}
      >
        {display}
      </div>
    </div>
  );
}

function AssignableField({
  label,
  assignedName,
  canAssign,
  onAssign,
}: {
  label: string;
  assignedName: string;
  canAssign: boolean;
  onAssign: () => void;
}) {
  const name = assignedName.trim();

  return (
    <div className={styles.formGroup}>
      <label>{label}</label>
      {name ? (
        <div
          className={styles.formInput}
          style={{
            background: "#f8fafc",
            color: "#1e293b",
            fontWeight: 600,
            border: "1px solid #e2e8f0",
            minHeight: "2.75rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          {name}
        </div>
      ) : canAssign ? (
        <button
          type="button"
          className={styles.assignBtn}
          onClick={onAssign}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
        >
          <UserPlus size={14} /> Assign
        </button>
      ) : (
        <div
          className={styles.formInput}
          style={{
            background: "#f8fafc",
            color: "#94a3b8",
            fontWeight: 600,
            border: "1px solid #e2e8f0",
            minHeight: "2.75rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          Unassigned
        </div>
      )}
    </div>
  );
}

function getSurveyStatusColor(status: string): string {
  const s = (status || "").toLowerCase();
  if (s === "completed") return "#64748b";
  if (s === "verified") return "#10b981";
  if (s === "pending_edit_approval") return "#d97706";
  if (s === "reopened" || s === "reopen") return "#f59e0b";
  if (s === "pending" || s === "not started") return "#ef4444";
  if (s === "in progress" || s === "in-process") return "#3b82f6";
  return "#64748b";
}

function formatSurveyStatusLabel(status: string): string {
  if (status === "pending_edit_approval") return "Pending Approval";
  if (status === "reopen" || status === "reopened") return "Reopened";
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

function formatPriceDisplay(value: string): string {
  if (!value || value === "—") return "—";
  return `${value} $`;
}

function formatHeightPart(value: string): string {
  const text = value?.trim();
  if (!text || text === "N/A") return "—";
  return text;
}

function HeightReadOnlyField({
  heightFt,
  heightIn,
}: {
  heightFt: string;
  heightIn: string;
}) {
  const ftDisplay = formatHeightPart(heightFt);
  const inDisplay = formatHeightPart(heightIn);

  return (
    <div className={styles.formGroup}>
      <label>Height</label>
      <div className={modalStyles.heightFieldRow}>
        <div
          className={modalStyles.heightFieldValue}
          style={{ color: ftDisplay === "—" ? "#94a3b8" : "#1e293b" }}
        >
          <span>{ftDisplay}</span>
          <span className={modalStyles.heightFieldUnit}>FT</span>
        </div>
        <div
          className={modalStyles.heightFieldValue}
          style={{ color: inDisplay === "—" ? "#94a3b8" : "#1e293b" }}
        >
          <span>{inDisplay}</span>
          <span className={modalStyles.heightFieldUnit}>IN</span>
        </div>
      </div>
    </div>
  );
}

function SiteRoomCard({
  row,
  roomIndex,
  onViewImages,
}: {
  row: SiteDetailRow;
  roomIndex: number;
  onViewImages: (images: string[], area: string) => void;
}) {
  const previewImages = row.images.slice(0, 4);
  const hasMoreImages = row.images.length > previewImages.length;

  const roomLabel = row.area?.trim() ? row.area : `Room ${roomIndex + 1}`;

  return (
    <article className={modalStyles.siteRoomCard}>
      <h4 className={modalStyles.siteRoomTitle}>{roomLabel}</h4>
      <div className={styles.formGrid}>
        <ReadOnlyField label="Existing Fixture Type" value={row.existingFixtureType} />
        <HeightReadOnlyField heightFt={row.heightFt} heightIn={row.heightIn} />
        <ReadOnlyField label="Existing Bulb" value={row.existingBulbs} />
        <ReadOnlyField label="Existing Quantity" value={row.existingQuantity} />
      </div>

      <div className={`${styles.formGroup} ${modalStyles.siteMediaBlock}`}>
        <label>Images / Videos</label>
        {row.images.length > 0 ? (
          <div className={modalStyles.siteMediaGrid}>
            {previewImages.map((img, idx) => (
              <button
                key={`${row._id}-img-${idx}`}
                type="button"
                className={modalStyles.siteMediaThumb}
                onClick={() => onViewImages(row.images, row.area)}
                title="View all images"
              >
                <img src={img} alt={`${row.area} ${idx + 1}`} />
              </button>
            ))}
            {hasMoreImages && (
              <button
                type="button"
                className={modalStyles.siteMediaMore}
                onClick={() => onViewImages(row.images, row.area)}
              >
                +{row.images.length - previewImages.length}
              </button>
            )}
          </div>
        ) : (
          <div
            className={styles.formInput}
            style={{
              background: "#f8fafc",
              color: "#94a3b8",
              fontWeight: 600,
              border: "1px solid #e2e8f0",
              minHeight: "2.75rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            No images
          </div>
        )}
      </div>

      <div className={styles.formGrid}>
        <ReadOnlyField label="Proposed Fixture" value={row.proposedFixture} />
        <ReadOnlyField label="Proposed Quantity" value={row.proposedQuantity} />
        <ReadOnlyField label="Price Per Unit" value={formatPriceDisplay(row.pricePerUnit)} />
        <ReadOnlyField label="Total Price" value={formatPriceDisplay(row.totalPrice)} />
        <div style={{ gridColumn: "1 / -1" }}>
          <ReadOnlyField label="Note" value={row.note} />
        </div>
      </div>
    </article>
  );
}

function formatNoteMeta(authorName: string | undefined, timestamp: string | null): string {
  const parts: string[] = [];
  if (authorName?.trim()) {
    parts.push(authorName.trim().toUpperCase());
  }
  if (timestamp) {
    const formatted = formatNoteListDateTime(timestamp);
    if (formatted) parts.push(formatted);
  }
  return parts.join(", ");
}

function NotesList({ entries }: { entries: NoteEntry[] }) {
  if (!entries.length) {
    return <div className={addStyles.emptyState}>No notes on file.</div>;
  }

  return (
    <div className={modalStyles.notesList}>
      {entries.map((entry, index) => {
        const title = (entry.title || (entry.source === "survey" ? "Survey Note" : "Note")).trim();
        const meta = formatNoteMeta(entry.authorName, entry.timestamp);

        return (
          <article key={entry.id} className={modalStyles.noteListItem}>
            <div className={modalStyles.noteListHeader}>
              <h4 className={modalStyles.noteListTitle}>
                {index + 1}. {title.toUpperCase()}
              </h4>
              {meta ? <span className={modalStyles.noteListMeta}>{meta}</span> : null}
            </div>
            <p className={modalStyles.noteListBody}>{entry.text}</p>
          </article>
        );
      })}
    </div>
  );
}

function SiteSurveyList({
  groups,
  canVerify,
  verifyingSurveyId,
  onSelectSurvey,
  onVerifySurvey,
}: {
  groups: SiteDetailSurveyGroup[];
  canVerify: boolean;
  verifyingSurveyId: string | null;
  onSelectSurvey: (group: SiteDetailSurveyGroup) => void;
  onVerifySurvey: (surveyId: string, surveyName: string) => void;
}) {
  if (!groups.length) {
    return <div className={addStyles.emptyState}>No site survey details found.</div>;
  }

  return (
    <div className={modalStyles.siteSurveyList}>
      {groups.map((group) => (
        <div key={group.surveyId} className={modalStyles.siteSurveyListItem}>
          <button
            type="button"
            className={modalStyles.siteSurveyListMainBtn}
            onClick={() => onSelectSurvey(group)}
          >
            <h4 className={modalStyles.siteSurveyListName}>{group.surveyName}</h4>
            <p className={modalStyles.siteSurveyListDate}>
              {group.surveyDate ? formatDate(group.surveyDate) : "—"}
            </p>
            {group.areasSummary ? (
              <p className={modalStyles.siteSurveyListAreas}>Areas: {group.areasSummary}</p>
            ) : null}
          </button>
          <div className={modalStyles.siteSurveyListActions}>
            <SiteSurveyVerifyControl
              surveyId={group.surveyId}
              surveyName={group.surveyName}
              isVerified={group.isVerified}
              canVerify={canVerify}
              verifying={verifyingSurveyId === group.surveyId}
              onVerify={onVerifySurvey}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SiteSurveyDetailModal({
  group,
  onClose,
  onViewImages,
}: {
  group: SiteDetailSurveyGroup | null;
  onClose: () => void;
  onViewImages: (images: string[], area: string) => void;
}) {
  if (!group) return null;

  return (
    <div className={modalStyles.imgModalOverlay} onClick={onClose}>
      <div
        className={modalStyles.imgModalContent}
        style={{ maxWidth: 920 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={modalStyles.imgModalHeader}>
          <div>
            <h3>{group.surveyName}</h3>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
              {group.surveyDate ? formatDate(group.surveyDate) : "—"}
              {group.areasSummary ? ` · Areas: ${group.areasSummary}` : ""}
            </p>
          </div>
          <button type="button" className={modalStyles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className={modalStyles.siteSurveyDetailModalBody}>
          {group.areas.length > 0 ? (
            <div className={modalStyles.siteDetailsStack}>
              {group.areas.map((row, roomIndex) => (
                <SiteRoomCard
                  key={row._id}
                  row={row}
                  roomIndex={roomIndex}
                  onViewImages={onViewImages}
                />
              ))}
            </div>
          ) : (
            <div className={addStyles.emptyState}>No area details found for this survey.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function SurveyViewSections({
  surveyName,
  salesPerson,
  surveyDate,
  siteDetailGroups,
  noteEntries,
  canVerify,
  verifyingSurveyId,
  onVerifySurvey,
  onViewImages,
}: {
  surveyName: string;
  salesPerson: string;
  surveyDate: string | null;
  siteDetailGroups: SiteDetailSurveyGroup[];
  noteEntries: NoteEntry[];
  canVerify: boolean;
  verifyingSurveyId: string | null;
  onVerifySurvey: (surveyId: string, surveyName: string) => void;
  onViewImages: (images: string[], area: string) => void;
}) {
  const [selectedSurveyGroup, setSelectedSurveyGroup] =
    useState<SiteDetailSurveyGroup | null>(null);

  return (
    <>
      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <Info size={22} color="var(--admin-primary, #004d4d)" /> Survey Details
        </div>
        <div className={styles.formGrid}>
          <ReadOnlyField label="Survey Name" value={surveyName} />
          <ReadOnlyField label="Sales Person Name" value={salesPerson} />
          <ReadOnlyField
            label="Survey Date"
            value={surveyDate ? formatDate(surveyDate) : "—"}
          />
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <ClipboardCheck size={22} color="var(--admin-primary, #004d4d)" /> Site Details
        </div>
        <p className={styles.sectionSubtitle}>
          Select a survey to view fixtures, quantities, pricing, and images.
        </p>
        <SiteSurveyList
          groups={siteDetailGroups}
          canVerify={canVerify}
          verifyingSurveyId={verifyingSurveyId}
          onSelectSurvey={setSelectedSurveyGroup}
          onVerifySurvey={onVerifySurvey}
        />
        <SiteSurveyDetailModal
          group={selectedSurveyGroup}
          onClose={() => setSelectedSurveyGroup(null)}
          onViewImages={onViewImages}
        />
      </section>

      <section className={styles.formSection}>
        <div className={modalStyles.notesSectionTitle}>
          <span className={modalStyles.notesSectionIcon} aria-hidden>
            <FileText size={22} color="#ea580c" strokeWidth={2} />
          </span>
          Notes
        </div>
        <NotesList entries={noteEntries} />
      </section>
    </>
  );
}

export default function WorkflowViewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const searchParams = useSearchParams();
  const fromTab = searchParams.get("from");

  const [loading, setLoading] = useState(true);
  const [verifyingSurveyId, setVerifyingSurveyId] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [selectedImages, setSelectedImages] = useState<string[] | null>(null);
  const [activeArea, setActiveArea] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"survey" | "installations">(
    fromTab?.toLowerCase() === "installations" ? "installations" : "survey"
  );
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignType, setAssignType] = useState<"Contractor" | "Project Manager">("Contractor");
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [assignModalLoading, setAssignModalLoading] = useState(false);

  const isSurveyView = fromTab === "Surveys";
  const isInstallationView = fromTab === "Installations";
  const surveyId = isInstallationView ? id : "";

  const refreshData = async () => {
    const result = isInstallationView
      ? await adminApi.getInstallationWorkflowDetails(id)
      : await adminApi.getCustomerWorkflowDetails(id);
    setData(result);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await refreshData();
      } catch (err: any) {
        toast.error(err.message || "Failed to load workflow details.");
        router.push("/workflow");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, router, isInstallationView]);

  const surveyRecords = useMemo(() => {
    if (isInstallationView && data?.survey) {
      return [data.survey];
    }
    const list = data?.surveys;
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.surveyDate || 0).getTime();
      const timeB = new Date(b.createdAt || b.surveyDate || 0).getTime();
      return timeA - timeB;
    });
  }, [data, isInstallationView]);

  const surveyDetails = useMemo(() => {
    if (!data?.customer) {
      return { surveyName: "N/A", salesPerson: "N/A", surveyDate: null as string | null };
    }
    return mapSurveyDetails(data.customer, surveyRecords);
  }, [data, surveyRecords]);

  const siteDetailGroups = useMemo(
    () => mapSiteDetailGroups(surveyRecords, data?.customer),
    [surveyRecords, data?.customer]
  );

  const noteEntries = useMemo(() => {
    if (!data?.customer) return [];
    return mapNotes(surveyRecords, data.customer);
  }, [data, surveyRecords]);

  const installationSurvey = useMemo(() => {
    if (isInstallationView && data?.survey) {
      return data.survey as Record<string, unknown>;
    }
    return resolveInstallationSurvey(surveyRecords);
  }, [data, isInstallationView, surveyRecords]);

  const handleViewImages = (images: string[], area: string) => {
    setSelectedImages(images);
    setActiveArea(area);
  };

  const openAssignModal = async (type: "Contractor" | "Project Manager") => {
    if (!surveyId) {
      toast.error("Survey not found.");
      return;
    }

    setAssignType(type);
    setShowAssignModal(true);
    setAssignModalLoading(true);
    setAvailableStaff([]);

    try {
      const apiRole = type === "Contractor" ? "Contractor" : "Project Manager";
      const response = await adminApi.getUserList(apiRole);
      const staff = response.users || response.data || [];
      setAvailableStaff(Array.isArray(staff) ? staff : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : `Failed to load ${type.toLowerCase()}s.`;
      toast.error(message);
    } finally {
      setAssignModalLoading(false);
    }
  };

  const handleAssignStaff = async (staff: { _id: string }) => {
    if (!surveyId) {
      toast.error("Survey not found.");
      return;
    }

    try {
      setAssignModalLoading(true);
      const response = await adminApi.assignSurvey(surveyId, staff._id);
      toast.success(response.message || `${assignType} assigned successfully.`);
      setShowAssignModal(false);
      await refreshData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : `Failed to assign ${assignType}.`;
      toast.error(message);
    } finally {
      setAssignModalLoading(false);
    }
  };

  const handleVerifySurvey = async (surveyId: string, surveyName: string) => {
    if (!window.confirm(`Are you sure you want to verify "${surveyName}"?`)) {
      return;
    }

    try {
      setVerifyingSurveyId(surveyId);
      const response = await adminApi.verifySurveyConfirm(surveyId);
      toast.success(response.message || "Survey verified successfully!");
      await refreshData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to verify survey.";
      toast.error(message);
    } finally {
      setVerifyingSurveyId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className={styles.spinner} />
      </div>
    );
  }

  if (!data?.customer) return null;

  const { customer } = data;
  const canEditSurveys = hasPermission("Surveys", "edit");
  const canEditInstallations = hasPermission("Installation", "edit");
  const canCreateInstallations = hasPermission("Installation", "create");
  const canVerifySurveys = hasPermission("Surveys", "create");
  const workflowTab = fromTab || (isSurveyView ? "Surveys" : "Installations");
  const backUrl = `/workflow?tab=${workflowTab}`;
  const surveyStatus = customer.status || "Pending";
  const statusColor = getSurveyStatusColor(surveyStatus);
  const displayName =
    customer.name?.trim() ||
    (surveyDetails.surveyName !== "N/A" ? surveyDetails.surveyName : "Survey");

  const legalName = String(customer.legalName || customer.name || "").trim();
  const companyOrDba = String(customer.company || customer.dba || customer?.leadId?.dba || "").trim();
  const salesPerson = isInstallationView
    ? resolveSurveySalesPersonName(installationSurvey, customer)
    : String(customer?.user_id?.fullName || customer?.user_id?.name || "").trim();
  const contractorName = resolveSurveyContractorName(installationSurvey);
  const projectManagerName = resolveSurveyProjectManagerName(installationSurvey);
  const jobId = String(installationSurvey?.job_id || "").trim();

  const primaryAddress = (() => {
    const list = Array.isArray(customer?.addresses) ? customer.addresses : [];
    if (!list.length) return null;
    const sorted = [...list].sort((a: any, b: any) => {
      const timeA = new Date(a?.createdAt || 0).getTime();
      const timeB = new Date(b?.createdAt || 0).getTime();
      return timeB - timeA;
    });
    return sorted[0] || null;
  })();
  const installStreet = String(primaryAddress?.street || "").trim();
  const installCity = String(primaryAddress?.city || "").trim();
  const installState = String(primaryAddress?.state || "").trim();
  const installZip = String(primaryAddress?.zip || "").trim();

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push(backUrl)}>
          WORKFLOW
        </span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>
          {isSurveyView ? "VIEW SURVEY" : isInstallationView ? "VIEW INSTALLATION" : "VIEW WORKFLOW"}
        </span>
      </div>

      <div className={styles.pageHeader} style={{ marginBottom: isSurveyView ? "2rem" : undefined }}>
        <div>
          <h1 className={styles.welcomeText}>
            {isSurveyView
              ? `Survey Profile: ${displayName}`
              : isInstallationView
                ? `Installation: ${displayName}`
                : "Workflow Details"}
          </h1>
          {isSurveyView && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
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
                {formatSurveyStatusLabel(surveyStatus)}
              </span>
              {customer.verifyStatus === "verified" ? (
                <span
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.12)",
                    color: "#10b981",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "99px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Verified
                  {customer.confirmDate
                    ? ` · ${formatDate(customer.confirmDate)}`
                    : ""}
                </span>
              ) : null}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {isSurveyView && canEditSurveys && (
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => router.push(`/workflow/edit/${id}?from=Surveys`)}
            >
              <Edit2 size={20} /> Edit
            </button>
          )}
          {!isSurveyView && fromTab === "Installations" && canEditInstallations && (
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => router.push(`/workflow/edit/${id}?from=Installations`)}
            >
              <Edit2 size={20} /> Edit
            </button>
          )}
        </div>
      </div>

      {isInstallationView ? (
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <Briefcase size={22} color="var(--admin-primary, #004d4d)" /> Project Information
          </div>
          <div className={styles.formGrid}>
            <ReadOnlyField label="Legal Name" value={legalName} />
            <ReadOnlyField label="Company" value={companyOrDba} />
            <ReadOnlyField label="Sales Person" value={salesPerson} />
            <AssignableField
              label="Contractor"
              assignedName={contractorName}
              canAssign={canCreateInstallations}
              onAssign={() => openAssignModal("Contractor")}
            />
            <AssignableField
              label="Project Manager"
              assignedName={projectManagerName}
              canAssign={canCreateInstallations}
              onAssign={() => openAssignModal("Project Manager")}
            />
            <ReadOnlyField label="Job ID" value={jobId} />
          </div>
        </section>
      ) : (
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <User size={22} color="var(--admin-primary, #004d4d)" /> Customer Information
          </div>
          <div className={styles.formGrid}>
            <ReadOnlyField label="Legal Name" value={legalName} />
            <ReadOnlyField label="Company (DBA)" value={companyOrDba} />
            <ReadOnlyField label="Sales Person" value={salesPerson} />
          </div>
        </section>
      )}

      {!isSurveyView && !isInstallationView && (
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <Hammer size={22} color="var(--admin-primary, #004d4d)" /> Installation
          </div>
          <div className={styles.formGrid}>
            <ReadOnlyField label="Company" value={companyOrDba} />
            <ReadOnlyField label="Street" value={installStreet} />
            <ReadOnlyField label="City" value={installCity} />
            <ReadOnlyField label="State" value={installState} />
            <ReadOnlyField label="Zip" value={installZip} />
          </div>
        </section>
      )}

      {isInstallationView && (
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <Hammer size={22} color="var(--admin-primary, #004d4d)" /> Installation Address
          </div>
          <div className={styles.formGrid}>
            <ReadOnlyField label="Street" value={installStreet} />
            <ReadOnlyField label="City" value={installCity} />
            <ReadOnlyField label="State" value={installState} />
            <ReadOnlyField label="Zip" value={installZip} />
          </div>
        </section>
      )}

      {!isSurveyView && !isInstallationView && (
        <div
          className={styles.tabs}
          style={{ marginBottom: "2rem", width: "fit-content", background: "#f1f5f9", padding: "4px", borderRadius: "10px" }}
        >
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "survey" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("survey")}
            style={{ border: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <ClipboardCheck size={18} /> Survey
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "installations" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("installations")}
            style={{ border: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Hammer size={18} /> Installations
          </button>
        </div>
      )}

      {isInstallationView ? (
        <InstallationWorkflowSections
          installationSurvey={installationSurvey}
          mode="view"
          onViewImages={handleViewImages}
        />
      ) : isSurveyView || activeTab === "survey" ? (
        <SurveyViewSections
          surveyName={surveyDetails.surveyName}
          salesPerson={surveyDetails.salesPerson}
          surveyDate={surveyDetails.surveyDate}
          siteDetailGroups={siteDetailGroups}
          noteEntries={noteEntries}
          canVerify={isSurveyView && canVerifySurveys}
          verifyingSurveyId={verifyingSurveyId}
          onVerifySurvey={handleVerifySurvey}
          onViewImages={handleViewImages}
        />
      ) : (
        <InstallationWorkflowSections
          installationSurvey={installationSurvey}
          mode="view"
          onViewImages={handleViewImages}
        />
      )}

      {showAssignModal && (
        <div className={assignModalStyles.modalOverlay} onClick={() => setShowAssignModal(false)}>
          <div className={assignModalStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={assignModalStyles.modalHeader}>
              <h3>Assign {assignType}</h3>
              <button type="button" className={assignModalStyles.closeBtn} onClick={() => setShowAssignModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className={assignModalStyles.modalBody}>
              {assignModalLoading ? (
                <div className={assignModalStyles.modalLoading}>
                  <Loader2 size={40} className={assignModalStyles.spinner} />
                  <p>Fetching available {assignType.toLowerCase()}s...</p>
                </div>
              ) : availableStaff.length === 0 ? (
                <div className={assignModalStyles.emptyState}>
                  <p>No {assignType.toLowerCase()}s found in the system.</p>
                </div>
              ) : (
                <div className={assignModalStyles.staffList}>
                  {availableStaff.map((staff) => (
                    <div key={staff._id} className={assignModalStyles.staffItem}>
                      <div className={assignModalStyles.staffLeft}>
                        <div className={assignModalStyles.staffAvatar}>
                          {staff.fullName?.charAt(0) || "U"}
                        </div>
                        <div className={assignModalStyles.staffInfo}>
                          <span className={assignModalStyles.staffName}>{staff.fullName}</span>
                          <span className={assignModalStyles.staffRole}>{staff.userRole || assignType}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={assignModalStyles.modalAssignBtn}
                        onClick={() => handleAssignStaff(staff)}
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        className={styles.actionFooter}
        style={{ background: "#f1f5f9", padding: "2.5rem", borderRadius: "16px", marginTop: "3rem", justifyContent: "flex-end" }}
      >
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => router.push(backUrl)}
          style={{ padding: "0.875rem 3rem", background: "#64748b", color: "#ffffff" }}
        >
          <X size={20} /> Close
        </button>
      </div>

      {selectedImages && (
        <div className={modalStyles.imgModalOverlay} onClick={() => setSelectedImages(null)}>
          <div className={modalStyles.imgModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={modalStyles.imgModalHeader}>
              <div>
                <h3>Survey Images</h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
                  Area: <span style={{ color: "#1e293b", fontWeight: 700 }}>{activeArea}</span>
                </p>
              </div>
              <button type="button" className={modalStyles.closeBtn} onClick={() => setSelectedImages(null)}>
                <X size={20} />
              </button>
            </div>
            <div className={modalStyles.imgModalBody}>
              <div className={modalStyles.modalImageGrid}>
                {selectedImages.map((img, idx) => (
                  <div key={idx} className={modalStyles.modalImageWrapper}>
                    <img src={img} alt={`Survey ${idx}`} />
                    <a
                      href={img}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className={modalStyles.downloadIconOverlay}
                      title="Download Image"
                    >
                      <Download size={18} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
