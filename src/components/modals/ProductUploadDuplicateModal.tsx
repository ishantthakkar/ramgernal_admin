"use client";

import { FileSpreadsheet, X } from "lucide-react";
import modalStyles from "@/app/(authenticated)/commissions/commissions-modal.module.css";
import styles from "./ProductUploadDuplicateModal.module.css";

export interface DuplicateUploadItem {
  rowNumber: number;
  sku: string;
  uploadedName: string;
  existingName: string;
  utilityPrice: number;
  directPrice: number;
  agentCommission: number;
  managerCommission: number;
  installationCost: number;
  existingId: string;
}

interface ProductUploadDuplicateModalProps {
  isOpen: boolean;
  duplicate: DuplicateUploadItem | null;
  currentIndex: number;
  totalCount: number;
  matchByName?: boolean;
  onNotAdd: () => void;
  onAddAlso: () => void;
  onOverwrite: () => void;
  onCancel: () => void;
}

export function ProductUploadDuplicateModal({
  isOpen,
  duplicate,
  currentIndex,
  totalCount,
  onNotAdd,
  onAddAlso,
  onOverwrite,
  onCancel,
  matchByName = false,
}: ProductUploadDuplicateModalProps) {
  if (!isOpen || !duplicate) return null;

  const duplicateLabel = matchByName ? duplicate.uploadedName : duplicate.sku;

  return (
    <div className={modalStyles.modalOverlay} onClick={onCancel}>
      <div
        className={modalStyles.modalContent}
        style={{ maxWidth: 560 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={modalStyles.modalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "#fef3c7",
                color: "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileSpreadsheet size={22} />
            </div>
            <h3>{matchByName ? "Name Already Exists" : "SKU Already Exists"}</h3>
          </div>
          <button
            type="button"
            className={modalStyles.closeBtn}
            onClick={onCancel}
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        <div className={modalStyles.modalBody}>
          {totalCount > 1 && (
            <p className={styles.progress}>
              {currentIndex + 1} of {totalCount}
            </p>
          )}

          <p className={styles.message}>
            {matchByName ? "Name" : "SKU"} <strong>{duplicateLabel}</strong> already exists in
            your products. Choose how to handle the row from your sheet.
          </p>

          <div className={styles.productCard}>
            <strong className={styles.sku}>{duplicateLabel}</strong>
            <div className={styles.nameRow}>
              <div className={styles.nameBlock}>
                <span className={styles.nameLabel}>Existing Product</span>
                <span className={styles.nameValue}>{duplicate.existingName}</span>
              </div>
              <div className={styles.nameBlock}>
                <span className={styles.nameLabel}>From Sheet</span>
                <span className={`${styles.nameValue} ${styles.nameValueSheet}`}>
                  {duplicate.uploadedName}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={modalStyles.modalFooter}>
          <div className={styles.footerActions}>
            <button type="button" className={styles.noBtn} onClick={onNotAdd}>
              Not Add
            </button>
            <button type="button" className={styles.yesBtn} onClick={onAddAlso}>
              Add Also
            </button>
            <button type="button" className={styles.overwriteBtn} onClick={onOverwrite}>
              Overwrite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
