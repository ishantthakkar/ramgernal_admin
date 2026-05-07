"use client";

import React from "react";
import { X, AlertCircle, CheckCircle2, HelpCircle, Loader2 } from "lucide-react";
import styles from "./ConfirmationModal.module.css";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "success" | "warning" | "info";
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <AlertCircle size={32} />;
      case "success":
        return <CheckCircle2 size={32} />;
      case "warning":
        return <AlertCircle size={32} />;
      default:
        return <HelpCircle size={32} />;
    }
  };

  const getIconClass = () => {
    switch (type) {
      case "danger":
        return styles.danger;
      case "success":
        return styles.success;
      case "warning":
        return styles.warning;
      default:
        return "";
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={`${styles.iconWrapper} ${getIconClass()}`}>
            {getIcon()}
          </div>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.message}>{message}</p>

          <div className={styles.modalFooter}>
            <button 
              className={styles.cancelBtn} 
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </button>
            <button 
              className={styles.confirmBtn} 
              onClick={onConfirm}
              disabled={isLoading}
              style={{
                backgroundColor: type === "danger" ? "#ef4444" : type === "success" ? "#10b981" : "#0076ce"
              }}
            >
              {isLoading && <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />}
              {isLoading ? "Processing..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
