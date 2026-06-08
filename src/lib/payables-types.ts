export interface SalesPersonPayableRow {
  id: string;
  customerId: string;
  surveyId: string;
  legalName: string;
  salesPerson: string;
  surveyName: string;
  surveyDate: string;
  quotationNumber: string;
  confirmed: string;
  quotationAmount: number;
  commission: number;
  paid: number;
  pending: number;
}

export interface ContractorPayableRow {
  id: string;
  customerId: string;
  surveyId: string;
  legalName: string;
  dba: string;
  contractor: string;
  jobNo: string;
  surveyName: string;
  installDate: string;
  totalCharges: number;
  commission: number;
  paid: number;
  pending: number;
}

export interface PayablesSummary {
  totalCommission: number;
  totalPaid: number;
  totalPending: number;
}

export interface PayablesListResponse {
  salesPersons: SalesPersonPayableRow[];
  contractors: ContractorPayableRow[];
  overallSummary: {
    salesPersons: PayablesSummary;
    contractors: PayablesSummary;
  };
}
