"use client";

import styles from "@/app/(authenticated)/dashboard.module.css";
import docStyles from "@/app/(authenticated)/workflow/quotations/quotations-view.module.css";
import modalStyles from "@/app/(authenticated)/workflow/workflow-details.module.css";
import type { QuotationFixtureRow } from "@/lib/quotation-utils";
import { ClipboardList } from "lucide-react";

export interface QuotationProductOption {
  sku: string;
  name: string;
}

interface QuotationFixtureTableProps {
  rows: QuotationFixtureRow[];
  editable?: boolean;
  productOptions?: QuotationProductOption[];
  onSkuChange?: (rowId: string, sku: string) => void;
}

function getSkuOptionsForRow(
  row: QuotationFixtureRow,
  productOptions: QuotationProductOption[]
): QuotationProductOption[] {
  const fixtureName = row.proposedFixture.trim().toLowerCase();
  if (!fixtureName) return productOptions;

  const nameMatches = productOptions.filter(
    (product) => product.name.trim().toLowerCase() === fixtureName
  );

  return nameMatches.length > 0 ? nameMatches : productOptions;
}

export function QuotationFixtureTable({
  rows,
  editable = false,
  productOptions = [],
  onSkuChange,
}: QuotationFixtureTableProps) {
  return (
    <section className={styles.formSection}>
      <div className={`${styles.sectionTitle} ${modalStyles.viewSectionTitle}`}>
        <ClipboardList size={22} color="var(--admin-primary, #004d4d)" />
        Proposed Fixtures
      </div>

      <div className={docStyles.fixtureTableCard}>
        {rows.length === 0 ? (
          <div className={docStyles.fixtureEmptyState}>No proposed fixtures found for this survey.</div>
        ) : (
          <div className={docStyles.fixtureTableWrap}>
            <table className={docStyles.fixtureTable}>
              <thead>
                <tr>
                  <th className={docStyles.fixtureColName}>Proposed Fixture</th>
                  <th className={docStyles.fixtureColQty}>Proposed Quantity</th>
                  <th className={docStyles.fixtureColSku}>SKU</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const rowOptions = getSkuOptionsForRow(row, productOptions);
                  const displaySku = row.sku === "—" ? "" : row.sku;
                  const isLastRow = index === rows.length - 1;

                  return (
                    <tr
                      key={row.id}
                      className={isLastRow ? docStyles.fixtureRowLast : undefined}
                    >
                      <td className={docStyles.fixtureColName}>
                        <span className={docStyles.fixtureName}>{row.proposedFixture}</span>
                      </td>
                      <td className={docStyles.fixtureColQty}>
                        <span className={docStyles.fixtureQtyText}>{row.proposedQuantity}</span>
                      </td>
                      <td className={docStyles.fixtureColSku}>
                        {editable ? (
                          <>
                            <input
                              type="text"
                              className={docStyles.skuInput}
                              list={`quotation-sku-${row.id}`}
                              value={displaySku}
                              placeholder="Select or enter SKU"
                              onChange={(event) => onSkuChange?.(row.id, event.target.value)}
                            />
                            <datalist id={`quotation-sku-${row.id}`}>
                              {rowOptions.map((product) => (
                                <option
                                  key={`${row.id}-${product.sku}`}
                                  value={product.sku}
                                  label={product.name}
                                />
                              ))}
                            </datalist>
                          </>
                        ) : (
                          <span className={docStyles.skuBadge}>{row.sku}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
