import { adminApi } from "@/lib/api";
import {
  mapSurveyQuotationListItem,
  resolveCustomerId,
  type SurveyQuotationApiRow,
  type WorkflowQuotationRow,
} from "@/lib/quotation-utils";
import {
  mapInstallationSurveyRow,
  mapInspectionSurveyRow,
  mapInspectionCustomerRow,
} from "@/lib/workflow-installation";
import { fetchWorkflowSurveyRows, type WorkflowSurveyRow } from "@/lib/workflow-surveys-list";
import { resolveId } from "@/lib/mappers/normalize";

export type WorkflowTab = "Surveys" | "Quotations" | "Installations" | "Inspections";

export interface WorkflowCustomerMeta {
  leadId: string;
  salesManagerName: string;
  salesPersonName: string;
}

export type WorkflowInstallationRow = ReturnType<typeof mapInstallationSurveyRow>;
export type WorkflowInspectionRow =
  | ReturnType<typeof mapInspectionSurveyRow>
  | ReturnType<typeof mapInspectionCustomerRow>;

export type WorkflowTabRow =
  | WorkflowSurveyRow
  | WorkflowQuotationRow
  | WorkflowInstallationRow
  | WorkflowInspectionRow;

export function buildWorkflowCustomerMetaMap(
  customers: unknown[]
): Map<string, WorkflowCustomerMeta> {
  const map = new Map<string, WorkflowCustomerMeta>();

  if (!Array.isArray(customers)) return map;

  for (const raw of customers) {
    const row = raw as Record<string, unknown>;
    const id = resolveId(row);
    if (!id) continue;

    map.set(id, {
      leadId: String(row.lead_id || row.leadId || ""),
      salesManagerName: String(row.salesManagerName || "").trim(),
      salesPersonName: String(row.salesPersonName || "").trim(),
    });
  }

  return map;
}

export async function loadWorkflowCustomerMetaMap(): Promise<
  Map<string, WorkflowCustomerMeta>
> {
  const response = await adminApi.getCustomers();
  const customers = response.customers || response.data || [];
  return buildWorkflowCustomerMetaMap(
    Array.isArray(customers) ? customers : []
  );
}

export async function fetchWorkflowSurveysTab(): Promise<{
  rows: WorkflowSurveyRow[];
  total: number;
}> {
  return fetchWorkflowSurveyRows();
}

export async function fetchWorkflowQuotationsTab(
  customerMeta?: Map<string, WorkflowCustomerMeta>
): Promise<{ rows: WorkflowQuotationRow[]; total: number }> {
  const [quotationsRes, metaMap] = await Promise.all([
    adminApi.getQuotationsAdmin(),
    customerMeta
      ? Promise.resolve(customerMeta)
      : loadWorkflowCustomerMetaMap(),
  ]);

  const quotations = (quotationsRes.quotations || []) as SurveyQuotationApiRow[];
  const rows = quotations.map((row, index) => {
    const customerId = resolveCustomerId(row.customerId);
    const meta = metaMap.get(customerId);
    return mapSurveyQuotationListItem(row, index, meta);
  });

  return {
    rows,
    total: quotationsRes.total ?? rows.length,
  };
}

export async function fetchWorkflowInstallationsTab(): Promise<{
  rows: WorkflowInstallationRow[];
  total: number;
}> {
  const response = await adminApi.getInstallations();
  const surveys =
    response.surveys || response.installations || response.data || [];
  const rows = (Array.isArray(surveys) ? surveys : []).map(
    (survey: Record<string, unknown>) => mapInstallationSurveyRow(survey)
  );

  return {
    rows,
    total: response.total ?? rows.length,
  };
}

export async function fetchWorkflowInspectionsTab(): Promise<{
  rows: WorkflowInspectionRow[];
  total: number;
}> {
  const [inspectionsRes, installationsRes] = await Promise.all([
    adminApi.getInspections(),
    adminApi.getInstallations(),
  ]);

  const legacyCustomers = inspectionsRes.customers || inspectionsRes.data || [];
  const legacyRows = (Array.isArray(legacyCustomers) ? legacyCustomers : []).map(
    (customer: Record<string, unknown>) => mapInspectionCustomerRow(customer)
  );

  const installationSurveys =
    installationsRes.surveys ||
    installationsRes.installations ||
    installationsRes.data ||
    [];

  const submittedRows = (Array.isArray(installationSurveys) ? installationSurveys : [])
    .filter((survey: Record<string, unknown>) => {
      const installationStatus = String(
        survey.installationStatus || ""
      ).toLowerCase();
      const inspectionStatus = String(survey.inspectionStatus || "").toLowerCase();
      return (
        installationStatus === "submitted" ||
        ["confirm", "submitted", "verified", "in_progress", "reopen"].includes(
          inspectionStatus
        )
      );
    })
    .map((survey: Record<string, unknown>) => mapInspectionSurveyRow(survey));

  const mergedBySurvey = new Map<string, WorkflowInspectionRow>();
  for (const row of submittedRows) {
    if (row.surveyId) mergedBySurvey.set(row.surveyId, row);
  }

  const legacyOnly = legacyRows.filter((row) => {
    if (!row.surveyId) return true;
    return !mergedBySurvey.has(row.surveyId);
  });

  const rows = [...mergedBySurvey.values(), ...legacyOnly];
  return { rows, total: rows.length };
}

export async function fetchWorkflowTabData(
  tab: WorkflowTab,
  customerMeta?: Map<string, WorkflowCustomerMeta>
): Promise<{ rows: WorkflowTabRow[]; total: number }> {
  switch (tab) {
    case "Surveys":
      return fetchWorkflowSurveysTab();
    case "Quotations":
      return fetchWorkflowQuotationsTab(customerMeta);
    case "Installations":
      return fetchWorkflowInstallationsTab();
    case "Inspections":
      return fetchWorkflowInspectionsTab();
    default:
      return { rows: [], total: 0 };
  }
}

function includesQuery(value: unknown, query: string): boolean {
  return String(value || "")
    .toLowerCase()
    .includes(query);
}

export function filterWorkflowRows(
  rows: WorkflowTabRow[],
  tab: WorkflowTab,
  searchTerm: string
): WorkflowTabRow[] {
  const q = searchTerm.trim().toLowerCase();
  if (!q) return rows;

  return rows.filter((item) => {
    const row = item as Record<string, unknown>;

    if (tab === "Surveys") {
      return (
        includesQuery(row.leadId, q) ||
        includesQuery(row.customerId, q) ||
        includesQuery(row.leadName, q) ||
        includesQuery(row.surveyName, q) ||
        includesQuery(row.dba, q) ||
        includesQuery(row.salesPerson, q) ||
        includesQuery(row.salesManager, q) ||
        includesQuery(row.surveyStatus, q)
      );
    }

    if (tab === "Quotations") {
      return (
        includesQuery(row.leadId, q) ||
        includesQuery(row.customerName, q) ||
        includesQuery(row.surveyName, q) ||
        includesQuery(row.salesManager, q) ||
        includesQuery(row.salesPerson, q) ||
        includesQuery(row.statusLabel, q) ||
        includesQuery(row.quotationStatus, q)
      );
    }

    return (
      includesQuery(row.customerName, q) ||
      includesQuery(row.jobId, q) ||
      includesQuery(row.surveyName, q) ||
      includesQuery(row.leadId, q) ||
      includesQuery(row.customerCode, q) ||
      includesQuery(row.dba, q) ||
      includesQuery(row.company, q) ||
      includesQuery(row.salesPerson, q) ||
      includesQuery(row.contractor, q) ||
      includesQuery(row.projectManager, q) ||
      includesQuery(row.status, q) ||
      includesQuery(row.accountNumber, q)
    );
  });
}
