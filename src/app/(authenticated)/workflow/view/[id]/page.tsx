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
  Save,
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
  mapSiteDetails,
  mapSurveyDetails,
  parseSiteRowKey,
  reindexSurveySiteRows,
  resolveSurveyId,
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
import { InspectionWorkflowSections } from "@/components/workflow/inspection-workflow-sections";
import { resolveCustomerDba, formatInspectionStatusLabel, formatAdminInspectionApprovalLabel, getAdminInspectionApprovalColor, isAdminInspectionVerified, isInspectionReadyForAdminVerify } from "@/lib/workflow-installation";
import {
  formatRelativeUpdated,
  getInspectionStatusColor,
  resolveCustomerDisplayName,
  resolveCustomerMobile,
  resolveInspectionStatusRaw,
  resolveServiceAddress,
  resolveUpdatedAt,
} from "@/lib/workflow-inspection-view";

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
  changeLabel = "Change",
}: {
  label: string;
  assignedName: string;
  canAssign: boolean;
  onAssign: () => void;
  changeLabel?: string;
}) {
  const name = assignedName.trim();

  return (
    <div className={styles.formGroup}>
      <label>{label}</label>
      {name ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
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
              flex: 1,
              minWidth: "12rem",
            }}
          >
            {name}
          </div>
          {canAssign ? (
            <button
              type="button"
              className={styles.assignBtn}
              onClick={onAssign}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              {changeLabel}
            </button>
          ) : null}
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

function SiteAreaDetailContent({
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
  const roomLabel = row.area?.trim() ? row.area.toUpperCase() : `ROOM ${roomIndex + 1}`;

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
            {hasMoreImages ? (
              <button
                type="button"
                className={modalStyles.siteMediaMore}
                onClick={() => onViewImages(row.images, row.area)}
              >
                +{row.images.length - previewImages.length}
              </button>
            ) : null}
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

function EditableField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className={styles.formGroup}>
      <label>{label}</label>
      <input
        type={type}
        className={styles.formInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function SiteAreaEditForm({
  row,
  onFieldChange,
}: {
  row: SiteDetailRow;
  onFieldChange: (field: keyof SiteDetailRow, value: string) => void;
}) {
  const change = (field: keyof SiteDetailRow) => (value: string) => onFieldChange(field, value);

  return (
    <article className={modalStyles.siteRoomCard}>
      <div className={styles.formGrid} style={{ marginBottom: "1.25rem" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <EditableField
            label="Area"
            value={row.area || ""}
            onChange={change("area")}
            placeholder="Room name"
          />
        </div>
      </div>
      <div className={styles.formGrid}>
        <EditableField
          label="Existing Fixture Type"
          value={row.existingFixtureType || ""}
          onChange={change("existingFixtureType")}
        />
        <EditableField
          label="Height Ft"
          value={row.heightFt === "N/A" ? "" : row.heightFt || ""}
          onChange={change("heightFt")}
          placeholder="e.g. 10"
        />
        <EditableField
          label="Height In"
          value={row.heightIn === "N/A" ? "" : row.heightIn || ""}
          onChange={change("heightIn")}
          placeholder="e.g. 6"
        />
        <EditableField
          label="Existing Bulb"
          value={row.existingBulbs || ""}
          onChange={change("existingBulbs")}
        />
        <EditableField
          label="Existing Quantity"
          value={row.existingQuantity || ""}
          onChange={change("existingQuantity")}
          type="number"
        />
      </div>

      <div className={`${styles.formGroup} ${modalStyles.siteMediaBlock}`}>
        <label>Images / Videos</label>
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
            gap: "0.4rem",
          }}
        >
          <ImageIcon size={16} />
          {row.images?.length ? `${row.images.length} image(s) on file` : "No images"}
        </div>
      </div>

      <div className={styles.formGrid}>
        <EditableField
          label="Proposed Fixture"
          value={row.proposedFixture || ""}
          onChange={change("proposedFixture")}
        />
        <EditableField
          label="Proposed Quantity"
          value={row.proposedQuantity || ""}
          onChange={change("proposedQuantity")}
          type="number"
        />
        <EditableField
          label="Price Per Unit"
          value={row.pricePerUnit === "—" ? "" : row.pricePerUnit || ""}
          onChange={change("pricePerUnit")}
        />
        <EditableField
          label="Total Price"
          value={row.totalPrice === "—" ? "" : row.totalPrice || ""}
          onChange={change("totalPrice")}
        />
        <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
          <label>Note</label>
          <textarea
            className={styles.formInput}
            value={row.note || ""}
            onChange={(e) => change("note")(e.target.value)}
            rows={3}
            style={{ resize: "vertical", minHeight: "5rem" }}
          />
        </div>
      </div>
    </article>
  );
}

function SiteAreaDetailModal({
  row,
  roomIndex,
  canEdit,
  saving,
  onClose,
  onViewImages,
  onSave,
}: {
  row: SiteDetailRow | null;
  roomIndex: number;
  canEdit: boolean;
  saving: boolean;
  onClose: () => void;
  onViewImages: (images: string[], area: string) => void;
  onSave: (row: SiteDetailRow) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftRow, setDraftRow] = useState<SiteDetailRow | null>(null);

  useEffect(() => {
    if (row) {
      setDraftRow({ ...row });
      setIsEditing(false);
    } else {
      setDraftRow(null);
      setIsEditing(false);
    }
  }, [row]);

  if (!row || !draftRow) return null;

  const roomLabel = row.area?.trim() ? row.area.toUpperCase() : `ROOM ${roomIndex + 1}`;

  function handleFieldChange(field: keyof SiteDetailRow, value: string) {
    setDraftRow((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleSave() {
    if (!draftRow) return;
    await onSave(draftRow);
    setIsEditing(false);
  }

  function handleCancelEdit() {
    setDraftRow({ ...row } as SiteDetailRow);
    setIsEditing(false);
  }

  function handleClose() {
    if (saving) return;
    if (isEditing) {
      handleCancelEdit();
    }
    onClose();
  }

  return (
    <div
      className={modalStyles.imgModalOverlay}
      onClick={() => {
        if (!isEditing && !saving) onClose();
      }}
    >
      <div
        className={modalStyles.imgModalContent}
        style={{ maxWidth: 920 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={modalStyles.imgModalHeader}>
          <div>
            <h3>{roomLabel}</h3>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
              {isEditing ? "Edit area details" : "Area details"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {canEdit && !isEditing ? (
              <button
                type="button"
                className={styles.assignBtn}
                onClick={() => setIsEditing(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
              >
                <Edit2 size={16} /> Edit
              </button>
            ) : null}
            <button type="button" className={modalStyles.closeBtn} onClick={handleClose} disabled={saving}>
              <X size={20} />
            </button>
          </div>
        </div>
        <div className={modalStyles.siteSurveyDetailModalBody}>
          {isEditing ? (
            <SiteAreaEditForm row={draftRow} onFieldChange={handleFieldChange} />
          ) : (
            <SiteAreaDetailContent row={row} roomIndex={roomIndex} onViewImages={onViewImages} />
          )}
        </div>
        {isEditing ? (
          <div className={modalStyles.siteAreaModalFooter}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleCancelEdit}
              disabled={saving}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.addBtn}
              onClick={handleSave}
              disabled={saving}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              {saving ? <Loader2 size={18} className={styles.spinner} /> : <Save size={18} />}
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SiteAreaSummaryCard({
  row,
  roomIndex,
  canReorder,
  isDragging,
  isDragOver,
  onView,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: {
  row: SiteDetailRow;
  roomIndex: number;
  canReorder: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onView: () => void;
  onDragStart: () => void;
  onDragOver: (event: React.DragEvent<HTMLElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: React.DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}) {
  const roomLabel = row.area?.trim() ? row.area.toUpperCase() : `ROOM ${roomIndex + 1}`;

  const handleRowDragStart = (event: React.DragEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button, a, input, textarea, select, [data-no-drag]")) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(roomIndex));
    onDragStart();
  };

  return (
    <article
      draggable={canReorder}
      className={`${modalStyles.siteAreaRowCard} ${canReorder ? modalStyles.siteAreaRowDraggable : ""} ${isDragging ? modalStyles.siteAreaRowDragging : ""} ${isDragOver ? modalStyles.siteAreaRowDragOver : ""}`}
      onDragStart={canReorder ? handleRowDragStart : undefined}
      onDragEnd={canReorder ? onDragEnd : undefined}
      onDragOver={canReorder ? onDragOver : undefined}
      onDragLeave={canReorder ? onDragLeave : undefined}
      onDrop={canReorder ? onDrop : undefined}
    >
      <div className={modalStyles.siteAreaRowMetric}>
        <span className={modalStyles.siteAreaRowMetricLabel}>Area</span>
        <span className={modalStyles.siteAreaRowMetricValue}>{roomLabel}</span>
      </div>

      <div className={modalStyles.siteAreaRowMetric}>
        <span className={modalStyles.siteAreaRowMetricLabel}>Proposed Fixture</span>
        <span className={modalStyles.siteAreaRowMetricValue}>
          {row.proposedFixture?.trim() || "—"}
        </span>
      </div>

      <div className={modalStyles.siteAreaRowMetric}>
        <span className={modalStyles.siteAreaRowMetricLabel}>Proposed Quantity</span>
        <span className={modalStyles.siteAreaRowMetricValue}>
          {row.proposedQuantity?.trim() || "—"}
        </span>
      </div>

      <div className={modalStyles.siteAreaRowMetric}>
        <span className={modalStyles.siteAreaRowMetricLabel}>Note</span>
        <span
          className={`${modalStyles.siteAreaRowMetricValue} ${modalStyles.siteAreaRowNoteValue}`}
          title={row.note?.trim() || undefined}
        >
          {row.note?.trim() || "—"}
        </span>
      </div>

      <button
        type="button"
        className={modalStyles.siteAreaRowActionBtn}
        data-no-drag
        onClick={onView}
      >
        View
      </button>
    </article>
  );
}

function SiteDetailsAreaList({
  groups,
  onViewArea,
  canReorder,
  reordering,
  onReorder,
  canVerify,
  verifyingSurveyId,
  onVerifySurvey,
}: {
  groups: SiteDetailSurveyGroup[];
  onViewArea: (row: SiteDetailRow, roomIndex: number) => void;
  canReorder: boolean;
  reordering: boolean;
  onReorder: (surveyId: string, fromIndex: number, toIndex: number) => void;
  canVerify: boolean;
  verifyingSurveyId: string | null;
  onVerifySurvey: (surveyId: string, surveyName: string) => void;
}) {
  const hasAreas = groups.some((group) => group.areas.length > 0);
  const [dragging, setDragging] = useState<{ surveyId: string; index: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (!groups.length || !hasAreas) {
    return <div className={addStyles.emptyState}>No site survey details found.</div>;
  }

  return (
    <div className={modalStyles.siteAreaList}>
      {groups.map((group) => (
        <div key={group.surveyId} className={modalStyles.siteAreaGroup}>
          {groups.length > 1 ? (
            <div className={modalStyles.siteAreaGroupHeader}>
              <p className={modalStyles.siteAreaGroupTitle}>
                Survey {group.surveyIndex + 1} · {group.surveyName}
                {group.surveyDate ? ` · ${formatDate(group.surveyDate)}` : ""}
              </p>
              <SiteSurveyVerifyControl
                surveyId={group.surveyId}
                surveyName={group.surveyName}
                isVerified={group.isVerified}
                canVerify={canVerify}
                verifying={verifyingSurveyId === group.surveyId}
                onVerify={onVerifySurvey}
                compact
              />
            </div>
          ) : null}

          {canReorder && group.areas.length > 1 ? (
            <p className={modalStyles.siteAreaReorderHint}>Drag a row up or down to change area order.</p>
          ) : null}

          {group.areas.map((row, roomIndex) => (
            <SiteAreaSummaryCard
              key={row._id}
              row={row}
              roomIndex={roomIndex}
              canReorder={canReorder && group.areas.length > 1 && !reordering}
              isDragging={dragging?.surveyId === group.surveyId && dragging.index === roomIndex}
              isDragOver={dragging?.surveyId === group.surveyId && dragOverIndex === roomIndex}
              onView={() => onViewArea(row, roomIndex)}
              onDragStart={() => setDragging({ surveyId: group.surveyId, index: roomIndex })}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                if (dragging?.surveyId === group.surveyId) {
                  setDragOverIndex(roomIndex);
                }
              }}
              onDragLeave={() => {
                if (dragOverIndex === roomIndex) {
                  setDragOverIndex(null);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                const fromIndex = dragging?.surveyId === group.surveyId ? dragging.index : Number.NaN;
                setDragging(null);
                setDragOverIndex(null);
                if (!Number.isFinite(fromIndex) || fromIndex === roomIndex) return;
                onReorder(group.surveyId, fromIndex, roomIndex);
              }}
              onDragEnd={() => {
                setDragging(null);
                setDragOverIndex(null);
              }}
            />
          ))}
        </div>
      ))}
    </div>
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


function SurveyViewSections({
  surveyName,
  salesPerson,
  surveyDate,
  siteDetailGroups,
  noteEntries,
  canVerify,
  canEdit,
  savingSiteRow,
  verifyingSurveyId,
  onVerifySurvey,
  onViewImages,
  onSaveSiteRow,
  onReorderSiteRows,
  reorderingAreas,
}: {
  surveyName: string;
  salesPerson: string;
  surveyDate: string | null;
  siteDetailGroups: SiteDetailSurveyGroup[];
  noteEntries: NoteEntry[];
  canVerify: boolean;
  canEdit: boolean;
  savingSiteRow: boolean;
  verifyingSurveyId: string | null;
  onVerifySurvey: (surveyId: string, surveyName: string) => void;
  onViewImages: (images: string[], area: string) => void;
  onSaveSiteRow: (row: SiteDetailRow) => Promise<void>;
  onReorderSiteRows: (surveyId: string, fromIndex: number, toIndex: number) => Promise<void>;
  reorderingAreas: boolean;
}) {
  const singleGroup = siteDetailGroups.length === 1 ? siteDetailGroups[0] : null;
  const [selectedArea, setSelectedArea] = useState<{
    row: SiteDetailRow;
    roomIndex: number;
  } | null>(null);

  const selectedRow = useMemo(() => {
    if (!selectedArea) return null;
    for (const group of siteDetailGroups) {
      const match = group.areas.find((area) => area._id === selectedArea.row._id);
      if (match) return match;
    }
    return selectedArea.row;
  }, [selectedArea, siteDetailGroups]);

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "1.25rem",
          }}
        >
          <div className={styles.sectionTitle} style={{ marginBottom: 0 }}>
            <Info size={22} color="#ea580c" strokeWidth={2} /> Site Details
          </div>
          {singleGroup ? (
            <SiteSurveyVerifyControl
              surveyId={singleGroup.surveyId}
              surveyName={singleGroup.surveyName}
              isVerified={singleGroup.isVerified}
              canVerify={canVerify}
              verifying={verifyingSurveyId === singleGroup.surveyId}
              onVerify={onVerifySurvey}
              compact
            />
          ) : null}
        </div>

        <SiteDetailsAreaList
          groups={siteDetailGroups}
          onViewArea={(row, roomIndex) => setSelectedArea({ row, roomIndex })}
          canReorder={canEdit}
          reordering={reorderingAreas || savingSiteRow}
          onReorder={onReorderSiteRows}
          canVerify={canVerify}
          verifyingSurveyId={verifyingSurveyId}
          onVerifySurvey={onVerifySurvey}
        />
        <SiteAreaDetailModal
          row={selectedRow}
          roomIndex={selectedArea?.roomIndex ?? 0}
          canEdit={canEdit}
          saving={savingSiteRow}
          onClose={() => setSelectedArea(null)}
          onViewImages={onViewImages}
          onSave={onSaveSiteRow}
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
  const focusedSurveyId = searchParams.get("surveyId") || "";

  const [loading, setLoading] = useState(true);
  const [verifyingSurveyId, setVerifyingSurveyId] = useState<string | null>(null);
  const [approvingInspection, setApprovingInspection] = useState(false);
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
  const [siteRows, setSiteRows] = useState<SiteDetailRow[]>([]);
  const [savingSiteRow, setSavingSiteRow] = useState(false);
  const [reorderingAreas, setReorderingAreas] = useState(false);

  const isSurveyView = fromTab === "Surveys";
  const isInspectionView = fromTab === "Inspections";
  const isInstallationView = fromTab === "Installations";
  const usesInstallationWorkflowApi = isInstallationView || isInspectionView;
  const surveyId = usesInstallationWorkflowApi ? id : "";

  const refreshData = async () => {
    const result = usesInstallationWorkflowApi
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
  }, [id, router, usesInstallationWorkflowApi]);

  const surveyRecords = useMemo(() => {
    if (usesInstallationWorkflowApi && data?.survey) {
      return [data.survey];
    }
    const list = data?.surveys;
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.surveyDate || 0).getTime();
      const timeB = new Date(b.createdAt || b.surveyDate || 0).getTime();
      return timeA - timeB;
    });
  }, [data, usesInstallationWorkflowApi]);

  const focusedSurveyRecords = useMemo(() => {
    if (!focusedSurveyId) return surveyRecords;
    return surveyRecords.filter(
      (survey) => resolveSurveyId(survey) === focusedSurveyId
    );
  }, [surveyRecords, focusedSurveyId]);

  const surveyDetails = useMemo(() => {
    if (!data?.customer) {
      return { surveyName: "N/A", salesPerson: "N/A", surveyDate: null as string | null };
    }
    return mapSurveyDetails(data.customer, focusedSurveyRecords);
  }, [data, focusedSurveyRecords]);

  useEffect(() => {
    setSiteRows(mapSiteDetails(focusedSurveyRecords));
  }, [focusedSurveyRecords]);

  const siteDetailGroups = useMemo(() => {
    const groups = mapSiteDetailGroups(focusedSurveyRecords, data?.customer);
    return groups.map((group) => {
      const orderedRows = siteRows.filter(
        (row) => parseSiteRowKey(row._id)?.surveyId === group.surveyId
      );
      return orderedRows.length > 0 ? { ...group, areas: orderedRows } : group;
    });
  }, [focusedSurveyRecords, siteRows, data?.customer]);

  const noteEntries = useMemo(() => {
    if (!data?.customer) return [];
    return mapNotes(focusedSurveyRecords, data.customer);
  }, [data, focusedSurveyRecords]);

  const installationSurvey = useMemo(() => {
    if (usesInstallationWorkflowApi && data?.survey) {
      return data.survey as Record<string, unknown>;
    }
    return resolveInstallationSurvey(surveyRecords);
  }, [data, usesInstallationWorkflowApi, surveyRecords]);

  const handleReorderSiteRows = async (
    surveyId: string,
    fromIndex: number,
    toIndex: number
  ) => {
    if (fromIndex === toIndex) return;

    const nextRows = reindexSurveySiteRows(siteRows, surveyId, fromIndex, toIndex);
    setSiteRows(nextRows);

    try {
      setReorderingAreas(true);
      const response = await adminApi.updateCustomerWorkflow(id, {
        customerCode: String(data?.customer?.customerCode || "").trim(),
        surveys: nextRows,
      });
      if (response?.surveys) {
        setData((prev: typeof data) =>
          prev
            ? {
                ...prev,
                customer: response.customer ?? prev.customer,
                surveys: response.surveys,
              }
            : prev
        );
      }
      toast.success("Area order updated.");
    } catch (err: unknown) {
      setSiteRows(mapSiteDetails(focusedSurveyRecords));
      const message = err instanceof Error ? err.message : "Failed to reorder areas.";
      toast.error(message);
    } finally {
      setReorderingAreas(false);
    }
  };

  const handleSaveSiteRow = async (updatedRow: SiteDetailRow) => {
    try {
      setSavingSiteRow(true);
      const nextRows = siteRows.map((row) => (row._id === updatedRow._id ? updatedRow : row));
      await adminApi.updateCustomerWorkflow(id, {
        customerCode: String(data?.customer?.customerCode || "").trim(),
        surveys: nextRows,
      });
      setSiteRows(nextRows);
      await refreshData();
      toast.success("Area details saved successfully.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save area details.";
      toast.error(message);
      throw err;
    } finally {
      setSavingSiteRow(false);
    }
  };

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
      const response =
        assignType === "Contractor"
          ? await adminApi.assignContractor(surveyId, staff._id)
          : await adminApi.assignProjectManager(surveyId, staff._id);
      toast.success(response.message || `${assignType} updated successfully.`);
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
  const canEditInspections = hasPermission("Inspection", "edit");
  const canCreateInstallations = hasPermission("Installation", "create");
  const canCreateInspections = hasPermission("Inspection", "create");
  const canVerifySurveys = hasPermission("Surveys", "create");
  const workflowTab = fromTab || (isSurveyView ? "Surveys" : "Installations");
  const backUrl = `/workflow?tab=${workflowTab}`;
  const surveyStatus = customer.status || "Pending";
  const statusColor = getSurveyStatusColor(surveyStatus);
  const displayName =
    customer.name?.trim() ||
    (surveyDetails.surveyName !== "N/A" ? surveyDetails.surveyName : "Survey");

  const legalName = String(customer.legalName || customer.name || "").trim();
  const dba = resolveCustomerDba(customer);
  const companyOrDba = dba || String(customer.company || "").trim();
  const salesPerson = usesInstallationWorkflowApi
    ? resolveSurveySalesPersonName(installationSurvey, customer)
    : String(customer?.user_id?.fullName || customer?.user_id?.name || "").trim();
  const contractorName = resolveSurveyContractorName(installationSurvey);
  const projectManagerName = resolveSurveyProjectManagerName(installationSurvey);
  const jobId = String(installationSurvey?.job_id || "").trim();
  const isChangingAssignment =
    assignType === "Contractor"
      ? !!contractorName.trim()
      : !!projectManagerName.trim();

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
  const inspectionStatusRaw = resolveInspectionStatusRaw(installationSurvey, customer);
  const inspectionStatusColor = getInspectionStatusColor(inspectionStatusRaw);
  const inspectionUpdatedLabel = isInspectionView
    ? formatRelativeUpdated(resolveUpdatedAt(installationSurvey, customer))
    : "";

  const canApproveInspection =
    isInspectionView &&
    !isAdminInspectionVerified(inspectionStatusRaw) &&
    isInspectionReadyForAdminVerify(inspectionStatusRaw) &&
    (canEditInspections || canCreateInspections);

  const handleApproveInspection = async () => {
    if (!id) {
      toast.error("Survey ID is missing for this inspection.");
      return;
    }

    if (
      !window.confirm(
        `Approve inspection for "${displayName || "this customer"}"?`
      )
    ) {
      return;
    }

    try {
      setApprovingInspection(true);
      const response = await adminApi.verifyInspection(id);
      toast.success(response.message || "Inspection approved successfully.");
      await refreshData();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to approve inspection.";
      toast.error(message);
    } finally {
      setApprovingInspection(false);
    }
  };

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push(backUrl)}>
          WORKFLOW
        </span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>
          {isSurveyView
            ? "VIEW SURVEY"
            : isInspectionView
              ? "VIEW INSPECTION"
              : isInstallationView
                ? "VIEW INSTALLATION"
                : "VIEW WORKFLOW"}
        </span>
      </div>

      <div className={styles.pageHeader} style={{ marginBottom: isSurveyView ? "2rem" : undefined }}>
        <div>
          <h1 className={styles.welcomeText}>
            {isSurveyView
              ? `Survey Profile: ${displayName}`
              : isInspectionView
                ? `Inspection: ${displayName}`
                : isInstallationView
                  ? `Installation: ${displayName}`
                  : "Workflow Details"}
          </h1>
          {isInspectionView && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
              <span
                style={{
                  backgroundColor: `${inspectionStatusColor}15`,
                  color: inspectionStatusColor,
                  padding: "0.25rem 0.75rem",
                  borderRadius: "99px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {formatInspectionStatusLabel(inspectionStatusRaw)}
              </span>
              {inspectionUpdatedLabel ? (
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#94a3b8" }}>
                  {inspectionUpdatedLabel}
                </span>
              ) : null}
              <span
                style={{
                  backgroundColor: `${getAdminInspectionApprovalColor(inspectionStatusRaw)}15`,
                  color: getAdminInspectionApprovalColor(inspectionStatusRaw),
                  padding: "0.25rem 0.75rem",
                  borderRadius: "99px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Admin: {formatAdminInspectionApprovalLabel(inspectionStatusRaw)}
              </span>
            </div>
          )}
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
              onClick={() =>
                router.push(
                  focusedSurveyId
                    ? `/workflow/edit/${id}?from=Surveys&surveyId=${focusedSurveyId}`
                    : `/workflow/edit/${id}?from=Surveys`
                )
              }
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
          {isInspectionView && canApproveInspection ? (
            <button
              type="button"
              className={styles.addBtn}
              disabled={approvingInspection}
              onClick={handleApproveInspection}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
            >
              {approvingInspection ? <Loader2 size={20} className={styles.spinner} /> : null}
              Approve Inspection
            </button>
          ) : null}
          {isInspectionView && canEditInspections && (
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => router.push(`/workflow/edit/${id}?from=Inspections`)}
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
            <ReadOnlyField label="Company" value={dba} />
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
      ) : isInspectionView ? (
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <Briefcase size={22} color="var(--admin-primary, #004d4d)" /> Project Information
          </div>
          <div className={styles.formGrid}>
            <ReadOnlyField label="Service Address" value={resolveServiceAddress(customer)} />
            <ReadOnlyField label="Name" value={resolveCustomerDisplayName(customer)} />
            <ReadOnlyField label="Mobile" value={resolveCustomerMobile(customer)} />
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

      {!isSurveyView && !usesInstallationWorkflowApi && (
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

      {!isSurveyView && !usesInstallationWorkflowApi && (
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

      {isInspectionView ? (
        <InspectionWorkflowSections
          survey={installationSurvey}
          customer={customer}
          onViewImages={handleViewImages}
        />
      ) : isInstallationView ? (
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
          canEdit={isSurveyView && canEditSurveys}
          savingSiteRow={savingSiteRow}
          verifyingSurveyId={verifyingSurveyId}
          onVerifySurvey={handleVerifySurvey}
          onViewImages={handleViewImages}
          onSaveSiteRow={handleSaveSiteRow}
          onReorderSiteRows={handleReorderSiteRows}
          reorderingAreas={reorderingAreas}
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
              <h3>{isChangingAssignment ? "Change" : "Assign"} {assignType}</h3>
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
                        {isChangingAssignment ? "Change" : "Assign"}
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
