"use client";

import detailStyles from "@/app/(authenticated)/workflow/workflow-details.module.css";

interface SiteSurveyVerifyControlProps {
  surveyId: string;
  surveyName: string;
  isVerified: boolean;
  canVerify: boolean;
  verifying: boolean;
  onVerify: (surveyId: string, surveyName: string) => void;
  compact?: boolean;
}

export function SiteSurveyVerifyControl({
  surveyId,
  surveyName,
  isVerified,
  canVerify,
  verifying,
  onVerify,
  compact = false,
}: SiteSurveyVerifyControlProps) {
  if (isVerified) {
    return (
      <span
        className={
          compact ? detailStyles.siteSurveyVerifiedLabel : detailStyles.siteSurveyVerifiedBadge
        }
      >
        Verified
      </span>
    );
  }

  if (!canVerify) {
    return <span className={detailStyles.siteSurveyVerifyDash}>—</span>;
  }

  return (
    <button
      type="button"
      className={detailStyles.siteSurveyVerifyBtn}
      disabled={verifying}
      onClick={(event) => {
        event.stopPropagation();
        onVerify(surveyId, surveyName);
      }}
    >
      {verifying ? "Verifying..." : "Verify"}
    </button>
  );
}
