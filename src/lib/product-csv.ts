import { isExistingFixtureType, isAccessoriesTab, type ProductFixtureType } from "@/lib/product-fixture-types";

interface CsvProduct {
  sku?: string;
  name: string;
  description?: string;
  isComboItem?: boolean;
  comboAccessoryIds?: string[];
  utilityPrice?: number;
  directPrice?: number;
  agentCommission?: number;
  managerCommission?: number;
  installationCost?: number;
  accessoryType?: string;
}

interface DownloadProductsCsvOptions {
  comboAccessoryNameById?: Map<string, string>;
}

function escapeCsvCell(value: unknown): string {
  const raw = String(value ?? "");
  if (raw.includes('"') || raw.includes(",") || raw.includes("\n") || raw.includes("\r")) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function toCsv(content: string[][]): string {
  return content.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function downloadTextFile(text: string, filename: string, mimeType: string) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadProductsCsv(
  products: CsvProduct[],
  filename: string,
  fixtureType: ProductFixtureType,
  options: DownloadProductsCsvOptions = {}
) {
  const rows: string[][] = [];

  if (isAccessoriesTab(fixtureType)) {
    rows.push(["Name", "Type"]);
    for (const p of products) {
      rows.push([p.name ?? "", p.accessoryType ?? ""]);
    }
    downloadTextFile(toCsv(rows), filename, "text/csv;charset=utf-8");
    return;
  }

  if (isExistingFixtureType(fixtureType)) {
    rows.push(["Name"]);
    for (const p of products) rows.push([p.name ?? ""]);
    downloadTextFile(toCsv(rows), filename, "text/csv;charset=utf-8");
    return;
  }

  rows.push([
    "SKU",
    "Name",
    "Description",
    "Is Combo Item",
    "Combo Accessories",
    "Utility Price",
    "Direct Price",
    "Agent Commission",
    "Manager Commission",
    "Installation Cost",
  ]);

  for (const p of products) {
    const comboAccessories = Array.isArray(p.comboAccessoryIds)
      ? p.comboAccessoryIds
          .map((id) => options.comboAccessoryNameById?.get(id) ?? id)
          .join(", ")
      : "";

    rows.push([
      p.sku ?? "",
      p.name ?? "",
      p.description ?? "",
      p.isComboItem ? "Yes" : "No",
      comboAccessories,
      String(p.utilityPrice ?? 0),
      String(p.directPrice ?? 0),
      String(p.agentCommission ?? 0),
      String(p.managerCommission ?? 0),
      String(p.installationCost ?? 0),
    ]);
  }

  downloadTextFile(toCsv(rows), filename, "text/csv;charset=utf-8");
}

