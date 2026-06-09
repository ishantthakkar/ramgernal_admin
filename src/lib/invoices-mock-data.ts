export type InvoiceStatus = "Recived" | "Pending";

export interface InvoiceRow {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  customer: string;
  customerId: string;
  status: InvoiceStatus;
}

const CUSTOMERS = [
  { name: "Main Manufacturing", id: "CC/2401/18001" },
  { name: "Skiline Electricals", id: "CC/2401/18001" },
  { name: "Brightline HVAC", id: "CC/2401/18002" },
  { name: "Northgate Retail", id: "CC/2401/18003" },
  { name: "Summit Logistics", id: "CC/2401/18004" },
  { name: "Harbor Foods", id: "CC/2401/18005" },
];

function buildInvoiceDate(index: number): string {
  const base = new Date("2026-05-10");
  base.setDate(base.getDate() - (index % 45));
  return base.toISOString().slice(0, 10);
}

const SEED_ROWS: InvoiceRow[] = [
  {
    id: "inv-1",
    invoiceNo: "12345",
    invoiceDate: "2026-05-10",
    customer: "Main Manufacturing",
    customerId: "CC/2401/18001",
    status: "Recived",
  },
  {
    id: "inv-2",
    invoiceNo: "12345",
    invoiceDate: "2026-05-10",
    customer: "Main Manufacturing",
    customerId: "CC/2401/18001",
    status: "Recived",
  },
  {
    id: "inv-3",
    invoiceNo: "12345",
    invoiceDate: "2026-05-10",
    customer: "Skiline Electricals",
    customerId: "CC/2401/18001",
    status: "Pending",
  },
  {
    id: "inv-4",
    invoiceNo: "12345",
    invoiceDate: "2026-05-10",
    customer: "Skiline Electricals",
    customerId: "CC/2401/18001",
    status: "Pending",
  },
];

function buildMockInvoices(total: number): InvoiceRow[] {
  const rows = [...SEED_ROWS];

  for (let index = SEED_ROWS.length; index < total; index += 1) {
    const customer = CUSTOMERS[index % CUSTOMERS.length];
    rows.push({
      id: `inv-${index + 1}`,
      invoiceNo: String(12345 + (index % 240)),
      invoiceDate: buildInvoiceDate(index),
      customer: customer.name,
      customerId: customer.id,
      status: index % 2 === 0 ? "Recived" : "Pending",
    });
  }

  return rows;
}

export const STATIC_INVOICE_TOTAL = 1284;
export const MOCK_INVOICES: InvoiceRow[] = buildMockInvoices(STATIC_INVOICE_TOTAL);
