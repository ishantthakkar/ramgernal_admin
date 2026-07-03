"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2, X } from "lucide-react";
import addStyles from "@/app/(authenticated)/leads/add/leads-add.module.css";
import surveyStyles from "@/app/(authenticated)/customers/[id]/customer-survey.module.css";
import {
  ELECTRIC_COMPANIES,
  type SurveyTypeValue,
} from "@/lib/customer-survey";

interface CreateSurveyModalProps {
  open: boolean;
  saving: boolean;
  initialElectricCompany?: string;
  onClose: () => void;
  onSubmit: (payload: {
    surveyName: string;
    surveyType: SurveyTypeValue;
    electricCompany: string;
  }) => void;
}

export function CreateSurveyModal({
  open,
  saving,
  initialElectricCompany = "",
  onClose,
  onSubmit,
}: CreateSurveyModalProps) {
  const [surveyName, setSurveyName] = useState("");
  const [surveyType, setSurveyType] = useState<SurveyTypeValue>("utility");
  const [electricCompany, setElectricCompany] = useState("");
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setSurveyName("");
      setSurveyType("utility");
      const preset = String(initialElectricCompany || "").trim();
      const matched = ELECTRIC_COMPANIES.find(
        (company) => company.toLowerCase() === preset.toLowerCase()
      );
      setElectricCompany(matched || preset);
    }
    wasOpenRef.current = open;
  }, [open, initialElectricCompany]);

  if (!open) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = surveyName.trim();
    const company = electricCompany.trim();
    if (!name) return;
    if (surveyType === "utility" && !company) return;
    onSubmit({
      surveyName: name,
      surveyType,
      electricCompany: surveyType === "utility" ? company : "",
    });
  };

  const canSubmit =
    surveyName.trim().length > 0 &&
    (surveyType === "direct" || electricCompany.trim().length > 0);

  return (
    <div className={addStyles.modalBackdrop} onClick={onClose}>
      <div className={addStyles.modalContainer} onClick={(event) => event.stopPropagation()}>
        <div className={addStyles.modalHeader}>
          <h3 className={addStyles.modalTitle}>Create Survey</h3>
          <button type="button" className={addStyles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={addStyles.modalBody}>
            <div className={addStyles.formGroup}>
              <label htmlFor="survey-name">
                Survey Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                id="survey-name"
                className={addStyles.formInput}
                placeholder="Enter survey name"
                value={surveyName}
                onChange={(event) => setSurveyName(event.target.value)}
                required
              />
            </div>

            <div className={addStyles.formGroup}>
              <label>
                Survey Type <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div className={surveyStyles.typeToggleGroup}>
                {(["utility", "direct"] as SurveyTypeValue[]).map((type) => {
                  const selected = surveyType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      className={`${surveyStyles.typeToggleBtn} ${
                        selected ? surveyStyles.typeToggleBtnActive : ""
                      }`}
                      onClick={() => setSurveyType(type)}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {surveyType === "utility" ? (
              <div className={addStyles.formGroup}>
                <label htmlFor="electric-company">
                  Utility / Electric Company <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    id="electric-company"
                    className={addStyles.formSelect}
                    value={electricCompany}
                    onChange={(event) => setElectricCompany(event.target.value)}
                    required
                  >
                    <option value="">Select electric company</option>
                    {ELECTRIC_COMPANIES.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={18}
                    style={{
                      position: "absolute",
                      right: "1rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      color: "#64748b",
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className={addStyles.modalFooter}>
            <button
              type="button"
              className={addStyles.modalCancelBtn}
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={addStyles.modalSaveBtn}
              disabled={saving || !canSubmit}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="spinner" style={{ marginRight: 6 }} />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
