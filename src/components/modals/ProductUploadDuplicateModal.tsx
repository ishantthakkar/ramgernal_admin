"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import styles from "./ConfirmationModal.module.css";

export interface DuplicateUploadItem {
  rowNumber: number;
  sku: string;
  uploadedName: string;
  existingName: string;
  salesPrice: number;
  commission: number;
  installationCost: number;
  existingId: string;
}

interface ProductUploadDuplicateModalProps {
  isOpen: boolean;
  duplicates: DuplicateUploadItem[];
  newCount: number;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (approvedSkus: string[]) => void;
}

export function ProductUploadDuplicateModal({
  isOpen,
  duplicates,
  newCount,
  isLoading = false,
  onClose,
  onConfirm,
}: ProductUploadDuplicateModalProps) {
  const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setSelectedSkus(new Set());
    }
  }, [isOpen, duplicates]);

  if (!isOpen) return null;

  function toggleSku(sku: string) {
    setSelectedSkus((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) {
        next.delete(sku);
      } else {
        next.add(sku);
      }
      return next;
    });
  }

  function handleSelectAll() {
    setSelectedSkus(new Set(duplicates.map((item) => item.sku)));
  }

  function handleClearAll() {
    setSelectedSkus(new Set());
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        style={{ maxWidth: "560px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody} style={{ alignItems: "stretch", textAlign: "left" }}>
          <div
            className={`${styles.iconWrapper} ${styles.warning}`}
            style={{ alignSelf: "center" }}
          >
            <AlertCircle size={32} />
          </div>
          <h3 className={styles.title} style={{ textAlign: "center" }}>
            Products Already Exist
          </h3>
          <p className={styles.messageWithExtra} style={{ textAlign: "center" }}>
            {duplicates.length} SKU(s) from your sheet already exist in the system.
            {newCount > 0
              ? ` ${newCount} new product(s) will be added.`
              : " Select which existing products you want to update from the sheet."}
          </p>

          <div className={styles.modalExtra}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#334155",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Existing SKUs
              </span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#0076ce",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#64748b",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                maxHeight: "240px",
                overflowY: "auto",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
              }}
            >
              {duplicates.map((item) => {
                const isChecked = selectedSkus.has(item.sku);
                return (
                  <li
                    key={item.sku}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      padding: "0.875rem 1rem",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSku(item.sku)}
                        style={{ marginTop: "0.2rem" }}
                      />
                      <span style={{ flex: 1 }}>
                        <strong
                          style={{
                            display: "block",
                            fontFamily: "ui-monospace, monospace",
                            fontSize: "0.85rem",
                            color: "#1e293b",
                          }}
                        >
                          {item.sku}
                        </strong>
                        <span style={{ display: "block", fontSize: "0.85rem", color: "#64748b" }}>
                          Current: {item.existingName}
                        </span>
                        <span style={{ display: "block", fontSize: "0.85rem", color: "#0f766e" }}>
                          From sheet: {item.uploadedName}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel Upload
            </button>
            <button
              type="button"
              className={styles.confirmBtn}
              onClick={() => onConfirm(Array.from(selectedSkus))}
              disabled={isLoading}
            >
              {isLoading && (
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
              )}
              {isLoading
                ? "Processing..."
                : selectedSkus.size > 0
                  ? `Add New & Update ${selectedSkus.size}`
                  : "Add New Only"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
