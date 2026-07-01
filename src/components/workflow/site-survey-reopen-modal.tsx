"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import modalStyles from "@/app/(authenticated)/workflow/assign-modal.module.css";
import detailStyles from "@/app/(authenticated)/workflow/workflow-details.module.css";

interface SiteSurveyReopenModalProps {
  surveyName: string;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: { title: string; note: string }) => Promise<void>;
  modalTitle?: string;
  submitLabel?: string;
}

export function SiteSurveyReopenModal({
  surveyName,
  loading,
  onClose,
  onSubmit,
  modalTitle = "Reopen Survey",
  submitLabel = "Reopen Survey",
}: SiteSurveyReopenModalProps) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedNote = note.trim();
    if (!trimmedNote) return;
    await onSubmit({ title: title.trim(), note: trimmedNote });
  };

  return (
    <div className={modalStyles.modalOverlay} onClick={onClose}>
      <div
        className={modalStyles.modalContent}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-labelledby="reopen-survey-title"
      >
        <div className={modalStyles.modalHeader}>
          <div>
            <h3 id="reopen-survey-title">{modalTitle}</h3>
            <p className={detailStyles.reopenModalSubtitle}>{surveyName}</p>
          </div>
          <button type="button" className={modalStyles.closeBtn} onClick={onClose} disabled={loading}>
            <X size={24} />
          </button>
        </div>

        <form className={modalStyles.modalBody} onSubmit={handleSubmit}>
          <div className={detailStyles.reopenFormGroup}>
            <label htmlFor="reopen-title">Title</label>
            <input
              id="reopen-title"
              type="text"
              className={detailStyles.reopenInput}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Missing fixtures"
              disabled={loading}
            />
          </div>

          <div className={detailStyles.reopenFormGroup}>
            <label htmlFor="reopen-note">
              Note <span className={detailStyles.reopenRequired}>*</span>
            </label>
            <textarea
              id="reopen-note"
              className={detailStyles.reopenTextarea}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Please re-verify area 2 fixtures"
              rows={4}
              required
              disabled={loading}
            />
          </div>

          <div className={detailStyles.reopenModalActions}>
            <button
              type="button"
              className={detailStyles.reopenCancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={detailStyles.reopenSubmitBtn}
              disabled={loading || !note.trim()}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className={detailStyles.reopenSpinner} />
                  Reopening...
                </>
              ) : (
                submitLabel
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
