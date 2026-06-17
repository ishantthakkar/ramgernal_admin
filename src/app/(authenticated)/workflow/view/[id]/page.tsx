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
} from "lucide-react";
import addStyles from "../../../leads/add/leads-add.module.css";
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

function resolveUploadsBaseUrl(): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
  if (!base) return "";
  return base.replace(/\/api\/?$/i, "");
}

function resolveMaterialImageUrl(value: string): string {
  const filename = String(value || "").replace(/^\//, "");
  if (!filename) return "";
  if (filename.startsWith("http")) return filename;
  const base = resolveUploadsBaseUrl();
  if (!base) return filename;
  return `${base}/uploads/materials/${filename}`;
}

function normalizeDeliveryStatus(value: string): string {
  return String(value || "").trim().toLowerCase();
}

function getDeliveryStatusStyle(value: string): { color: string; bg: string } {
  const status = normalizeDeliveryStatus(value);
  if (status === "delivered") return { color: "#16a34a", bg: "#dcfce7" };
  if (status === "scheduled") return { color: "#2563eb", bg: "#dbeafe" };
  if (status === "approved") return { color: "#0ea5e9", bg: "#e0f2fe" };
  if (status === "cancelled") return { color: "#ef4444", bg: "#fee2e2" };
  return { color: "#64748b", bg: "#f1f5f9" };
}

function formatDeliveryStatusLabel(value: string): string {
  const status = normalizeDeliveryStatus(value);
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

function buildMaterialSummaryFromSurvey(survey: any) {
  const deliveries = Array.isArray(survey?.materialDelivery) ? survey.materialDelivery : [];
  const issuedBySku = new Map<string, number>();
  const usedBySku = new Map<string, number>();

  for (const delivery of deliveries) {
    for (const item of delivery?.items || []) {
      const sku = String(item?.sku ?? "").trim();
      if (!sku) continue;
      const issuedQty = Number(item?.issued_qty ?? item?.issuedQty ?? 0) || 0;
      issuedBySku.set(sku, (issuedBySku.get(sku) || 0) + issuedQty);
    }
  }

  const areas = Array.isArray(survey?.areas) ? survey.areas : [];
  for (const area of areas) {
    for (const fixture of area?.fixtures || []) {
      const sku = String(
        fixture?.product?.sku ??
          fixture?.product?.name ??
          fixture?.existingFixtureType ??
          ""
      ).trim();
      if (!sku) continue;
      const installedQty = Number(fixture?.report?.installed_qty ?? 0) || 0;
      usedBySku.set(sku, (usedBySku.get(sku) || 0) + installedQty);
    }
  }

  const allSkus = new Set([...issuedBySku.keys(), ...usedBySku.keys()]);
  return Array.from(allSkus).map((sku) => {
    const issued = issuedBySku.get(sku) || 0;
    const used = usedBySku.get(sku) || 0;
    const remaining = Math.max(issued - used, 0);
    return { sku, issued, used, remaining };
  });
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

  const isSurveyView = fromTab === "Surveys";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await adminApi.getCustomerWorkflowDetails(id);
        setData(result);
      } catch (err: any) {
        toast.error(err.message || "Failed to load workflow details.");
        router.push("/workflow");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, router]);

  const surveyRecords = useMemo(() => {
    const list = data?.surveys;
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.surveyDate || 0).getTime();
      const timeB = new Date(b.createdAt || b.surveyDate || 0).getTime();
      return timeA - timeB;
    });
  }, [data]);

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
    const sorted = [...surveyRecords].sort((a, b) => {
      const timeA = new Date(a.quotationApprovedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.quotationApprovedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
    return (
      sorted.find((survey) => String(survey?.quotationStatus || "").toLowerCase() === "approved") ||
      sorted[0] ||
      null
    );
  }, [surveyRecords]);

  const isMaterialsVerified = useMemo(() => {
    const deliveries = Array.isArray(installationSurvey?.materialDelivery)
      ? installationSurvey.materialDelivery
      : [];
    if (!deliveries.length) return false;
    return deliveries.some(
      (delivery: any) => normalizeDeliveryStatus(delivery?.deliveryStatus) === "delivered"
    );
  }, [installationSurvey]);

  const handleViewImages = (images: string[], area: string) => {
    setSelectedImages(images);
    setActiveArea(area);
  };

  const handleVerifySurvey = async (surveyId: string, surveyName: string) => {
    if (!window.confirm(`Are you sure you want to verify "${surveyName}"?`)) {
      return;
    }

    try {
      setVerifyingSurveyId(surveyId);
      const response = await adminApi.verifySurveyConfirm(surveyId);
      toast.success(response.message || "Survey verified successfully!");
      const result = await adminApi.getCustomerWorkflowDetails(id);
      setData(result);
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
  const isContractorAssigned = !!(customer.assignToContractor || customer.contractorName || customer.contractor);
  const canEditSurveys = hasPermission("Surveys", "edit");
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
  const salesPerson = String(customer?.user_id?.fullName || customer?.user_id?.name || "").trim();

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
          {isSurveyView ? "VIEW SURVEY" : "VIEW WORKFLOW"}
        </span>
      </div>

      <div className={styles.pageHeader} style={{ marginBottom: isSurveyView ? "2rem" : undefined }}>
        <div>
          <h1 className={styles.welcomeText}>
            {isSurveyView ? `Survey Profile: ${displayName}` : "Workflow Details"}
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
        </div>
      </div>

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

      {!isSurveyView && (
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

      {!isSurveyView && fromTab !== "Installations" && fromTab !== "Surveys" && (
        <div
          className={styles.tabs}
          style={{ marginBottom: "2rem", width: "fit-content", background: "#f1f5f9", padding: "4px", borderRadius: "10px" }}
        >
          {fromTab !== "Installations" && (
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "survey" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("survey")}
              style={{ border: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <ClipboardCheck size={18} /> Survey
            </button>
          )}
          {fromTab !== "Surveys" && (
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "installations" ? styles.tabActive : ""}`}
              onClick={() => {
                if (isContractorAssigned) setActiveTab("installations");
                else toast.warning("Materials are only available after contractor assignment.");
              }}
              style={{
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                opacity: isContractorAssigned ? 1 : 0.5,
                cursor: isContractorAssigned ? "pointer" : "not-allowed",
              }}
            >
              <Hammer size={18} /> Installations
            </button>
          )}
        </div>
      )}

      {isSurveyView || activeTab === "survey" ? (
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
        <>
          <section className={styles.formSection}>
            <div className={styles.sectionTitle} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Hammer size={22} color="var(--admin-primary, #004d4d)" /> Installation Details
              </div>
              {isMaterialsVerified ? (
                <span
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.12)",
                    color: "#10b981",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "999px",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    whiteSpace: "nowrap",
                  }}
                >
                  Materials Verified
                </span>
              ) : null}
            </div>
            <p className={styles.sectionSubtitle}>
              Scheduled / delivered materials for this installation (from survey deliveries).
            </p>

            {installationSurvey?.materialDelivery?.length > 0 ? (
              <div className={styles.userTableContainer} style={{ marginTop: "0.5rem" }}>
                <table className={styles.userTable}>
                  <thead>
                    <tr>
                      <th style={{ width: "80px" }}>Sr. No</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Items</th>
                      <th>Note</th>
                      <th>Images</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installationSurvey.materialDelivery.map((delivery: any, index: number) => {
                      const statusStyle = getDeliveryStatusStyle(delivery?.deliveryStatus);
                      const items = Array.isArray(delivery?.items) ? delivery.items : [];
                      const images = Array.isArray(delivery?.images) ? delivery.images : [];
                      const resolvedImages = images
                        .map((img: string) => resolveMaterialImageUrl(String(img || "")))
                        .filter(Boolean);

                      return (
                        <tr key={delivery?._id || `${delivery?.date}-${index}`}>
                          <td style={{ fontWeight: 600, color: "#94a3b8" }}>{index + 1}</td>
                          <td style={{ fontWeight: 600, color: "#1e293b" }}>
                            {delivery?.date ? formatDate(delivery.date) : "—"}
                          </td>
                          <td style={{ fontWeight: 600, color: "#64748b" }}>
                            {String(delivery?.time || "").trim() || "—"}
                          </td>
                          <td>
                            <span
                              style={{
                                backgroundColor: statusStyle.bg,
                                color: statusStyle.color,
                                padding: "0.25rem 0.75rem",
                                borderRadius: "999px",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                textTransform: "uppercase",
                              }}
                            >
                              {formatDeliveryStatusLabel(delivery?.deliveryStatus)}
                            </span>
                          </td>
                          <td style={{ color: "#1e293b", fontWeight: 600 }}>
                            {items.length > 0 ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                {items.map((item: any, idx: number) => (
                                  <div key={`${item?.sku || "item"}-${idx}`}>
                                    <span style={{ fontFamily: "ui-monospace, monospace" }}>
                                      {String(item?.sku || "—")}
                                    </span>{" "}
                                    · <span style={{ fontWeight: 800 }}>{Number(item?.issued_qty ?? 0) || 0}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: "#94a3b8" }}>—</span>
                            )}
                          </td>
                          <td style={{ color: "#64748b", fontWeight: 500 }}>
                            {String(delivery?.note || "").trim() || "—"}
                          </td>
                          <td>
                            {resolvedImages.length > 0 ? (
                              <button
                                type="button"
                                className={modalStyles.viewImgBtn}
                                onClick={() => handleViewImages(resolvedImages, "Material Delivery")}
                              >
                                View ({resolvedImages.length})
                              </button>
                            ) : (
                              <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>No image</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={addStyles.emptyState}>No material delivery records found.</div>
            )}
          </section>

          <section className={styles.formSection}>
            <div className={styles.sectionTitle}>
              <ClipboardCheck size={22} color="var(--admin-primary, #004d4d)" /> Material Return
            </div>
            <p className={styles.sectionSubtitle}>Items returned from site.</p>

            {installationSurvey?.materialDeliveryReturn?.length > 0 ? (
              <div className={styles.userTableContainer} style={{ marginTop: "0.5rem" }}>
                <table className={styles.userTable}>
                  <thead>
                    <tr>
                      <th style={{ width: "80px" }}>Sr. No</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Items</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installationSurvey.materialDeliveryReturn.map((entry: any, index: number) => {
                      const items = Array.isArray(entry?.items) ? entry.items : [];
                      return (
                        <tr key={entry?._id || `${entry?.date}-${index}`}>
                          <td style={{ fontWeight: 600, color: "#94a3b8" }}>{index + 1}</td>
                          <td style={{ fontWeight: 600, color: "#1e293b" }}>
                            {entry?.date ? formatDate(entry.date) : "—"}
                          </td>
                          <td style={{ fontWeight: 600, color: "#64748b" }}>
                            {String(entry?.time || "").trim() || "—"}
                          </td>
                          <td style={{ color: "#1e293b", fontWeight: 600 }}>
                            {items.length > 0 ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                {items.map((item: any, idx: number) => (
                                  <div key={`${item?.item_name || item?.itemName || "item"}-${idx}`}>
                                    <span style={{ fontFamily: "ui-monospace, monospace" }}>
                                      {String(item?.item_name ?? item?.itemName ?? "—")}
                                    </span>{" "}
                                    · <span style={{ fontWeight: 800 }}>{Number(item?.returned_qty ?? 0) || 0}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: "#94a3b8" }}>—</span>
                            )}
                          </td>
                          <td style={{ color: "#64748b", fontWeight: 500 }}>
                            {String(entry?.note || "").trim() || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={addStyles.emptyState}>No material returns recorded.</div>
            )}
          </section>

          <section className={styles.formSection}>
            <div className={styles.sectionTitle}>
              <FileText size={22} color="var(--admin-primary, #004d4d)" /> Delivery Summary
            </div>
            <p className={styles.sectionSubtitle}>Issued vs installed vs remaining.</p>

            {(() => {
              const summary = buildMaterialSummaryFromSurvey(installationSurvey);
              if (!summary.length) {
                return <div className={addStyles.emptyState}>No summary available yet.</div>;
              }
              return (
                <div className={styles.userTableContainer} style={{ marginTop: "0.5rem" }}>
                  <table className={styles.userTable}>
                    <thead>
                      <tr>
                        <th style={{ width: "80px" }}>Sr. No</th>
                        <th>SKU / Item</th>
                        <th>Issued</th>
                        <th>Installed</th>
                        <th>Remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.map((row, index) => (
                        <tr key={`${row.sku}-${index}`}>
                          <td style={{ fontWeight: 600, color: "#94a3b8" }}>{index + 1}</td>
                          <td style={{ fontWeight: 700, color: "#1e293b", fontFamily: "ui-monospace, monospace" }}>
                            {row.sku}
                          </td>
                          <td style={{ fontWeight: 800, color: "#0f172a" }}>{row.issued}</td>
                          <td style={{ fontWeight: 800, color: "#0f172a" }}>{row.used}</td>
                          <td style={{ fontWeight: 800, color: row.remaining > 0 ? "#d97706" : "#16a34a" }}>
                            {row.remaining}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </section>
        </>
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
