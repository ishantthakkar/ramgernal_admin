"use client";

import { useState } from "react";
import { X, Package } from "lucide-react";
import modalStyles from "@/app/(authenticated)/commissions/commissions-modal.module.css";

export type ProductCategory = "PSE&G" | "JCP&L" | "ATLANTIC CITY ENERGY";

export interface AddProductFormData {
  category: ProductCategory;
  sku: string;
  name: string;
  price: number;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddProductFormData) => void | Promise<void>;
  isSubmitting?: boolean;
}

const CATEGORIES: ProductCategory[] = ["PSE&G", "JCP&L", "ATLANTIC CITY ENERGY"];

const emptyForm = {
  category: "" as ProductCategory | "",
  sku: "",
  name: "",
  price: "",
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

  function validate(): boolean {
    const next: Record<string, string> = {};

    if (!form.category) {
      next.category = "Please select a category.";
    }
    if (!form.sku.trim()) {
      next.sku = "SKU is required.";
    }
    if (!form.name.trim()) {
      next.name = "Name is required.";
    }
    const priceNum = parseFloat(form.price);
    if (!form.price.trim()) {
      next.price = "Price is required.";
    } else if (isNaN(priceNum) || priceNum < 0) {
      next.price = "Enter a valid price.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    await onSubmit({
      category: form.category as ProductCategory,
      sku: form.sku.trim(),
      name: form.name.trim(),
      price: parseFloat(form.price),
    });

    setForm(emptyForm);
    setErrors({});
  }

  return (
    <div className={modalStyles.modalOverlay} onClick={handleClose}>
      <div
        className={modalStyles.modalContent}
        style={{ maxWidth: 520 }}
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
            <div className={modalStyles.formGrid} style={{ gridTemplateColumns: "1fr" }}>
              <div className={modalStyles.formGroup}>
                <label htmlFor="product-category">Category</label>
                <select
                  id="product-category"
                  className={modalStyles.formSelect}
                  value={form.category}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, category: e.target.value as ProductCategory | "" }));
                    if (errors.category) setErrors((prev) => ({ ...prev, category: "" }));
                  }}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <span style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 600 }}>{errors.category}</span>
                )}
              </div>

              <div className={modalStyles.formGroup}>
                <label htmlFor="product-sku">SKU</label>
                <input
                  id="product-sku"
                  type="text"
                  className={modalStyles.formInput}
                  placeholder="e.g. RAM-LED-2X4-40W"
                  value={form.sku}
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
                <label htmlFor="product-name">Name</label>
                <input
                  id="product-name"
                  type="text"
                  className={modalStyles.formInput}
                  placeholder="Product name"
                  value={form.name}
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
                <label htmlFor="product-price">Price</label>
                <input
                  id="product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  className={modalStyles.formInput}
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, price: e.target.value }));
                    if (errors.price) setErrors((prev) => ({ ...prev, price: "" }));
                  }}
                />
                {errors.price && (
                  <span style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 600 }}>{errors.price}</span>
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
