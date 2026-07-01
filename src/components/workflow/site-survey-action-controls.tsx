"use client";

import { useState } from "react";
import { SiteSurveyVerifyControl } from "@/components/workflow/site-survey-verify-control";
import { SiteSurveyReopenModal } from "@/components/workflow/site-survey-reopen-modal";
import { canReopenSurveyStatus } from "@/lib/workflow-survey-view";
import detailStyles from "@/app/(authenticated)/workflow/workflow-details.module.css";

interface SiteSurveyActionControlsProps {
  surveyId: string;
  surveyName: string;
  isVerified: boolean;
  surveyStatus: string;
  canVerify: boolean;
  canReopen: boolean;
  verifying: boolean;
  reopening: boolean;
  onVerify: (surveyId: string, surveyName: string) => void;
  onReopen: (surveyId: string, payload: { title: string; note: string }) => Promise<void>;
  compact?: boolean;
}

export function SiteSurveyActionControls({
  surveyId,
  surveyName,
  isVerified,
  surveyStatus,
  canVerify,
  canReopen,
  verifying,
  reopening,
  onVerify,
  onReopen,
  compact = false,
}: SiteSurveyActionControlsProps) {
  const [showReopenModal, setShowReopenModal] = useState(false);
  const showReopenButton =
    canReopen && canReopenSurveyStatus({ isVerified, status: surveyStatus });

  const handleReopenSubmit = async (payload: { title: string; note: string }) => {
    await onReopen(surveyId, payload);
    setShowReopenModal(false);
  };

  return (
    <>
      <div className={detailStyles.siteSurveyActions}>
        <SiteSurveyVerifyControl
          surveyId={surveyId}
          surveyName={surveyName}
          isVerified={isVerified}
          canVerify={canVerify}
          verifying={verifying}
          onVerify={onVerify}
          compact={compact}
        />
        {showReopenButton ? (
          <button
            type="button"
            className={
              compact ? detailStyles.siteSurveyReopenBtnCompact : detailStyles.siteSurveyReopenBtn
            }
            disabled={reopening || verifying}
            onClick={(event) => {
              event.stopPropagation();
              setShowReopenModal(true);
            }}
          >
            {reopening ? "Reopening..." : "Reopen"}
          </button>
        ) : null}
      </div>

      {showReopenModal ? (
        <SiteSurveyReopenModal
          surveyName={surveyName}
          loading={reopening}
          onClose={() => {
            if (!reopening) setShowReopenModal(false);
          }}
          onSubmit={handleReopenSubmit}
        />
      ) : null}
    </>
  );
}
