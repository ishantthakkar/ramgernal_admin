"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "react-toastify";
import { adminApi } from "@/lib/api";
import {
  isSurveyVerified,
  resolveSurveyId,
  resolveSurveyName,
  type SurveyRecord,
} from "@/lib/workflow-survey-view";
import modalStyles from "@/app/(authenticated)/workflow/assign-modal.module.css";
import workflowStyles from "@/app/(authenticated)/workflow/workflow.module.css";

interface WorkflowSurveyListModalProps {
  customerId: string;
  customerName: string;
  customerStatus?: string;
  canApproveEdits: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

interface SurveyRow {
  id: string;
  name: string;
  status: string;
  isVerified: boolean;
}

function formatSurveyStatus(status: string): string {
  if (status === "pending_edit_approval") return "Pending Approval";
  if (status === "reopen" || status === "reopened") return "Reopened";
  if (status?.toLowerCase() === "completed") return "Completed";
  if (!status) return "N/A";
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

function getStatusStyle(status: string) {
  if (!status || status === "-") return { color: "#94a3b8" };
  switch (status.toLowerCase()) {
    case "completed":
      return { color: "#94a3b8" };
    case "verified":
      return { color: "#3b82f6" };
    case "pending":
    case "not started":
    case "draft":
      return { color: "#ef4444" };
    case "in progress":
    case "in-process":
    case "in process":
    case "in_progress":
      return { color: "#10b981" };
    case "reopened":
    case "reopen":
      return { color: "#fbbf24" };
    case "pending_edit_approval":
      return { color: "#d97706" };
    case "submitted":
      return { color: "#3b82f6" };
    default:
      return { color: "#64748b" };
  }
}

function mapSurveyRows(surveys: SurveyRecord[]): SurveyRow[] {
  return surveys.map((survey, index) => ({
    id: resolveSurveyId(survey),
    name: resolveSurveyName(survey, index),
    status: survey.status || "Pending",
    isVerified: isSurveyVerified(survey),
  }));
}

export function WorkflowSurveyListModal({
  customerId,
  customerName,
  customerStatus,
  canApproveEdits,
  onClose,
  onUpdated,
}: WorkflowSurveyListModalProps) {
  const [loading, setLoading] = useState(true);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [surveys, setSurveys] = useState<SurveyRow[]>([]);

  const loadSurveys = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getCustomerWorkflowDetails(customerId);
      const rawSurveys = (response.surveys || []) as SurveyRecord[];
      setSurveys(mapSurveyRows(rawSurveys));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load surveys.";
      toast.error(message);
      setSurveys([]);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  const handleAdminApproval = async (status: "Approved" | "Rejected") => {
    if (
      !window.confirm(
        `Are you sure you want to ${status.toLowerCase()} the survey edits for ${customerName}?`
      )
    ) {
      return;
    }

    setApprovalLoading(true);
    try {
      const response = await adminApi.adminApproval(customerId, status);
      toast.success(response.message || `Survey edits ${status.toLowerCase()} successfully!`);
      onUpdated();
      await loadSurveys();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : `Failed to ${status.toLowerCase()} survey edits.`;
      toast.error(message);
    } finally {
      setApprovalLoading(false);
    }
  };

  const showPendingApproval =
    customerStatus?.toLowerCase() === "pending_edit_approval" && canApproveEdits;

  return (
    <div className={modalStyles.modalOverlay} onClick={onClose}>
      <div
        className={`${modalStyles.modalContent} ${workflowStyles.surveyModalContent}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={modalStyles.modalHeader}>
          <div>
            <h3>Surveys</h3>
            <p className={workflowStyles.surveyModalSubtitle}>{customerName}</p>
          </div>
          <button type="button" className={modalStyles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={`${modalStyles.modalBody} ${workflowStyles.surveyModalBody}`}>
          {showPendingApproval ? (
            <div className={workflowStyles.surveyApprovalBanner}>
              <span>Survey edits are pending approval.</span>
              <div className={workflowStyles.actionGroup}>
                <button
                  type="button"
                  className={workflowStyles.btnSuccess}
                  disabled={approvalLoading}
                  onClick={() => handleAdminApproval("Approved")}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className={workflowStyles.btnDanger}
                  disabled={approvalLoading}
                  onClick={() => handleAdminApproval("Rejected")}
                >
                  Reject
                </button>
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className={modalStyles.modalLoading}>
              <Loader2 size={40} className={modalStyles.spinner} />
              <p>Loading surveys...</p>
            </div>
          ) : surveys.length === 0 ? (
            <div className={modalStyles.emptyState}>
              <p>No surveys found for this customer.</p>
            </div>
          ) : (
            <div className={workflowStyles.surveyList}>
              {surveys.map((survey, index) => (
                <div key={survey.id || `survey-${index}`} className={workflowStyles.surveyListItem}>
                  <div className={workflowStyles.surveyListMain}>
                    <span className={workflowStyles.surveyListName}>{survey.name}</span>
                    <div className={workflowStyles.surveyListMeta}>
                      <div className={workflowStyles.surveyListField}>
                        <span className={workflowStyles.surveyListLabel}>Survey Status</span>
                        <span
                          className={workflowStyles.surveyListValue}
                          style={{ color: getStatusStyle(survey.status).color }}
                        >
                          {formatSurveyStatus(survey.status)}
                        </span>
                      </div>
                      <div className={workflowStyles.surveyListField}>
                        <span className={workflowStyles.surveyListLabel}>Verify</span>
                        {survey.isVerified ? (
                          <span className={workflowStyles.verifiedLabel}>Verified</span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "0.875rem", fontWeight: 600 }}>
                            —
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
