function normalizeRole(userRole?: string): string {
  return (userRole || "").trim().toLowerCase().replace(/_/g, " ");
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

  const salesUser = survey.user_id as Record<string, unknown> | null | undefined;
  const assignedTo = survey.assignedTo as Record<string, unknown> | null | undefined;
  const assignedRole = normalizeRole(assignedTo?.userRole as string | undefined);
  const assignedName = String(assignedTo?.fullName || "");

  let contractor = "Unassigned";
  let projectManager = "Unassigned";

  if (assignedTo && assignedName) {
    if (assignedRole === "contractor") {
      contractor = assignedName;
    } else if (assignedRole === "project manager") {
      projectManager = assignedName;
    } else {
      projectManager = assignedName;
    }
  }

  const company =
    String(customerObj?.company || "").trim() ||
    String(lead?.dba || "").trim() ||
    "-";

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
    company,
    salesPerson: String(salesUser?.fullName || "Unassigned"),
    contractor,
    projectManager,
    assignedTo,
    status: String(
      customerObj?.installationStatus || survey.status || "not started"
    ),
    quotationStatus: String(survey.quotationStatus || "approved"),
    survey,
  };
}
