import {
  resolveSurveyContractorName,
  resolveSurveyProjectManagerName,
  resolveSurveySalesPersonName,
} from "@/lib/workflow-installation-details";

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
