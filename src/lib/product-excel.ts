import * as XLSX from "xlsx";
import type { ProductFormData } from "@/components/modals/AddProductModal";

export const PRODUCT_EXCEL_HEADERS = [
  "SKU",
  "Name",
  "Sales Price",
  "Commission",
  "Installation Cost",
] as const;

const TEMPLATE_EXAMPLE: ProductFormData = {
  sku: "RAM-EXAMPLE-001",
  name: "Example Product Name",
  salesPrice: 99.99,
  commission: 10,
  installationCost: 25,
};

export interface ProductExcelRow extends ProductFormData {
  rowNumber: number;
}

export interface ProductExcelParseError {
  rowNumber: number;
  message: string;
}

export interface ProductExcelParseResult {
  rows: ProductExcelRow[];
  errors: ProductExcelParseError[];
}

function normalizeHeaderKey(key: string): string {
  return key.trim().toLowerCase().replace(/[_\s]+/g, "");
}

const HEADER_FIELD_MAP: Record<string, keyof ProductFormData> = {
  sku: "sku",
  name: "name",
  salesprice: "salesPrice",
  commission: "commission",
  installationcost: "installationCost",
};

function parseMoneyCell(value: unknown, fieldLabel: string): { value?: number; error?: string } {
  if (value === undefined || value === null || value === "") {
    return { error: `${fieldLabel} is required.` };
  }

  const raw =
    typeof value === "number"
      ? value
      : parseFloat(String(value).replace(/[$,\s]/g, ""));

  if (isNaN(raw) || raw < 0) {
    return { error: `${fieldLabel} must be a valid non-negative number.` };
  }

  return { value: raw };
}

function isEmptyRow(values: Record<string, unknown>): boolean {
  return Object.values(values).every(
    (v) => v === undefined || v === null || String(v).trim() === ""
  );
}

export function downloadProductTemplate(filename = "products-template.xlsx"): void {
  const sheetData = [
    [...PRODUCT_EXCEL_HEADERS],
    [
      TEMPLATE_EXAMPLE.sku,
      TEMPLATE_EXAMPLE.name,
      TEMPLATE_EXAMPLE.salesPrice,
      TEMPLATE_EXAMPLE.commission,
      TEMPLATE_EXAMPLE.installationCost,
    ],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
  XLSX.writeFile(workbook, filename);
}

export function exportProductsToExcel(
  products: ProductFormData[],
  filename = "products-export.xlsx"
): void {
  const sheetData = [
    [...PRODUCT_EXCEL_HEADERS],
    ...products.map((p) => [
      p.sku,
      p.name,
      p.salesPrice,
      p.commission,
      p.installationCost,
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
  XLSX.writeFile(workbook, filename);
}

export async function parseProductExcelFile(
  file: File
): Promise<ProductExcelParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return {
      rows: [],
      errors: [{ rowNumber: 0, message: "The file has no worksheets." }],
    };
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
  });

  const rows: ProductExcelRow[] = [];
  const errors: ProductExcelParseError[] = [];

  rawRows.forEach((rawRow, index) => {
    const rowNumber = index + 2;

    if (isEmptyRow(rawRow)) {
      return;
    }

    const mapped: Partial<Record<keyof ProductFormData, unknown>> = {};

    for (const [header, value] of Object.entries(rawRow)) {
      const field = HEADER_FIELD_MAP[normalizeHeaderKey(header)];
      if (field) {
        mapped[field] = value;
      }
    }

    const sku = String(mapped.sku ?? "").trim();
    const name = String(mapped.name ?? "").trim();

    if (!sku) {
      errors.push({ rowNumber, message: "SKU is required." });
      return;
    }
    if (!name) {
      errors.push({ rowNumber, message: "Name is required." });
      return;
    }

    const salesPriceResult = parseMoneyCell(mapped.salesPrice, "Sales Price");
    if (salesPriceResult.error) {
      errors.push({ rowNumber, message: salesPriceResult.error });
      return;
    }

    const commissionResult = parseMoneyCell(mapped.commission, "Commission");
    if (commissionResult.error) {
      errors.push({ rowNumber, message: commissionResult.error });
      return;
    }

    const installationCostResult = parseMoneyCell(
      mapped.installationCost,
      "Installation Cost"
    );
    if (installationCostResult.error) {
      errors.push({ rowNumber, message: installationCostResult.error });
      return;
    }

    rows.push({
      rowNumber,
      sku,
      name,
      salesPrice: salesPriceResult.value!,
      commission: commissionResult.value!,
      installationCost: installationCostResult.value!,
    });
  });

  if (rows.length === 0 && errors.length === 0) {
    errors.push({
      rowNumber: 0,
      message: "No product rows found. Check headers and data.",
    });
  }

  return { rows, errors };
}

export function isMongoObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}
