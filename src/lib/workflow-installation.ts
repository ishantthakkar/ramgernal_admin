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
  return ["confirm", "in_progress", "to-do", "reopen"].includes(status);
}

/** @deprecated use isAdminInspectionVerified */
export function isAdminInspectionConfirmed(value: string): boolean {
  return isAdminInspectionVerified(value);
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
