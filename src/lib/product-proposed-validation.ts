export interface ProposedProductPrices {
  utilityPrice: number;
  directPrice: number;
  agentCommission: number;
  managerCommission: number;
  installationCost: number;
}

export interface ProposedNamePriceProduct extends ProposedProductPrices {
  id?: string;
  name: string;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function proposedPricesMatch(
  a: ProposedProductPrices,
  b: ProposedProductPrices
): boolean {
  return (
    roundMoney(a.utilityPrice) === roundMoney(b.utilityPrice) &&
    roundMoney(a.directPrice) === roundMoney(b.directPrice) &&
    roundMoney(a.agentCommission) === roundMoney(b.agentCommission) &&
    roundMoney(a.managerCommission) === roundMoney(b.managerCommission) &&
    roundMoney(a.installationCost) === roundMoney(b.installationCost)
  );
}

export const PROPOSED_NAME_PRICE_MISMATCH_MESSAGE =
  "A product with this name already exists with different prices. Products with the same name must have the same prices.";

export function validateProposedNamePriceAgainstCatalog(
  name: string,
  prices: ProposedProductPrices,
  existingProducts: ProposedNamePriceProduct[],
  excludeId?: string
): { valid: true } | { valid: false; message: string } {
  const nameKey = name.trim().toLowerCase();
  if (!nameKey) return { valid: true };

  const sameNameProducts = existingProducts.filter(
    (product) =>
      product.name.trim().toLowerCase() === nameKey &&
      (!excludeId || product.id !== excludeId)
  );

  const mismatched = sameNameProducts.find(
    (product) => !proposedPricesMatch(prices, product)
  );

  if (mismatched) {
    return { valid: false, message: PROPOSED_NAME_PRICE_MISMATCH_MESSAGE };
  }

  return { valid: true };
}

export function validateUniqueProposedNamesInFile(
  rows: Array<ProposedProductPrices & { rowNumber: number; name: string }>
): Array<{ rowNumber: number; message: string }> {
  const errors: Array<{ rowNumber: number; message: string }> = [];
  const rowsByName = new Map<string, Array<ProposedProductPrices & { rowNumber: number; name: string }>>();

  for (const row of rows) {
    const nameKey = row.name.trim().toLowerCase();
    const group = rowsByName.get(nameKey);
    if (group) {
      group.push(row);
    } else {
      rowsByName.set(nameKey, [row]);
    }
  }

  for (const group of rowsByName.values()) {
    if (group.length <= 1) continue;

    const reference = group[0];
    const hasMismatch = group.some((row) => !proposedPricesMatch(reference, row));

    if (!hasMismatch) continue;

    const displayName = reference.name.trim();
    for (const row of group) {
      errors.push({
        rowNumber: row.rowNumber,
        message: `Name "${displayName}" appears with different prices in the file. Products with the same name must have the same prices.`,
      });
    }
  }

  return errors;
}
