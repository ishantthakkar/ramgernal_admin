import { adminApi } from "@/lib/api";
import {
  isWorkflowCustomerRow,
  isWorkflowSurveyRecord,
  mapWorkflowSurveyRow,
  mapWorkflowSurveyRowFromCustomer,
} from "@/lib/workflow-installation";

export type WorkflowSurveyRow = ReturnType<typeof mapWorkflowSurveyRow>;

async function fetchWorkflowSurveyRowsFromCustomers(): Promise<WorkflowSurveyRow[]> {
  const customersRes = await adminApi.getCustomers();
  const customers = (customersRes.customers || []) as Record<string, unknown>[];
  const eligible = customers.filter(isWorkflowCustomerRow);

  if (!eligible.length) {
    return [];
  }

  const details = await Promise.all(
    eligible.map(async (customer) => {
      const id = String(customer.id || customer._id || "");
      if (!id) {
        return { surveys: [] as Record<string, unknown>[] };
      }
      try {
        const response = await adminApi.getCustomerWorkflowDetails(id);
        return { surveys: (response.surveys || []) as Record<string, unknown>[] };
      } catch {
        return { surveys: [] as Record<string, unknown>[] };
      }
    })
  );

  const rows: WorkflowSurveyRow[] = [];

  eligible.forEach((customer, index) => {
    const verifyStatus = String(customer.verifyStatus || "");
    for (const survey of details[index]?.surveys || []) {
      if (!isWorkflowSurveyRecord(survey, verifyStatus)) {
        continue;
      }
      rows.push(mapWorkflowSurveyRowFromCustomer(customer, survey));
    }
  });

  return rows;
}

export async function fetchWorkflowSurveyRows(): Promise<{
  rows: WorkflowSurveyRow[];
  total: number;
}> {
  try {
    const response = await adminApi.getWorkflowSurveys();
    const surveys = response.surveys || response.data || [];
    const rows = (Array.isArray(surveys) ? surveys : []).map((survey) =>
      mapWorkflowSurveyRow(survey as Record<string, unknown>)
    );
    return {
      rows,
      total: response.total ?? rows.length,
    };
  } catch {
    const rows = await fetchWorkflowSurveyRowsFromCustomers();
    return {
      rows,
      total: rows.length,
    };
  }
}
