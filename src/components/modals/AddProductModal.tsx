"use client";

import { useState, useEffect } from "react";
import { X, Package } from "lucide-react";
import modalStyles from "@/app/(authenticated)/commissions/commissions-modal.module.css";
import {
  isExistingFixtureType,
  isAccessoriesTab,
  ACCESSORY_TYPE_TABS,
  type ProductFixtureType,
  type AccessoryType,
} from "@/lib/product-fixture-types";

export interface ProposedProductFormData {
  sku: string;
  name: string;
  utilityPrice: number;
  directPrice: number;
  agentCommission: number;
  managerCommission: number;
  installationCost: number;
}

export interface ExistingProductFormData {
  name: string;
}

export interface AccessoryProductFormData {
  name: string;
  accessoryType: AccessoryType;
}

export type ProductFormData = ProposedProductFormData;

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: ProposedProductFormData | ExistingProductFormData | AccessoryProductFormData
  ) => void | Promise<void>;
  isSubmitting?: boolean;
  mode?: "add" | "edit";
  initialData?:
    | ProposedProductFormData
    | ExistingProductFormData
    | AccessoryProductFormData
    | null;
  fixtureType?: ProductFixtureType;
  defaultAccessoryType?: AccessoryType;
}

const emptyProposedForm = {
  sku: "",
  name: "",
  utilityPrice: "",
  directPrice: "",
  agentCommission: "",
  managerCommission: "",
  installationCost: "",
};

const emptyExistingForm = {
  name: "",
};

const emptyAccessoryForm = {
  name: "",
  accessoryType: "Independent" as AccessoryType,
};

function toProposedFormValues(data: ProposedProductFormData) {
  return {
    sku: data.sku,
    name: data.name,
    utilityPrice: String(data.utilityPrice),
    directPrice: String(data.directPrice),
    agentCommission: String(data.agentCommission),
    managerCommission: String(data.managerCommission),
    installationCost: String(data.installationCost),
  };
}

function validateMoneyField(
  value: string,
  fieldLabel: string,
  errors: Record<string, string>,
  fieldKey: string
): number | null {
  const parsed = parseFloat(value);
  if (!value.trim()) {
    errors[fieldKey] = `${fieldLabel} is required.`;
    return null;
  }
  if (isNaN(parsed) || parsed < 0) {
    errors[fieldKey] = "Enter a valid amount.";
    return null;
  }
  return parsed;
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  mode = "add",
  initialData = null,
  fixtureType = "Proposed Fixture",
  defaultAccessoryType = "Independent",
}: ProductFormModalProps) {
  const [proposedForm, setProposedForm] = useState(emptyProposedForm);
  const [existingForm, setExistingForm] = useState(emptyExistingForm);
  const [accessoryForm, setAccessoryForm] = useState(emptyAccessoryForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isExisting = isExistingFixtureType(fixtureType);
  const isAccessory = isAccessoriesTab(fixtureType);
  const isEdit = mode === "edit";
  const title = isEdit
    ? isAccessory
      ? "Edit Accessory"
      : "Edit Product"
    : isAccessory
      ? "Add Accessory"
      : "Add Product";
  const submitLabel = isEdit ? "Save Changes" : isAccessory ? "Add Accessory" : "Add Product";

  useEffect(() => {
    if (!isOpen) return;

    if (isAccessory) {
      if (isEdit && initialData && "accessoryType" in initialData) {
        setAccessoryForm({
          name: initialData.name,
          accessoryType: initialData.accessoryType,
        });
      } else {
        setAccessoryForm({
          name: "",
          accessoryType: defaultAccessoryType,
        });
      }
    } else if (isExisting) {
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
  }, [isOpen, isEdit, initialData, isExisting, isAccessory, defaultAccessoryType]);

  if (!isOpen) return null;

  function handleClose() {
    setProposedForm(emptyProposedForm);
    setExistingForm(emptyExistingForm);
    setAccessoryForm(emptyAccessoryForm);
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

  function validateAccessoryForm(): AccessoryProductFormData | null {
    const next: Record<string, string> = {};

    if (!accessoryForm.name.trim()) {
      next.name = "Name is required.";
    }

    if (!ACCESSORY_TYPE_TABS.includes(accessoryForm.accessoryType)) {
      next.accessoryType = "Type is required.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return null;

    return {
      name: accessoryForm.name.trim(),
      accessoryType: accessoryForm.accessoryType,
    };
  }

  function validateProposedForm(): ProposedProductFormData | null {
    const next: Record<string, string> = {};

    if (!proposedForm.sku.trim()) {
      next.sku = "SKU is required.";
    }
    if (!proposedForm.name.trim()) {
      next.name = "Name is required.";
    }

    const utilityPrice = validateMoneyField(
      proposedForm.utilityPrice,
      "Utility Price",
      next,
      "utilityPrice"
    );
    const directPrice = validateMoneyField(
      proposedForm.directPrice,
      "Direct Price",
      next,
      "directPrice"
    );
    const agentCommission = validateMoneyField(
      proposedForm.agentCommission,
      "Agent Commission",
      next,
      "agentCommission"
    );
    const managerCommission = validateMoneyField(
      proposedForm.managerCommission,
      "Manager Commission",
      next,
      "managerCommission"
    );
    const installationCost = validateMoneyField(
      proposedForm.installationCost,
      "Installation Cost",
      next,
      "installationCost"
    );

    setErrors(next);
    if (Object.keys(next).length > 0) return null;

    return {
      sku: proposedForm.sku.trim(),
      name: proposedForm.name.trim(),
      utilityPrice: utilityPrice!,
      directPrice: directPrice!,
      agentCommission: agentCommission!,
      managerCommission: managerCommission!,
      installationCost: installationCost!,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    const payload = isAccessory
      ? validateAccessoryForm()
      : isExisting
        ? validateExistingForm()
        : validateProposedForm();
    if (!payload) return;

    await onSubmit(payload);

    if (!isEdit) {
      if (isAccessory) {
        setAccessoryForm({ name: "", accessoryType: defaultAccessoryType });
      } else if (isExisting) {
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
        style={{ maxWidth: 640 }}
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
            {isAccessory ? (
              <div className={modalStyles.formGrid} style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className={modalStyles.formGroup}>
                  <label htmlFor="accessory-name">
                    Name <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    id="accessory-name"
                    type="text"
                    className={modalStyles.formInput}
                    placeholder="Accessory name"
                    value={accessoryForm.name}
                    required
                    onChange={(e) => {
                      setAccessoryForm((prev) => ({ ...prev, name: e.target.value }));
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
                  <label htmlFor="accessory-type">
                    Type <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    id="accessory-type"
                    className={modalStyles.formInput}
                    value={accessoryForm.accessoryType}
                    onChange={(e) => {
                      setAccessoryForm((prev) => ({
                        ...prev,
                        accessoryType: e.target.value as AccessoryType,
                      }));
                      if (errors.accessoryType) {
                        setErrors((prev) => ({ ...prev, accessoryType: "" }));
                      }
                    }}
                  >
                    {ACCESSORY_TYPE_TABS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.accessoryType && (
                    <span style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 600 }}>
                      {errors.accessoryType}
                    </span>
                  )}
                </div>
              </div>
            ) : isExisting ? (
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
                  <label htmlFor="product-utility-price">
                    Utility Price <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    id="product-utility-price"
                    type="number"
                    min="0"
                    step="0.01"
                    className={modalStyles.formInput}
                    placeholder="0.00"
                    value={proposedForm.utilityPrice}
                    required
                    onChange={(e) => {
                      setProposedForm((prev) => ({ ...prev, utilityPrice: e.target.value }));
                      if (errors.utilityPrice) setErrors((prev) => ({ ...prev, utilityPrice: "" }));
                    }}
                  />
                  {errors.utilityPrice && (
                    <span style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 600 }}>
                      {errors.utilityPrice}
                    </span>
                  )}
                </div>

                <div className={modalStyles.formGroup}>
                  <label htmlFor="product-direct-price">
                    Direct Price <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    id="product-direct-price"
                    type="number"
                    min="0"
                    step="0.01"
                    className={modalStyles.formInput}
                    placeholder="0.00"
                    value={proposedForm.directPrice}
                    required
                    onChange={(e) => {
                      setProposedForm((prev) => ({ ...prev, directPrice: e.target.value }));
                      if (errors.directPrice) setErrors((prev) => ({ ...prev, directPrice: "" }));
                    }}
                  />
                  {errors.directPrice && (
                    <span style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 600 }}>
                      {errors.directPrice}
                    </span>
                  )}
                </div>

                <div className={modalStyles.formGroup}>
                  <label htmlFor="product-agent-commission">
                    Agent Commission <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    id="product-agent-commission"
                    type="number"
                    min="0"
                    step="0.01"
                    className={modalStyles.formInput}
                    placeholder="0.00"
                    value={proposedForm.agentCommission}
                    required
                    onChange={(e) => {
                      setProposedForm((prev) => ({ ...prev, agentCommission: e.target.value }));
                      if (errors.agentCommission) {
                        setErrors((prev) => ({ ...prev, agentCommission: "" }));
                      }
                    }}
                  />
                  {errors.agentCommission && (
                    <span style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 600 }}>
                      {errors.agentCommission}
                    </span>
                  )}
                </div>

                <div className={modalStyles.formGroup}>
                  <label htmlFor="product-manager-commission">
                    Manager Commission <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    id="product-manager-commission"
                    type="number"
                    min="0"
                    step="0.01"
                    className={modalStyles.formInput}
                    placeholder="0.00"
                    value={proposedForm.managerCommission}
                    required
                    onChange={(e) => {
                      setProposedForm((prev) => ({ ...prev, managerCommission: e.target.value }));
                      if (errors.managerCommission) {
                        setErrors((prev) => ({ ...prev, managerCommission: "" }));
                      }
                    }}
                  />
                  {errors.managerCommission && (
                    <span style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 600 }}>
                      {errors.managerCommission}
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
