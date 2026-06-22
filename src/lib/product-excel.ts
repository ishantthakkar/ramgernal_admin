import * as XLSX from "xlsx";
import type { ProductFormData } from "@/components/modals/AddProductModal";
import {
  isExistingFixtureType,
  type ProductFixtureType,
} from "@/lib/product-fixture-types";

export const PROPOSED_PRODUCT_EXCEL_HEADERS = [
  "SKU",
  "Name",
  "Utility Price",
  "Direct Price",
  "Agent Commission",
  "Manager Commission",
  "Installation Cost",
] as const;

export const EXISTING_PRODUCT_EXCEL_HEADERS = ["Name"] as const;

/** @deprecated Use PROPOSED_PRODUCT_EXCEL_HEADERS */
export const PRODUCT_EXCEL_HEADERS = PROPOSED_PRODUCT_EXCEL_HEADERS;

const PROPOSED_TEMPLATE_EXAMPLE: ProductFormData = {
  sku: "RAM-EXAMPLE-001",
  name: "Example Product Name",
  utilityPrice: 99.99,
  directPrice: 89.99,
  agentCommission: 10,
  managerCommission: 5,
  installationCost: 25,
};

export interface ProductExcelRow extends ProductFormData {
  rowNumber: number;
}

export interface ExistingProductExcelRow {
  rowNumber: number;
  name: string;
}

export type ParsedProductExcelRow = ProductExcelRow | ExistingProductExcelRow;

export interface ProductExcelParseError {
  rowNumber: number;
  message: string;
}

export interface ProductExcelParseResult {
  rows: ParsedProductExcelRow[];
  errors: ProductExcelParseError[];
}

function normalizeHeaderKey(key: string): string {
  return key.trim().toLowerCase().replace(/[_\s]+/g, "");
}

const PROPOSED_HEADER_FIELD_MAP: Record<string, keyof ProductFormData> = {
  sku: "sku",
  name: "name",
  utilityprice: "utilityPrice",
  salesprice: "utilityPrice",
  directprice: "directPrice",
  agentcommission: "agentCommission",
  commission: "agentCommission",
  managercommission: "managerCommission",
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

function getHeaders(fixtureType: ProductFixtureType) {
  return isExistingFixtureType(fixtureType)
    ? EXISTING_PRODUCT_EXCEL_HEADERS
    : PROPOSED_PRODUCT_EXCEL_HEADERS;
}

export function downloadProductTemplate(
  filename = "products-template.xlsx",
  fixtureType: ProductFixtureType = "Proposed Fixture"
): void {
  const headers = getHeaders(fixtureType);

  const sheetData = isExistingFixtureType(fixtureType)
    ? [[...headers], ["Example Existing Fixture Name"]]
    : [
        [...headers],
        [
          PROPOSED_TEMPLATE_EXAMPLE.sku,
          PROPOSED_TEMPLATE_EXAMPLE.name,
          PROPOSED_TEMPLATE_EXAMPLE.utilityPrice,
          PROPOSED_TEMPLATE_EXAMPLE.directPrice,
          PROPOSED_TEMPLATE_EXAMPLE.agentCommission,
          PROPOSED_TEMPLATE_EXAMPLE.managerCommission,
          PROPOSED_TEMPLATE_EXAMPLE.installationCost,
        ],
      ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
  XLSX.writeFile(workbook, filename);
}

export function exportProductsToExcel(
  products: Array<ProductFormData | { name: string }>,
  filename = "products-export.xlsx",
  fixtureType: ProductFixtureType = "Proposed Fixture"
): void {
  const headers = getHeaders(fixtureType);

  const sheetData = isExistingFixtureType(fixtureType)
    ? [
        [...headers],
        ...products.map((product) => [product.name]),
      ]
    : [
        [...headers],
        ...products.map((product) => {
          const proposed = product as ProductFormData;
          return [
            proposed.sku,
            proposed.name,
            proposed.utilityPrice,
            proposed.directPrice,
            proposed.agentCommission,
            proposed.managerCommission,
            proposed.installationCost,
          ];
        }),
      ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
  XLSX.writeFile(workbook, filename);
}

function validateUniqueSkusInFile(rows: ProductExcelRow[]): ProductExcelParseError[] {
  const errors: ProductExcelParseError[] = [];
  const skuRows = new Map<string, { rowNumbers: number[]; displaySku: string }>();

  for (const row of rows) {
    const skuKey = row.sku.trim().toLowerCase();
    const existing = skuRows.get(skuKey);
    if (existing) {
      existing.rowNumbers.push(row.rowNumber);
    } else {
      skuRows.set(skuKey, { rowNumbers: [row.rowNumber], displaySku: row.sku.trim() });
    }
  }

  for (const { rowNumbers, displaySku } of skuRows.values()) {
    if (rowNumbers.length <= 1) continue;

    for (const rowNumber of rowNumbers) {
      errors.push({
        rowNumber,
        message: `Duplicate SKU "${displaySku}" in file. Each SKU must be unique.`,
      });
    }
  }

  return errors;
}

function parseProposedRows(
  rawRows: Record<string, unknown>[]
): ProductExcelParseResult {
  const rows: ProductExcelRow[] = [];
  const errors: ProductExcelParseError[] = [];

  rawRows.forEach((rawRow, index) => {
    const rowNumber = index + 2;

    if (isEmptyRow(rawRow)) {
      return;
    }

    const mapped: Partial<Record<keyof ProductFormData, unknown>> = {};

    for (const [header, value] of Object.entries(rawRow)) {
      const field = PROPOSED_HEADER_FIELD_MAP[normalizeHeaderKey(header)];
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

    const utilityPriceResult = parseMoneyCell(mapped.utilityPrice, "Utility Price");
    if (utilityPriceResult.error) {
      errors.push({ rowNumber, message: utilityPriceResult.error });
      return;
    }

    const directPriceResult = parseMoneyCell(mapped.directPrice, "Direct Price");
    if (directPriceResult.error) {
      errors.push({ rowNumber, message: directPriceResult.error });
      return;
    }

    const agentCommissionResult = parseMoneyCell(mapped.agentCommission, "Agent Commission");
    if (agentCommissionResult.error) {
      errors.push({ rowNumber, message: agentCommissionResult.error });
      return;
    }

    const managerCommissionResult = parseMoneyCell(
      mapped.managerCommission,
      "Manager Commission"
    );
    if (managerCommissionResult.error) {
      errors.push({ rowNumber, message: managerCommissionResult.error });
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
      utilityPrice: utilityPriceResult.value!,
      directPrice: directPriceResult.value!,
      agentCommission: agentCommissionResult.value!,
      managerCommission: managerCommissionResult.value!,
      installationCost: installationCostResult.value!,
    });
  });

  const duplicateSkuErrors = validateUniqueSkusInFile(rows);
  if (duplicateSkuErrors.length > 0) {
    const duplicateRowNumbers = new Set(duplicateSkuErrors.map((error) => error.rowNumber));
    return {
      rows: rows.filter((row) => !duplicateRowNumbers.has(row.rowNumber)),
      errors: [...errors, ...duplicateSkuErrors],
    };
  }

  return { rows, errors };
}

function parseExistingRows(
  rawRows: Record<string, unknown>[]
): ProductExcelParseResult {
  const rows: ExistingProductExcelRow[] = [];
  const errors: ProductExcelParseError[] = [];

  rawRows.forEach((rawRow, index) => {
    const rowNumber = index + 2;

    if (isEmptyRow(rawRow)) {
      return;
    }

    let name = "";

    for (const [header, value] of Object.entries(rawRow)) {
      if (normalizeHeaderKey(header) === "name") {
        name = String(value ?? "").trim();
      }
    }

    if (!name) {
      errors.push({ rowNumber, message: "Name is required." });
      return;
    }

    rows.push({ rowNumber, name });
  });

  return { rows, errors };
}

export async function parseProductExcelFile(
  file: File,
  fixtureType: ProductFixtureType = "Proposed Fixture"
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

  const result = isExistingFixtureType(fixtureType)
    ? parseExistingRows(rawRows)
    : parseProposedRows(rawRows);

  if (result.rows.length === 0 && result.errors.length === 0) {
    result.errors.push({
      rowNumber: 0,
      message: "No product rows found. Check headers and data.",
    });
  }

  return result;
}

export function isMongoObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

export function isProposedExcelRow(
  row: ParsedProductExcelRow
): row is ProductExcelRow {
  return "sku" in row;
}
