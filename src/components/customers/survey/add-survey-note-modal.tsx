"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import addStyles from "@/app/(authenticated)/leads/add/leads-add.module.css";

interface AddSurveyNoteModalProps {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: { title: string; note: string }) => void;
}

export function AddSurveyNoteModal({
  open,
  saving,
  onClose,
  onSubmit,
}: AddSurveyNoteModalProps) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");

  if (!open) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const noteText = note.trim();
    if (!noteText) return;
    onSubmit({ title: title.trim(), note: noteText });
  };

  return (
    <div className={addStyles.modalBackdrop} onClick={onClose}>
      <div className={addStyles.modalContainer} onClick={(event) => event.stopPropagation()}>
        <div className={addStyles.modalHeader}>
          <h3 className={addStyles.modalTitle}>Add Note</h3>
          <button type="button" className={addStyles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={addStyles.modalBody}>
            <div className={addStyles.formGroup}>
              <label htmlFor="note-title">Title</label>
              <input
                id="note-title"
                className={addStyles.formInput}
                placeholder="Enter note title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div className={addStyles.formGroup}>
              <label htmlFor="note-text">
                Note <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea
                id="note-text"
                className={addStyles.formInput}
                placeholder="Enter note"
                rows={4}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                required
              />
            </div>
          </div>

          <div className={addStyles.modalFooter}>
            <button type="button" className={addStyles.modalCancelBtn} onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              type="submit"
              className={addStyles.modalSaveBtn}
              disabled={saving || !note.trim()}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
