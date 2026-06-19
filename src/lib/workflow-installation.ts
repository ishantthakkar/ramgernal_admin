import {
  resolveSurveyContractorName,
  resolveSurveyProjectManagerName,
  resolveSurveySalesPersonName,
} from "@/lib/workflow-installation-details";

export function resolveCustomerDba(
  customer: Record<string, unknown> | null | undefined
): string {
  if (!customer) return "";
  const lead =
    customer.leadId && typeof customer.leadId === "object"
      ? (customer.leadId as Record<string, unknown>)
      : null;

  return (
    String(customer.dba || "").trim() ||
    String(lead?.dba || "").trim()
  );
}

export function formatInspectionStatusLabel(value: string): string {
  const status = String(value || "").trim().toLowerCase();
  if (!status || status === "to-do") return "To Do";
  if (status === "in_progress") return "In Progress";
  if (status === "confirm") return "Pending Review";
  if (status === "submitted") return "Submitted";
  if (status === "verified") return "Verified";
  if (status === "reopen") return "Reopened";
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

export function isAdminInspectionVerified(value: string): boolean {
  return String(value || "").trim().toLowerCase() === "verified";
}

export function isInspectionReadyForAdminVerify(value: string): boolean {
  const status = String(value || "").trim().toLowerCase();
  if (!status || status === "verified") return false;
  return ["confirm", "submitted", "in_progress", "to-do", "reopen"].includes(status);
}

export function formatAdminInspectionApprovalLabel(value: string): string {
  if (isAdminInspectionVerified(value)) return "Verified";
  const status = String(value || "").trim().toLowerCase();
  if (status === "submitted") return "Awaiting Approval";
  if (status === "confirm") return "Pending Review";
  if (isInspectionReadyForAdminVerify(value)) return "Awaiting Approval";
  return "Pending";
}

export function getAdminInspectionApprovalColor(value: string): string {
  if (isAdminInspectionVerified(value)) return "#10b981";
  const status = String(value || "").trim().toLowerCase();
  if (status === "submitted") return "#3b82f6";
  if (status === "confirm") return "#f59e0b";
  if (isInspectionReadyForAdminVerify(value)) return "#f59e0b";
  return "#94a3b8";
}

/** @deprecated use isAdminInspectionVerified */
export function isAdminInspectionConfirmed(value: string): boolean {
  return isAdminInspectionVerified(value);
}

export function formatWorkflowSurveyStatusLabel(value: string): string {
  const status = String(value || "").trim().toLowerCase();
  if (!status) return "N/A";
  if (status === "verified") return "Verified";
  if (status === "pending_edit_approval") return "Pending Approval";
  if (status === "reopen" || status === "reopened") return "Reopened";
  if (status === "in_progress") return "In Progress";
  if (status === "submitted") return "Submitted";
  if (status === "completed") return "Completed";
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

const WORKFLOW_SURVEY_STATUSES = [
  "submitted",
  "completed",
  "reopened",
  "reopen",
  "pending_edit_approval",
];

function isSurveyRecordVerified(survey: Record<string, unknown>): boolean {
  const confirmDate = survey.confirmDate;
  return (
    confirmDate != null &&
    confirmDate !== "" &&
    !Number.isNaN(new Date(String(confirmDate)).getTime())
  );
}

export function isWorkflowCustomerRow(customer: Record<string, unknown>): boolean {
  if (String(customer.verifyStatus || "").toLowerCase() === "verified") {
    return true;
  }
  const status = String(customer.status || "").trim().toLowerCase();
  return WORKFLOW_SURVEY_STATUSES.includes(status);
}

export function isWorkflowSurveyRecord(
  survey: Record<string, unknown>,
  customerVerifyStatus: string
): boolean {
  if (String(customerVerifyStatus || "").toLowerCase() === "verified") {
    return true;
  }
  if (isSurveyRecordVerified(survey)) {
    return true;
  }
  const status = String(survey.status || "").trim().toLowerCase();
  return WORKFLOW_SURVEY_STATUSES.includes(status);
}

export function mapWorkflowSurveyRowFromCustomer(
  customer: Record<string, unknown>,
  survey: Record<string, unknown>
) {
  const customerId = String(customer.id || customer._id || "");
  const lead =
    customer.leadId && typeof customer.leadId === "object"
      ? (customer.leadId as Record<string, unknown>)
      : {
          lead_id: customer.lead_id,
          leadName: customer.leadName,
          dba: customer.dba,
        };

  const row = mapWorkflowSurveyRow({
    ...survey,
    customer_id: {
      ...customer,
      _id: customerId,
      leadId: lead,
    },
  });

  const salesManagerName = String(customer.salesManagerName || "").trim();
  const salesPersonName = String(customer.salesPersonName || "").trim();

  return {
    ...row,
    salesManager: salesManagerName || row.salesManager,
    salesPerson: salesPersonName || row.salesPerson,
  };
}

function resolveSalesManagerName(
  customer: Record<string, unknown> | null | undefined
): string {
  if (!customer) return "";
  const user =
    customer.user_id && typeof customer.user_id === "object"
      ? (customer.user_id as Record<string, unknown>)
      : null;
  const supervisor =
    user?.reportsTo && typeof user.reportsTo === "object"
      ? (user.reportsTo as Record<string, unknown>)
      : null;
  if (!supervisor) return "";
  const role = String(supervisor.userRole || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ");
  if (role === "sales manager") {
    return String(supervisor.fullName || "").trim();
  }
  return "";
}

export function mapWorkflowSurveyRow(survey: Record<string, unknown>) {
  const customer = survey.customer_id as Record<string, unknown> | null | undefined;
  const customerObj =
    customer && typeof customer === "object" ? customer : null;
  const customerId = customerObj ? String(customerObj._id || "") : "";

  const lead =
    customerObj?.leadId && typeof customerObj.leadId === "object"
      ? (customerObj.leadId as Record<string, unknown>)
      : null;

  const confirmDate = survey.confirmDate;
  const isVerified =
    confirmDate != null &&
    confirmDate !== "" &&
    !Number.isNaN(new Date(String(confirmDate)).getTime());
  const statusRaw = isVerified
    ? "verified"
    : String(survey.status || "Pending");

  const surveyName = String(
    survey.surveyName || survey.areaName || "Survey"
  ).trim();

  return {
    _id: customerId,
    rowId: String(survey._id || ""),
    surveyId: String(survey._id || ""),
    customerId,
    leadId: String(lead?.lead_id || ""),
    leadName: String(customerObj?.name || lead?.leadName || ""),
    dba: resolveCustomerDba(customerObj) || "—",
    surveyName: surveyName || "Survey",
    salesPerson: resolveSurveySalesPersonName(survey, customerObj) || "Unassigned",
    salesManager: resolveSalesManagerName(customerObj),
    surveyStatus: formatWorkflowSurveyStatusLabel(statusRaw),
    surveyStatusRaw: statusRaw,
    verifyStatus: isVerified ? "verified" : "pending",
    date: survey.surveyDate || survey.updatedAt || survey.createdAt,
  };
}

export function mapInstallationSurveyRow(survey: Record<string, unknown>) {
  const customer = survey.customer_id as Record<string, unknown> | string | null | undefined;
  const customerObj =
    customer && typeof customer === "object" ? customer : null;
  const customerId = customerObj
    ? String(customerObj._id || "")
    : String(customer || "");

  const lead =
    customerObj?.leadId && typeof customerObj.leadId === "object"
      ? (customerObj.leadId as Record<string, unknown>)
      : null;

  const contractorName = resolveSurveyContractorName(survey);
  const projectManagerName = resolveSurveyProjectManagerName(survey);

  const dba = resolveCustomerDba(customerObj) || "-";

  return {
    _id: customerId,
    rowId: String(survey._id || ""),
    surveyId: String(survey._id || ""),
    surveyName: String(survey.surveyName || ""),
    jobId: String(survey.job_id || ""),
    customerCode: String(customerObj?.customerCode || ""),
    leadId: String(lead?.lead_id || ""),
    accountNumber: String(customerObj?.accountNumber || "N/A"),
    customerName: String(customerObj?.name || "Unknown"),
    company: dba,
    salesPerson: resolveSurveySalesPersonName(survey, customerObj) || "Unassigned",
    contractor: contractorName || "Unassigned",
    projectManager: projectManagerName || "Unassigned",
    assignedTo: survey.assignedTo,
    status: String(
      survey.installationStatus || survey.status || "not started"
    ),
    quotationStatus: String(survey.quotationStatus || "approved"),
    survey,
  };
}

export function mapInspectionSurveyRow(survey: Record<string, unknown>) {
  const base = mapInstallationSurveyRow(survey);
  const customer = survey.customer_id;
  const customerObj =
    customer && typeof customer === "object"
      ? (customer as Record<string, unknown>)
      : null;

  const inspectionStatusRaw = String(
    survey.inspectionStatus || customerObj?.inspectionStatus || "to-do"
  );

  return {
    ...base,
    inspectionStatusRaw,
    status: formatInspectionStatusLabel(inspectionStatusRaw),
  };
}

export function mapInspectionCustomerRow(customer: Record<string, unknown>) {
  const lead =
    customer.leadId && typeof customer.leadId === "object"
      ? (customer.leadId as Record<string, unknown>)
      : null;
  const assignToContractor =
    customer.assignToContractor && typeof customer.assignToContractor === "object"
      ? (customer.assignToContractor as Record<string, unknown>)
      : null;
  const assignedTo =
    customer.assignedTo && typeof customer.assignedTo === "object"
      ? (customer.assignedTo as Record<string, unknown>)
      : null;
  const user =
    customer.user_id && typeof customer.user_id === "object"
      ? (customer.user_id as Record<string, unknown>)
      : null;

  const inspectionStatusRaw = String(customer.inspectionStatus || "to-do");

  return {
    _id: String(customer.id || customer._id || ""),
    rowId: String(customer.id || customer._id || ""),
    surveyId: "",
    customerCode: String(customer.customerCode || ""),
    leadId: String(lead?.lead_id || ""),
    accountNumber: String(customer.accountNumber || "—"),
    customerName: String(customer.name || "Unknown"),
    company: resolveCustomerDba(customer) || "—",
    salesPerson: String(user?.fullName || "Unassigned"),
    contractor:
      String(customer.contractorName || assignToContractor?.fullName || "").trim() ||
      "Unassigned",
    projectManager: String(assignedTo?.fullName || "Unassigned"),
    inspectionStatusRaw,
    status: formatInspectionStatusLabel(inspectionStatusRaw),
  };
}
