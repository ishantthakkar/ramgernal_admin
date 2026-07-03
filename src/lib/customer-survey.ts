import { adminApi } from "@/lib/api";

export type SurveyTypeValue = "utility" | "direct";

export const ELECTRIC_COMPANIES = [
  "PSE&G",
  "JCP&L",
  "ATLANTIC CITY ENERGY",
] as const;

export type ElectricCompanyValue = (typeof ELECTRIC_COMPANIES)[number];

export interface SurveyFixtureForm {
  _id?: string;
  existingFixtureType: string;
  otherFixtureName: string;
  heightFt: string;
  heightIn: string;
  existingBulbs: string;
  existingQty: string;
  productId: string;
  proposedQty: string;
  price: string;
  note: string;
  imageFiles: File[];
  existingImageUrls: string[];
}

export interface SurveyAreaForm {
  areaName: string;
  areaNote: string;
  fixtures: SurveyFixtureForm[];
}

export interface SurveyProductOption {
  _id: string;
  name: string;
  utilityPrice?: number;
  directPrice?: number;
}

export function addressHasUsableData(address: Record<string, unknown> | null | undefined): boolean {
  if (!address) return false;
  const street = String(address.street || "").trim();
  const city = String(address.city || "").trim();
  const state = String(address.state || "").trim();
  const zip = String(address.zip || "").trim();
  return Boolean(street || city || state || zip);
}

export function isServiceAddressTitle(title: unknown): boolean {
  return String(title || "").trim().toLowerCase() === "service address";
}

export function customerHasServiceAddress(customer: Record<string, unknown> | null): boolean {
  if (!customer) return false;

  const addresses = Array.isArray(customer.addresses)
    ? (customer.addresses as Record<string, unknown>[])
    : [];

  const hasTitledServiceAddress = addresses.some(
    (address) => isServiceAddressTitle(address.title) && addressHasUsableData(address)
  );
  if (hasTitledServiceAddress) return true;

  if (addresses.length === 0) {
    const primary = customer.address as Record<string, unknown> | undefined;
    return addressHasUsableData(primary);
  }

  return false;
}

export function formatSurveyStatusLabel(status: unknown): string {
  const value = String(status || "in_progress").trim().toLowerCase().replace(/_/g, " ");
  if (!value) return "In Progress";
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getSurveyStatusColor(status: unknown): string {
  const value = String(status || "").trim().toLowerCase();
  if (value === "completed" || value === "verified") return "#10b981";
  if (value === "submitted") return "#3b82f6";
  if (value === "reopen" || value === "reopened") return "#8b5cf6";
  if (value === "in_progress" || value === "in progress") return "#f59e0b";
  return "#64748b";
}

export function createEmptyFixture(): SurveyFixtureForm {
  return {
    existingFixtureType: "",
    otherFixtureName: "",
    heightFt: "",
    heightIn: "",
    existingBulbs: "",
    existingQty: "",
    productId: "",
    proposedQty: "",
    price: "",
    note: "",
    imageFiles: [],
    existingImageUrls: [],
  };
}

export function createEmptyAreaForm(): SurveyAreaForm {
  return {
    areaName: "",
    areaNote: "",
    fixtures: [createEmptyFixture()],
  };
}

export function resolveProductPrice(
  product: SurveyProductOption | undefined,
  surveyType: SurveyTypeValue
): string {
  if (!product) return "";
  const price =
    surveyType === "utility"
      ? Number(product.utilityPrice || 0)
      : Number(product.directPrice || 0);
  if (!Number.isFinite(price) || price <= 0) return "";
  return String(price);
}

export function calculateFixtureTotal(price: string, quantity: string): string {
  const unit = Number(price);
  const qty = Number(quantity);
  if (!Number.isFinite(unit) || !Number.isFinite(qty) || unit <= 0 || qty <= 0) {
    return "";
  }
  return (unit * qty).toFixed(2);
}

export function resolveSurveyId(survey: Record<string, unknown>): string {
  return String(survey._id || survey.id || "").trim();
}

export function resolveCustomerElectricCompany(
  customer: Record<string, unknown> | null
): string {
  if (!customer) return "";
  const lead = customer.leadId;
  const fromLead =
    lead && typeof lead === "object"
      ? String((lead as Record<string, unknown>).electricCompany || "").trim()
      : "";
  return String(customer.electricCompany || fromLead || "").trim();
}

export function mapProposedProductOptions(products: unknown[]): SurveyProductOption[] {
  if (!Array.isArray(products)) return [];

  const options: SurveyProductOption[] = [];

  for (const item of products) {
    const record = item as Record<string, unknown>;
    const productType = String(record.productType || "Proposed Fixture").trim();
    if (productType.toLowerCase() !== "proposed fixture") continue;

    const id = String(record._id || record.id || "").trim();
    const name = String(record.name || "").trim();
    if (!id || !name) continue;

    options.push({
      _id: id,
      name,
      utilityPrice: Number(record.utilityPrice || 0),
      directPrice: Number(record.directPrice || 0),
    });
  }

  return options;
}

export async function loadProposedFixtureProductsForSurvey(
  customerId: string,
  customer: Record<string, unknown> | null
): Promise<SurveyProductOption[]> {
  try {
    const surveyRes = await adminApi.getSurveyProducts(customerId);
    const fromSurveyApi = mapProposedProductOptions(surveyRes.products);
    if (fromSurveyApi.length > 0) {
      return fromSurveyApi;
    }
  } catch {
    // Fall back to the products list API.
  }

  const productsRes = await adminApi.getProducts("Proposed Fixture");
  return mapProposedProductOptions(productsRes.products);
}

export function resolveNoteAuthor(note: Record<string, unknown>): string {
  const user = note.user_id;
  if (user && typeof user === "object") {
    const record = user as Record<string, unknown>;
    return String(record.fullName || record.email || "—");
  }
  return String(note.author || note.createdByName || "—");
}
