export const PRODUCT_FIXTURE_TABS = [
  "Proposed Fixture",
  "Existing Fixture",
  "Accessories",
] as const;

export const ACCESSORY_TYPE_TABS = ["Independent", "Combo"] as const;

export type ProductFixtureType = (typeof PRODUCT_FIXTURE_TABS)[number];
export type AccessoryType = (typeof ACCESSORY_TYPE_TABS)[number];

export function isProductFixtureTab(
  value: string | null | undefined
): value is ProductFixtureType {
  return PRODUCT_FIXTURE_TABS.includes(value as ProductFixtureType);
}

export function isAccessoryType(
  value: string | null | undefined
): value is AccessoryType {
  return ACCESSORY_TYPE_TABS.includes(value as AccessoryType);
}

export function parseProductTabFromParam(tabParam: string | null): ProductFixtureType {
  return isProductFixtureTab(tabParam) ? tabParam : "Proposed Fixture";
}

export function parseAccessoryTypeFromParam(param: string | null): AccessoryType {
  return isAccessoryType(param) ? param : "Independent";
}

export function fixtureTypeSlug(type: ProductFixtureType): string {
  if (type === "Proposed Fixture") return "proposed-fixture";
  if (type === "Existing Fixture") return "existing-fixture";
  return "accessories";
}

export function isExistingFixtureType(type: ProductFixtureType): boolean {
  return type === "Existing Fixture";
}

export function isAccessoriesTab(type: ProductFixtureType): boolean {
  return type === "Accessories";
}
