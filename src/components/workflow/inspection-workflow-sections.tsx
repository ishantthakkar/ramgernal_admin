"use client";

import { useEffect, useState } from "react";
import styles from "../../app/(authenticated)/dashboard.module.css";
import modalStyles from "../../app/(authenticated)/workflow/workflow-details.module.css";
import addStyles from "../../app/(authenticated)/leads/add/leads-add.module.css";
import { ClipboardCheck, FileText, Loader2, Plus } from "lucide-react";
import { formatNoteListDateTime } from "@/lib/dateUtils";
import {
  mapInspectionAreas,
  mapInspectionNotes,
  type InspectionAreaGroup,
  type InspectionFixtureRow,
} from "@/lib/workflow-inspection-view";
import type { NoteEntry } from "@/lib/workflow-survey-view";

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
        <ReadOnlyField label="Verified Quantity" value={fixture.verification.verifiedQty} />
        <ReadOnlyField label="Issue Found" value={fixture.verification.issueFound} />
        <div style={{ gridColumn: "1 / -1" }}>
          <ReadOnlyField label="Comments" value={fixture.verification.comments} />
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
        <ReadOnlyField label="Existing Fixture Type" value={fixture.existingFixtureType} />
        <HeightReadOnlyField heightFt={fixture.heightFt} heightIn={fixture.heightIn} />
        <ReadOnlyField label="Existing Bulb" value={fixture.existingBulbs} />
        <ReadOnlyField label="Existing Quantity" value={fixture.existingQuantity} />
      </div>

      <div className={`${styles.formGroup} ${modalStyles.siteMediaBlock}`}>
        <label>Images / Videos</label>
        <ImageThumbnails images={fixture.images} title={fixtureLabel} onViewImages={onViewImages} />
      </div>

      <div className={styles.formGrid}>
        <ReadOnlyField label="Proposed Fixture" value={fixture.proposedFixture} />
        <ReadOnlyField label="Proposed Quantity" value={fixture.proposedQuantity} />
        <div style={{ gridColumn: "1 / -1" }}>
          <ReadOnlyField label="Note" value={fixture.note} />
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
        <ReadOnlyField label="Area Name" value={group.areaName} />
        <ReadOnlyField label="Area Note" value={group.note} />
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
        <div className={addStyles.emptyState}>No fixture details for this area.</div>
      )}
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
        <div className={styles.sectionTitle}>
          <ClipboardCheck size={22} color="var(--admin-primary, #004d4d)" /> Site Details
        </div>
        <p className={styles.sectionSubtitle}>
          Fixture details and verification inputs recorded during inspection.
        </p>

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
          <div className={addStyles.emptyState}>No site details found for this inspection.</div>
        )}
      </section>

      <section className={styles.formSection}>
        <div className={modalStyles.notesSectionTitle}>
          <span className={modalStyles.notesSectionIcon} aria-hidden>
            <FileText size={22} color="#ea580c" strokeWidth={2} />
          </span>
          Notes
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
                className={addStyles.modalSaveBtn}
                onClick={handleAddNoteClick}
                disabled={addingNote || !newNoteText.trim()}
                style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
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
