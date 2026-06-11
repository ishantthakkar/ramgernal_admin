"use client";

import { useState, useEffect } from "react";
import { X, Package } from "lucide-react";
import modalStyles from "@/app/(authenticated)/commissions/commissions-modal.module.css";
import {
  isExistingFixtureType,
  type ProductFixtureType,
} from "@/lib/product-fixture-types";

export interface ProposedProductFormData {
  sku: string;
  name: string;
  salesPrice: number;
  commission: number;
  installationCost: number;
}

export interface ExistingProductFormData {
  name: string;
}

export type ProductFormData = ProposedProductFormData;

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProposedProductFormData | ExistingProductFormData) => void | Promise<void>;
  isSubmitting?: boolean;
  mode?: "add" | "edit";
  initialData?: ProposedProductFormData | ExistingProductFormData | null;
  fixtureType?: ProductFixtureType;
}

const emptyProposedForm = {
  sku: "",
  name: "",
  salesPrice: "",
  commission: "",
  installationCost: "",
};

const emptyExistingForm = {
  name: "",
};

function toProposedFormValues(data: ProposedProductFormData) {
  return {
    sku: data.sku,
    name: data.name,
    salesPrice: String(data.salesPrice),
    commission: String(data.commission),
    installationCost: String(data.installationCost),
  };
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  mode = "add",
  initialData = null,
  fixtureType = "Proposed Fixture",
}: ProductFormModalProps) {
  const [proposedForm, setProposedForm] = useState(emptyProposedForm);
  const [existingForm, setExistingForm] = useState(emptyExistingForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isExisting = isExistingFixtureType(fixtureType);
  const isEdit = mode === "edit";
  const title = isEdit ? "Edit Product" : "Add Product";
  const submitLabel = isEdit ? "Save Changes" : "Add Product";

  useEffect(() => {
    if (!isOpen) return;

    if (isExisting) {
      if (isEdit && initialData && "name" in initialData) {
        setExistingForm({ name: initialData.name });
      } else {
        setExistingForm(emptyExistingForm);
      }
    } else if (isEdit && initialData && "sku" in initialData) {
      setProposedForm(toProposedFormValues(initialData));
    } else {
      setProposedForm(emptyProposedForm);
    }

    setErrors({});
  }, [isOpen, isEdit, initialData, isExisting]);

  if (!isOpen) return null;

  function handleClose() {
    setProposedForm(emptyProposedForm);
    setExistingForm(emptyExistingForm);
    setErrors({});
    onClose();
  }

  function validateExistingForm(): ExistingProductFormData | null {
    const next: Record<string, string> = {};

    if (!existingForm.name.trim()) {
      next.name = "Name is required.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return null;

    return { name: existingForm.name.trim() };
  }

  function validateProposedForm(): ProposedProductFormData | null {
    const next: Record<string, string> = {};

    if (!proposedForm.sku.trim()) {
      next.sku = "SKU is required.";
    }
    if (!proposedForm.name.trim()) {
      next.name = "Name is required.";
    }

    const salesPrice = parseFloat(proposedForm.salesPrice);
    if (!proposedForm.salesPrice.trim()) {
      next.salesPrice = "Sales Price is required.";
    } else if (isNaN(salesPrice) || salesPrice < 0) {
      next.salesPrice = "Enter a valid amount.";
    }

    const commission = parseFloat(proposedForm.commission);
    if (!proposedForm.commission.trim()) {
      next.commission = "Commission is required.";
    } else if (isNaN(commission) || commission < 0) {
      next.commission = "Enter a valid amount.";
    }

    const installationCost = parseFloat(proposedForm.installationCost);
    if (!proposedForm.installationCost.trim()) {
      next.installationCost = "Installation Cost is required.";
    } else if (isNaN(installationCost) || installationCost < 0) {
      next.installationCost = "Enter a valid amount.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return null;

    return {
      sku: proposedForm.sku.trim(),
      name: proposedForm.name.trim(),
      salesPrice,
      commission,
      installationCost,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    const payload = isExisting ? validateExistingForm() : validateProposedForm();
    if (!payload) return;

    await onSubmit(payload);

    if (!isEdit) {
      if (isExisting) {
        setExistingForm(emptyExistingForm);
      } else {
        setProposedForm(emptyProposedForm);
      }
      setErrors({});
    }
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
            <h3>{title}</h3>
          </div>
          <button type="button" className={modalStyles.closeBtn} onClick={handleClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={modalStyles.modalBody}>
            {isExisting ? (
              <div className={modalStyles.formGroup}>
                <label htmlFor="existing-product-name">
                  Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  id="existing-product-name"
                  type="text"
                  className={modalStyles.formInput}
                  placeholder="Existing fixture name"
                  value={existingForm.name}
                  required
                  onChange={(e) => {
                    setExistingForm({ name: e.target.value });
                    if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                  }}
                />
                {errors.name && (
                  <span style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 600 }}>
                    {errors.name}
                  </span>
                )}
              </div>
            ) : (
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
                    value={proposedForm.sku}
                    required
                    onChange={(e) => {
                      setProposedForm((prev) => ({ ...prev, sku: e.target.value }));
                      if (errors.sku) setErrors((prev) => ({ ...prev, sku: "" }));
                    }}
                  />
                  {errors.sku && (
                    <span style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 600 }}>
                      {errors.sku}
                    </span>
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
                    value={proposedForm.name}
                    required
                    onChange={(e) => {
                      setProposedForm((prev) => ({ ...prev, name: e.target.value }));
                      if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                    }}
                  />
                  {errors.name && (
                    <span style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 600 }}>
                      {errors.name}
                    </span>
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
                    value={proposedForm.salesPrice}
                    required
                    onChange={(e) => {
                      setProposedForm((prev) => ({ ...prev, salesPrice: e.target.value }));
                      if (errors.salesPrice) setErrors((prev) => ({ ...prev, salesPrice: "" }));
                    }}
                  />
                  {errors.salesPrice && (
                    <span style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 600 }}>
                      {errors.salesPrice}
                    </span>
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
                    value={proposedForm.commission}
                    required
                    onChange={(e) => {
                      setProposedForm((prev) => ({ ...prev, commission: e.target.value }));
                      if (errors.commission) setErrors((prev) => ({ ...prev, commission: "" }));
                    }}
                  />
                  {errors.commission && (
                    <span style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 600 }}>
                      {errors.commission}
                    </span>
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
                    value={proposedForm.installationCost}
                    required
                    onChange={(e) => {
                      setProposedForm((prev) => ({
                        ...prev,
                        installationCost: e.target.value,
                      }));
                      if (errors.installationCost) {
                        setErrors((prev) => ({ ...prev, installationCost: "" }));
                      }
                    }}
                  />
                  {errors.installationCost && (
                    <span style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 600 }}>
                      {errors.installationCost}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={modalStyles.modalFooter}>
            <button type="button" className={modalStyles.cancelBtn} onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className={modalStyles.saveBtn} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export type AddProductFormData = ProposedProductFormData;
export { ProductFormModal as AddProductModal };
