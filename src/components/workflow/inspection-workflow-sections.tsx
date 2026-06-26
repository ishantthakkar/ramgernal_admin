"use client";

import { useEffect, useState, type ReactNode } from "react";
import styles from "../../app/(authenticated)/dashboard.module.css";
import modalStyles from "../../app/(authenticated)/workflow/workflow-details.module.css";
import {
  ClipboardCheck,
  FileText,
  Loader2,
  Plus,
  Hammer,
  Info,
  Hash,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { formatNoteListDateTime } from "@/lib/dateUtils";
import {
  mapInspectionAreas,
  mapInspectionNotes,
  type InspectionAreaGroup,
  type InspectionFixtureRow,
} from "@/lib/workflow-inspection-view";
import type { NoteEntry } from "@/lib/workflow-survey-view";

const PRIMARY_ICON = "var(--admin-primary, #004d4d)";
const MUTED_ICON = "#64748b";

export interface InspectionVerificationEdit {
  verifiedQty: string;
  issueFound: "yes" | "no";
  comments: string;
}

interface InspectionWorkflowSectionsProps {
  survey: Record<string, unknown> | null;
  customer: Record<string, unknown>;
  mode?: "view" | "edit";
  verificationEdits?: Record<string, InspectionVerificationEdit>;
  onVerificationChange?: (
    fixtureId: string,
    field: keyof InspectionVerificationEdit,
    value: string
  ) => void;
  onViewImages?: (images: string[], title: string) => void;
  onAddNote?: (text: string) => Promise<void>;
  addingNote?: boolean;
}

interface ReadOnlyFieldProps {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}

function ReadOnlyField({ label, icon, children }: ReadOnlyFieldProps) {
  return (
    <div className={styles.formGroup}>
      <label>{label}</label>
      <div className={`${styles.formInput} ${modalStyles.readonlyField}`}>
        {icon ? <div className={modalStyles.fieldRow}>{icon}{children}</div> : children}
      </div>
    </div>
  );
}

function ReadOnlyValue({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  const display = value?.trim() || "—";
  return (
    <ReadOnlyField label={label} icon={icon}>
      <span style={{ color: display === "—" ? "#94a3b8" : "#1e293b" }}>{display}</span>
    </ReadOnlyField>
  );
}

function formatHeightPart(value: string): string {
  const text = value?.trim();
  if (!text || text === "N/A" || text === "—" || text === "----") return "—";
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

function ImageThumbnails({
  images,
  title,
  onViewImages,
}: {
  images: string[];
  title: string;
  onViewImages?: (images: string[], title: string) => void;
}) {
  const previewImages = images.slice(0, 4);
  const hasMoreImages = images.length > previewImages.length;

  if (!images.length) {
    return (
      <div className={`${styles.formInput} ${modalStyles.readonlyField}`} style={{ color: "#94a3b8" }}>
        No images
      </div>
    );
  }

  return (
    <div className={modalStyles.siteMediaGrid}>
      {previewImages.map((img, idx) => (
        <button
          key={`${title}-${idx}`}
          type="button"
          className={modalStyles.siteMediaThumb}
          onClick={() => onViewImages?.(images, title)}
          title="View all images"
        >
          <img src={img} alt={`${title} ${idx + 1}`} />
        </button>
      ))}
      {hasMoreImages ? (
        <button
          type="button"
          className={modalStyles.siteMediaMore}
          onClick={() => onViewImages?.(images, title)}
        >
          +{images.length - previewImages.length}
        </button>
      ) : null}
    </div>
  );
}

function VerificationFields({
  fixture,
  isEdit,
  verificationEdits,
  onVerificationChange,
}: {
  fixture: InspectionFixtureRow;
  isEdit: boolean;
  verificationEdits?: Record<string, InspectionVerificationEdit>;
  onVerificationChange?: (
    fixtureId: string,
    field: keyof InspectionVerificationEdit,
    value: string
  ) => void;
}) {
  const edit = verificationEdits?.[fixture.id];

  if (!isEdit) {
    return (
      <div className={styles.formGrid}>
        <ReadOnlyValue
          label="Verified Quantity"
          value={fixture.verification.verifiedQty}
          icon={<Hash size={16} color={MUTED_ICON} />}
        />
        <ReadOnlyValue
          label="Issue Found"
          value={fixture.verification.issueFound}
          icon={<CheckCircle2 size={16} color={MUTED_ICON} />}
        />
        <div style={{ gridColumn: "1 / -1" }}>
          <ReadOnlyValue
            label="Comments"
            value={fixture.verification.comments}
            icon={<FileText size={16} color={MUTED_ICON} />}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formGrid}>
      <div className={styles.formGroup}>
        <label>Verified Quantity</label>
        <input
          type="number"
          className={styles.formInput}
          value={edit?.verifiedQty ?? ""}
          onChange={(e) => onVerificationChange?.(fixture.id, "verifiedQty", e.target.value)}
          min={0}
        />
      </div>
      <div className={styles.formGroup}>
        <label>Issue Found</label>
        <select
          className={styles.formInput}
          value={edit?.issueFound ?? "no"}
          onChange={(e) => onVerificationChange?.(fixture.id, "issueFound", e.target.value)}
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>
      <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
        <label>Comments</label>
        <textarea
          className={styles.formInput}
          rows={3}
          value={edit?.comments ?? ""}
          onChange={(e) => onVerificationChange?.(fixture.id, "comments", e.target.value)}
          style={{ resize: "vertical", minHeight: "5rem" }}
        />
      </div>
    </div>
  );
}

function InspectionFixtureCard({
  fixture,
  fixtureIndex,
  isEdit,
  verificationEdits,
  onVerificationChange,
  onViewImages,
}: {
  fixture: InspectionFixtureRow;
  fixtureIndex: number;
  isEdit: boolean;
  verificationEdits?: Record<string, InspectionVerificationEdit>;
  onVerificationChange?: (
    fixtureId: string,
    field: keyof InspectionVerificationEdit,
    value: string
  ) => void;
  onViewImages?: (images: string[], title: string) => void;
}) {
  const fixtureLabel =
    fixture.existingFixtureType !== "—" && fixture.existingFixtureType !== "----"
      ? fixture.existingFixtureType
      : `Fixture ${fixtureIndex + 1}`;

  return (
    <article className={modalStyles.siteRoomCard}>
      <h4 className={modalStyles.siteRoomTitle}>{fixtureLabel}</h4>

      <div className={styles.formGrid}>
        <ReadOnlyValue
          label="Existing Fixture Type"
          value={fixture.existingFixtureType}
          icon={<Hammer size={16} color={MUTED_ICON} />}
        />
        <HeightReadOnlyField heightFt={fixture.heightFt} heightIn={fixture.heightIn} />
        <ReadOnlyValue
          label="Existing Bulb"
          value={fixture.existingBulbs}
          icon={<Info size={16} color={MUTED_ICON} />}
        />
        <ReadOnlyValue
          label="Existing Quantity"
          value={fixture.existingQuantity}
          icon={<Hash size={16} color={MUTED_ICON} />}
        />
      </div>

      <div className={`${styles.formGroup} ${modalStyles.siteMediaBlock}`}>
        <label>Images / Videos</label>
        <ImageThumbnails images={fixture.images} title={fixtureLabel} onViewImages={onViewImages} />
      </div>

      <div className={styles.formGrid}>
        <ReadOnlyValue
          label="Proposed Fixture"
          value={fixture.proposedFixture}
          icon={<Hammer size={16} color={MUTED_ICON} />}
        />
        <ReadOnlyValue
          label="Proposed Quantity"
          value={fixture.proposedQuantity}
          icon={<Hash size={16} color={MUTED_ICON} />}
        />
        <div style={{ gridColumn: "1 / -1" }}>
          <ReadOnlyValue label="Note" value={fixture.note} icon={<FileText size={16} color={MUTED_ICON} />} />
        </div>
      </div>

      <div className={modalStyles.siteSurveyBox} style={{ marginTop: "1.5rem" }}>
        <div className={modalStyles.siteSurveyBoxHeader}>Verification Inputs</div>
        <VerificationFields
          fixture={fixture}
          isEdit={isEdit}
          verificationEdits={verificationEdits}
          onVerificationChange={onVerificationChange}
        />
        <div className={`${styles.formGroup} ${modalStyles.siteMediaBlock}`}>
          <label>Images / Videos</label>
          <ImageThumbnails
            images={fixture.verification.images}
            title={`Verification · ${fixtureLabel}`}
            onViewImages={onViewImages}
          />
        </div>
      </div>
    </article>
  );
}

function InspectionAreaBlock({
  group,
  isEdit,
  verificationEdits,
  onVerificationChange,
  onViewImages,
}: {
  group: InspectionAreaGroup;
  isEdit: boolean;
  verificationEdits?: Record<string, InspectionVerificationEdit>;
  onVerificationChange?: (
    fixtureId: string,
    field: keyof InspectionVerificationEdit,
    value: string
  ) => void;
  onViewImages?: (images: string[], title: string) => void;
}) {
  return (
    <div className={modalStyles.siteSurveyBox}>
      <div className={modalStyles.siteSurveyBoxHeaderRow}>
        <span className={modalStyles.siteSurveyBoxHeaderTitle}>Area</span>
        <span className={modalStyles.siteSurveyBoxHeaderTitle}>Note</span>
      </div>
      <div className={styles.formGrid} style={{ marginBottom: "1.25rem" }}>
        <ReadOnlyValue label="Area Name" value={group.areaName} icon={<MapPin size={16} color={MUTED_ICON} />} />
        <ReadOnlyValue label="Area Note" value={group.note} icon={<FileText size={16} color={MUTED_ICON} />} />
      </div>

      {group.fixtures.length ? (
        <div className={modalStyles.siteDetailsStack}>
          {group.fixtures.map((fixture, index) => (
            <InspectionFixtureCard
              key={fixture.id}
              fixture={fixture}
              fixtureIndex={index}
              isEdit={isEdit}
              verificationEdits={verificationEdits}
              onVerificationChange={onVerificationChange}
              onViewImages={onViewImages}
            />
          ))}
        </div>
      ) : (
        <div className={modalStyles.viewEmptyState}>No fixture details for this area.</div>
      )}
    </div>
  );
}

function NotesList({ entries }: { entries: NoteEntry[] }) {
  if (!entries.length) {
    return <div className={modalStyles.viewEmptyState}>No notes on file.</div>;
  }

  return (
    <div className={styles.userTableContainer}>
      <table className={modalStyles.detailTable}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Date</th>
            <th>Author</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const title = (entry.title || (entry.source === "survey" ? "Survey Note" : "Note")).trim();
            const timestamp = entry.timestamp ? formatNoteListDateTime(entry.timestamp) : "—";

            return (
              <tr key={entry.id}>
                <td className={modalStyles.detailTableName}>
                  {index + 1}. {title}
                </td>
                <td className={modalStyles.detailTableMuted}>{timestamp}</td>
                <td>{entry.authorName?.trim() || "—"}</td>
                <td>
                  <div className={modalStyles.noteContent}>{entry.text}</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function buildVerificationEditsFromSurvey(
  survey: Record<string, unknown> | null | undefined
): Record<string, InspectionVerificationEdit> {
  const edits: Record<string, InspectionVerificationEdit> = {};

  for (const group of mapInspectionAreas(survey)) {
    for (const fixture of group.fixtures) {
      if (!fixture.id || fixture.id.startsWith("area-")) continue;
      const issueRaw = fixture.verification.issueFound.trim().toLowerCase();
      edits[fixture.id] = {
        verifiedQty:
          fixture.verification.verifiedQty === "—" ||
          fixture.verification.verifiedQty === "----"
            ? ""
            : fixture.verification.verifiedQty,
        issueFound: issueRaw === "yes" ? "yes" : "no",
        comments:
          fixture.verification.comments === "—" ||
          fixture.verification.comments === "----"
            ? ""
            : fixture.verification.comments,
      };
    }
  }

  return edits;
}

export function InspectionWorkflowSections({
  survey,
  customer,
  mode = "view",
  verificationEdits,
  onVerificationChange,
  onViewImages,
  onAddNote,
  addingNote = false,
}: InspectionWorkflowSectionsProps) {
  const isEdit = mode === "edit";
  const areaGroups = mapInspectionAreas(survey);
  const noteEntries = mapInspectionNotes(survey, customer);
  const [newNoteText, setNewNoteText] = useState("");

  useEffect(() => {
    if (!isEdit) {
      setNewNoteText("");
    }
  }, [isEdit]);

  async function handleAddNoteClick() {
    const text = newNoteText.trim();
    if (!text || !onAddNote) return;
    await onAddNote(text);
    setNewNoteText("");
  }

  return (
    <>
      <section className={styles.formSection}>
        <div className={`${styles.sectionTitle} ${modalStyles.viewSectionTitle}`}>
          <ClipboardCheck size={22} color={PRIMARY_ICON} /> Site Details
        </div>

        {areaGroups.length ? (
          <div className={modalStyles.siteDetailsStack}>
            {areaGroups.map((group) => (
              <InspectionAreaBlock
                key={group.id}
                group={group}
                isEdit={isEdit}
                verificationEdits={verificationEdits}
                onVerificationChange={onVerificationChange}
                onViewImages={onViewImages}
              />
            ))}
          </div>
        ) : (
          <div className={modalStyles.viewEmptyState}>No site details found for this inspection.</div>
        )}
      </section>

      <section className={styles.formSection}>
        <div className={`${styles.sectionTitle} ${modalStyles.viewSectionTitle}`}>
          <FileText size={22} color={PRIMARY_ICON} /> Notes
        </div>
        <NotesList entries={noteEntries} />

        {isEdit && onAddNote ? (
          <div className={modalStyles.notesAddBlock}>
            <label htmlFor="inspection-new-note">New note</label>
            <textarea
              id="inspection-new-note"
              className={styles.formInput}
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Enter note text..."
              rows={4}
              style={{ width: "100%", resize: "vertical", minHeight: "100px" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
              <button
                type="button"
                className={styles.addBtn}
                onClick={handleAddNoteClick}
                disabled={addingNote || !newNoteText.trim()}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
              >
                {addingNote ? <Loader2 size={16} className={styles.spinner} /> : <Plus size={16} />}
                {addingNote ? "Adding..." : "Add Note"}
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
