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
  CheckCircle2,
} from "lucide-react";
import addStyles from "../../../leads/add/leads-add.module.css";
import { adminApi } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { toast } from "react-toastify";
import { formatDate, formatNoteListDateTime } from "@/lib/dateUtils";
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
        <ReadOnlyField label="Height" value={row.heightInInches} />
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

function SiteDetailsCards({
  groups,
  onViewImages,
}: {
  groups: SiteDetailSurveyGroup[];
  onViewImages: (images: string[], area: string) => void;
}) {
  const hasAreas = groups.some((g) => g.areas.length > 0);

  if (!groups.length || !hasAreas) {
    return <div className={addStyles.emptyState}>No site survey details found.</div>;
  }

  const showSurveyHeaders = groups.length > 1;

  return (
    <div className={modalStyles.siteDetailsStack}>
      {groups.map((group) => (
        <div key={group.surveyId} className={modalStyles.siteSurveyBox}>
          {showSurveyHeaders && (
            <div className={modalStyles.siteSurveyBoxHeader}>
              Survey {group.surveyIndex + 1}
              {group.surveyDate ? ` · ${formatDate(group.surveyDate)}` : ""}
            </div>
          )}
          {group.areas.map((row, roomIndex) => (
            <SiteRoomCard
              key={row._id}
              row={row}
              roomIndex={roomIndex}
              onViewImages={onViewImages}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function SurveyViewSections({
  surveyName,
  salesPerson,
  surveyDate,
  siteDetailGroups,
  noteEntries,
  onViewImages,
}: {
  surveyName: string;
  salesPerson: string;
  surveyDate: string | null;
  siteDetailGroups: SiteDetailSurveyGroup[];
  noteEntries: NoteEntry[];
  onViewImages: (images: string[], area: string) => void;
}) {
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
          Surveyed areas, fixtures, quantities, and pricing.
        </p>
        <SiteDetailsCards groups={siteDetailGroups} onViewImages={onViewImages} />
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
  const [verifying, setVerifying] = useState(false);
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
    return Array.isArray(list) ? list : [];
  }, [data]);

  const surveyDetails = useMemo(() => {
    if (!data?.customer) {
      return { surveyName: "N/A", salesPerson: "N/A", surveyDate: null as string | null };
    }
    return mapSurveyDetails(data.customer, surveyRecords);
  }, [data, surveyRecords]);

  const siteDetailGroups = useMemo(
    () => mapSiteDetailGroups(surveyRecords),
    [surveyRecords]
  );

  const noteEntries = useMemo(() => {
    if (!data?.customer) return [];
    return mapNotes(surveyRecords, data.customer);
  }, [data, surveyRecords]);

  const handleViewImages = (images: string[], area: string) => {
    setSelectedImages(images);
    setActiveArea(area);
  };

  const handleVerify = async () => {
    const name = surveyDetails.surveyName !== "N/A" ? surveyDetails.surveyName : "this survey";
    if (!window.confirm(`Are you sure you want to verify the survey for ${name}?`)) {
      return;
    }

    try {
      setVerifying(true);
      const response = await adminApi.verifyCustomerSurvey(id);
      toast.success(response.message || "Survey verified successfully!");
      const result = await adminApi.getCustomerWorkflowDetails(id);
      setData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to verify survey.";
      toast.error(message);
    } finally {
      setVerifying(false);
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
  const displayName = surveyDetails.surveyName !== "N/A" ? surveyDetails.surveyName : "Survey";

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
                </span>
              ) : null}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {isSurveyView &&
            customer.verifyStatus !== "verified" &&
            canVerifySurveys && (
              <button
                type="button"
                className={styles.createBtn}
                onClick={handleVerify}
                disabled={verifying}
                style={{ background: "#10b981" }}
              >
                {verifying ? (
                  <Loader2 size={18} className={styles.spinner} />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                {verifying ? "Verifying..." : "Verify Survey"}
              </button>
            )}
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

      {!isSurveyView && (
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
          onViewImages={handleViewImages}
        />
      ) : (
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <Hammer size={22} color="var(--admin-primary, #004d4d)" /> Materials Delivered to Site
          </div>
          <p className={styles.sectionSubtitle}>Items and quantities issued for this installation.</p>
          {data.materials?.length > 0 ? (
            <div className={styles.userTableContainer} style={{ marginTop: "0.5rem" }}>
              <table className={styles.userTable}>
                <thead>
                  <tr>
                    <th style={{ width: "80px" }}>Sr. No</th>
                    <th>Item Name</th>
                    <th>Issued Qty</th>
                    <th>Image</th>
                  </tr>
                </thead>
                <tbody>
                  {data.materials.map((item: any, index: number) => (
                    <tr key={index}>
                      <td style={{ fontWeight: 600, color: "#94a3b8" }}>{index + 1}</td>
                      <td style={{ fontWeight: 600, color: "#1e293b" }}>{item.item_name}</td>
                      <td style={{ fontWeight: 700, color: "var(--admin-primary, #004d4d)" }}>{item.issued_qty}</td>
                      <td>
                        {(item.images || []).length > 0 ? (
                          <span style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 500 }}>
                            {item.images.length} image(s)
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>No image</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={addStyles.emptyState}>No materials recorded yet.</div>
          )}
        </section>
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
