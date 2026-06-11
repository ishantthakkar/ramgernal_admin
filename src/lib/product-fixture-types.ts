export const PRODUCT_FIXTURE_TABS = ["Proposed Fixture", "Existing Fixture"] as const;

export type ProductFixtureType = (typeof PRODUCT_FIXTURE_TABS)[number];

export function isProductFixtureTab(
  value: string | null | undefined
): value is ProductFixtureType {
  return PRODUCT_FIXTURE_TABS.includes(value as ProductFixtureType);
}

export function parseProductTabFromParam(tabParam: string | null): ProductFixtureType {
  return isProductFixtureTab(tabParam) ? tabParam : "Proposed Fixture";
}

export function fixtureTypeSlug(type: ProductFixtureType): string {
  return type === "Proposed Fixture" ? "proposed-fixture" : "existing-fixture";
}
