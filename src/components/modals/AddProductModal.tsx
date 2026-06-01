"use client";

import { useState } from "react";
import { X, Package } from "lucide-react";
import modalStyles from "@/app/(authenticated)/commissions/commissions-modal.module.css";

export interface AddProductFormData {
  sku: string;
  name: string;
  salesPrice: number;
  commission: number;
  installationCost: number;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddProductFormData) => void | Promise<void>;
  isSubmitting?: boolean;
}

const emptyForm = {
  sku: "",
  name: "",
  salesPrice: "",
  commission: "",
  installationCost: "",
};

export function AddProductModal({ isOpen, onClose, onSubmit, isSubmitting = false }: AddProductModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  function handleClose() {
    setForm(emptyForm);
    setErrors({});
    onClose();
  }

  function validateForm(): AddProductFormData | null {
    const next: Record<string, string> = {};

    if (!form.sku.trim()) {
      next.sku = "SKU is required.";
    }
    if (!form.name.trim()) {
      next.name = "Name is required.";
    }

    const salesPrice = parseFloat(form.salesPrice);
    if (!form.salesPrice.trim()) {
      next.salesPrice = "Sales Price is required.";
    } else if (isNaN(salesPrice) || salesPrice < 0) {
      next.salesPrice = "Enter a valid amount.";
    }

    const commission = parseFloat(form.commission);
    if (!form.commission.trim()) {
      next.commission = "Commission is required.";
    } else if (isNaN(commission) || commission < 0) {
      next.commission = "Enter a valid amount.";
    }

    const installationCost = parseFloat(form.installationCost);
    if (!form.installationCost.trim()) {
      next.installationCost = "Installation Cost is required.";
    } else if (isNaN(installationCost) || installationCost < 0) {
      next.installationCost = "Enter a valid amount.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return null;

    return {
      sku: form.sku.trim(),
      name: form.name.trim(),
      salesPrice,
      commission,
      installationCost,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    const payload = validateForm();
    if (!payload) return;

    await onSubmit(payload);

    setForm(emptyForm);
    setErrors({});
  }

  return (
    <div className={modalStyles.modalOverlay} onClick={handleClose}>
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
                background: "#eff6ff",
                color: "#0076ce",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Package size={22} />
            </div>
            <h3>Add Product</h3>
          </div>
          <button type="button" className={modalStyles.closeBtn} onClick={handleClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={modalStyles.modalBody}>
            <div className={modalStyles.formGrid} style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className={modalStyles.formGroup}>
                <label htmlFor="product-sku">
                  SKU <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  id="product-sku"
                  type="text"
                  className={modalStyles.formInput}
                  placeholder="e.g. RAM-LED-2X4-40W"
                  value={form.sku}
                  required
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, sku: e.target.value }));
                    if (errors.sku) setErrors((prev) => ({ ...prev, sku: "" }));
                  }}
                />
                {errors.sku && (
                  <span style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 600 }}>{errors.sku}</span>
                )}
              </div>

              <div className={modalStyles.formGroup}>
                <label htmlFor="product-name">
                  Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  id="product-name"
                  type="text"
                  className={modalStyles.formInput}
                  placeholder="Product name"
                  value={form.name}
                  required
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, name: e.target.value }));
                    if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                  }}
                />
                {errors.name && (
                  <span style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 600 }}>{errors.name}</span>
                )}
              </div>

              <div className={modalStyles.formGroup}>
                <label htmlFor="product-sales-price">
                  Sales Price <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  id="product-sales-price"
                  type="number"
                  min="0"
                  step="0.01"
                  className={modalStyles.formInput}
                  placeholder="0.00"
                  value={form.salesPrice}
                  required
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, salesPrice: e.target.value }));
                    if (errors.salesPrice) setErrors((prev) => ({ ...prev, salesPrice: "" }));
                  }}
                />
                {errors.salesPrice && (
                  <span style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 600 }}>{errors.salesPrice}</span>
                )}
              </div>

              <div className={modalStyles.formGroup}>
                <label htmlFor="product-commission">
                  Commission <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  id="product-commission"
                  type="number"
                  min="0"
                  step="0.01"
                  className={modalStyles.formInput}
                  placeholder="0.00"
                  value={form.commission}
                  required
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, commission: e.target.value }));
                    if (errors.commission) setErrors((prev) => ({ ...prev, commission: "" }));
                  }}
                />
                {errors.commission && (
                  <span style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 600 }}>{errors.commission}</span>
                )}
              </div>

              <div className={modalStyles.formGroup} style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="product-installation-cost">
                  Installation Cost <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  id="product-installation-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  className={modalStyles.formInput}
                  placeholder="0.00"
                  value={form.installationCost}
                  required
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, installationCost: e.target.value }));
                    if (errors.installationCost) setErrors((prev) => ({ ...prev, installationCost: "" }));
                  }}
                />
                {errors.installationCost && (
                  <span style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 600 }}>
                    {errors.installationCost}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={modalStyles.modalFooter}>
            <button type="button" className={modalStyles.cancelBtn} onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className={modalStyles.saveBtn} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
