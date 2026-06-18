"use client";

import { useMemo, useState } from "react";
import styles from "../../app/(authenticated)/dashboard.module.css";
import modalStyles from "../../app/(authenticated)/commissions/commissions-modal.module.css";
import detailStyles from "../../app/(authenticated)/workflow/workflow-details.module.css";
import addStyles from "../../app/(authenticated)/leads/add/leads-add.module.css";
import {
  Hammer,
  ClipboardCheck,
  FileText,
  Plus,
  Pencil,
  Loader2,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import {
  buildMaterialSummaryFromSurvey,
  extractSkuOptions,
  formatDeliveryStatusLabel,
  getDeliveryStatusStyle,
  isMaterialsVerified,
  resolveMaterialImageUrl,
} from "@/lib/workflow-installation-details";

interface DeliveryItemForm {
  sku: string;
  issued_qty: string;
}

interface ReturnItemForm {
  item_name: string;
  returned_qty: string;
}

interface ItemsPopupState {
  title: string;
  type: "delivery" | "return";
  items: Record<string, unknown>[];
}

function getDeliveryItemName(item: Record<string, unknown>): string {
  const productName = String(item?.productName || "").trim();
  const sku = String(item?.sku || "").trim();
  return productName || sku || "—";
}

function getReturnItemName(item: Record<string, unknown>): string {
  const productName = String(item?.productName || "").trim();
  const itemName = String(item?.item_name ?? item?.itemName ?? "").trim();
  const sku = String(item?.sku || "").trim();
  return productName || itemName || sku || "—";
}

interface InstallationWorkflowSectionsProps {
  installationSurvey: Record<string, unknown> | null;
  mode?: "view" | "edit";
  onRefresh?: () => Promise<void>;
  onViewImages?: (images: string[], title: string) => void;
}

const EMPTY_DELIVERY_FORM = {
  id: "",
  date: "",
  time: "",
  note: "",
  deliveryStatus: "pending",
  items: [{ sku: "", issued_qty: "" }] as DeliveryItemForm[],
};

const EMPTY_RETURN_FORM = {
  id: "",
  date: "",
  time: "",
  note: "",
  items: [{ item_name: "", returned_qty: "" }] as ReturnItemForm[],
};

export function InstallationWorkflowSections({
  installationSurvey,
  mode = "view",
  onRefresh,
  onViewImages,
}: InstallationWorkflowSectionsProps) {
  const isEdit = mode === "edit";
  const [saving, setSaving] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState(EMPTY_DELIVERY_FORM);
  const [returnForm, setReturnForm] = useState(EMPTY_RETURN_FORM);
  const [itemsPopup, setItemsPopup] = useState<ItemsPopupState | null>(null);

  const skuOptions = useMemo(
    () => extractSkuOptions(installationSurvey),
    [installationSurvey]
  );

  const deliveries = Array.isArray(installationSurvey?.materialDelivery)
    ? installationSurvey.materialDelivery
    : [];
  const returns = Array.isArray(installationSurvey?.materialDeliveryReturn)
    ? installationSurvey.materialDeliveryReturn
    : [];
  const summary = buildMaterialSummaryFromSurvey(installationSurvey);
  const materialsVerified = isMaterialsVerified(installationSurvey);

  function renderItemsCell(
    items: Record<string, unknown>[],
    type: "delivery" | "return",
    popupTitle: string
  ) {
    if (!items.length) {
      return <span style={{ color: "#94a3b8" }}>—</span>;
    }

    return (
      <button
        type="button"
        className={detailStyles.viewImgBtn}
        onClick={() => setItemsPopup({ title: popupTitle, type, items })}
      >
        View ({items.length})
      </button>
    );
  }

  function openAddDelivery() {
    setDeliveryForm({
      ...EMPTY_DELIVERY_FORM,
      items: [{ sku: skuOptions[0] || "", issued_qty: "" }],
    });
    setDeliveryModalOpen(true);
  }

  function openEditDelivery(delivery: Record<string, unknown>) {
    const items = Array.isArray(delivery.items)
      ? delivery.items.map((item: Record<string, unknown>) => ({
          sku: String(item?.sku || ""),
          issued_qty: String(item?.issued_qty ?? item?.issuedQty ?? ""),
        }))
      : [{ sku: "", issued_qty: "" }];

    const dateValue = delivery.date
      ? new Date(String(delivery.date)).toISOString().slice(0, 10)
      : "";

    setDeliveryForm({
      id: String(delivery._id || ""),
      date: dateValue,
      time: String(delivery.time || ""),
      note: String(delivery.note || ""),
      deliveryStatus: String(delivery.deliveryStatus || "pending"),
      items: items.length ? items : [{ sku: "", issued_qty: "" }],
    });
    setDeliveryModalOpen(true);
  }

  function openAddReturn() {
    setReturnForm({
      ...EMPTY_RETURN_FORM,
      items: [{ item_name: skuOptions[0] || "", returned_qty: "" }],
    });
    setReturnModalOpen(true);
  }

  function openEditReturn(entry: Record<string, unknown>) {
    const items = Array.isArray(entry.items)
      ? entry.items.map((item: Record<string, unknown>) => ({
          item_name: String(item?.item_name ?? item?.itemName ?? item?.sku ?? ""),
          returned_qty: String(item?.returned_qty ?? item?.returnedQty ?? ""),
        }))
      : [{ item_name: "", returned_qty: "" }];

    const dateValue = entry.date
      ? new Date(String(entry.date)).toISOString().slice(0, 10)
      : "";

    setReturnForm({
      id: String(entry._id || ""),
      date: dateValue,
      time: String(entry.time || ""),
      note: String(entry.note || ""),
      items: items.length ? items : [{ item_name: "", returned_qty: "" }],
    });
    setReturnModalOpen(true);
  }

  async function handleSaveDelivery() {
    if (!installationSurvey?._id) {
      toast.error("No approved survey found for this installation.");
      return;
    }

    const items = deliveryForm.items
      .map((item) => ({
        sku: item.sku.trim(),
        issued_qty: Number(item.issued_qty) || 0,
      }))
      .filter((item) => item.sku);

    if (!items.length) {
      toast.error("Add at least one item with SKU.");
      return;
    }

    setSaving(true);
    try {
      await adminApi.addSurveyMaterialDelivery({
        survey_id: installationSurvey._id,
        ...(deliveryForm.id ? { id: deliveryForm.id } : {}),
        date: deliveryForm.date || undefined,
        time: deliveryForm.time,
        note: deliveryForm.note,
        deliveryStatus: deliveryForm.deliveryStatus,
        items: JSON.stringify(items),
      });
      toast.success(deliveryForm.id ? "Delivery updated." : "Delivery scheduled.");
      setDeliveryModalOpen(false);
      await onRefresh?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save delivery.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveReturn() {
    if (!installationSurvey?._id) {
      toast.error("No approved survey found for this installation.");
      return;
    }

    const items = returnForm.items
      .map((item) => ({
        item_name: item.item_name.trim(),
        returned_qty: Number(item.returned_qty) || 0,
      }))
      .filter((item) => item.item_name);

    if (!items.length) {
      toast.error("Add at least one return item.");
      return;
    }

    setSaving(true);
    try {
      await adminApi.addSurveyMaterialDeliveryReturn({
        survey_id: installationSurvey._id,
        ...(returnForm.id ? { id: returnForm.id } : {}),
        date: returnForm.date || undefined,
        time: returnForm.time,
        note: returnForm.note,
        items: JSON.stringify(items),
      });
      toast.success(returnForm.id ? "Return updated." : "Return recorded.");
      setReturnModalOpen(false);
      await onRefresh?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save return.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className={styles.formSection}>
        <div
          className={styles.sectionTitle}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Hammer size={22} color="var(--admin-primary, #004d4d)" /> Delivery Details
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* {materialsVerified ? (
              <span
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  color: "#10b981",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "999px",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                }}
              >
                
              </span>
            ) : null} */}
            {isEdit ? (
              <button
                type="button"
                className={addStyles.modalSaveBtn}
                onClick={openAddDelivery}
                style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
              >
                <Plus size={16} /> Add Delivery
              </button>
            ) : null}
          </div>
        </div>
        <p className={styles.sectionSubtitle}>
          Scheduled and delivered materials for this installation.
        </p>

        {deliveries.length > 0 ? (
          <div className={styles.userTableContainer} style={{ marginTop: "0.5rem" }}>
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>Sr. No</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th>Note</th>
                  <th>Images</th>
                  {isEdit ? <th>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {deliveries.map((delivery: Record<string, unknown>, index: number) => {
                  const statusStyle = getDeliveryStatusStyle(String(delivery?.deliveryStatus || ""));
                  const items = Array.isArray(delivery?.items) ? delivery.items : [];
                  const images = Array.isArray(delivery?.images) ? delivery.images : [];
                  const resolvedImages = images
                    .map((img) => resolveMaterialImageUrl(String(img || "")))
                    .filter(Boolean);

                  return (
                    <tr key={String(delivery?._id || `${delivery?.date}-${index}`)}>
                      <td style={{ fontWeight: 600, color: "#94a3b8" }}>{index + 1}</td>
                      <td style={{ fontWeight: 600, color: "#1e293b" }}>
                        {delivery?.date ? formatDate(String(delivery.date)) : "—"}
                      </td>
                      <td style={{ fontWeight: 600, color: "#64748b" }}>
                        {String(delivery?.time || "").trim() || "—"}
                      </td>
                      <td>
                        <span
                          style={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.color,
                            padding: "0.25rem 0.75rem",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}
                        >
                          {formatDeliveryStatusLabel(String(delivery?.deliveryStatus || ""))}
                        </span>
                      </td>
                      <td style={{ color: "#1e293b", fontWeight: 600 }}>
                        {renderItemsCell(
                          items,
                          "delivery",
                          `Delivery #${index + 1}${delivery?.date ? ` · ${formatDate(String(delivery.date))}` : ""}`
                        )}
                      </td>
                      <td style={{ color: "#64748b", fontWeight: 500 }}>
                        {String(delivery?.note || "").trim() || "—"}
                      </td>
                      <td>
                        {resolvedImages.length > 0 ? (
                          <button
                            type="button"
                            className={detailStyles.viewImgBtn}
                            onClick={() => onViewImages?.(resolvedImages, "Material Delivery")}
                          >
                            View ({resolvedImages.length})
                          </button>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>No image</span>
                        )}
                      </td>
                      {isEdit ? (
                        <td>
                          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                            <button
                              type="button"
                              className={detailStyles.viewImgBtn}
                              onClick={() => openEditDelivery(delivery)}
                            >
                              <Pencil size={14} /> Edit
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={addStyles.emptyState}>No material delivery records found.</div>
        )}
      </section>

      <section className={styles.formSection}>
        <div
          className={styles.sectionTitle}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <ClipboardCheck size={22} color="var(--admin-primary, #004d4d)" /> Material Return
          </div>
          {isEdit ? (
            <button
              type="button"
              className={addStyles.modalSaveBtn}
              onClick={openAddReturn}
              style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
            >
              <Plus size={16} /> Add Return
            </button>
          ) : null}
        </div>
        <p className={styles.sectionSubtitle}>Items returned from site.</p>

        {returns.length > 0 ? (
          <div className={styles.userTableContainer} style={{ marginTop: "0.5rem" }}>
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>Sr. No</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Items</th>
                  <th>Note</th>
                  {isEdit ? <th>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {returns.map((entry: Record<string, unknown>, index: number) => {
                  const items = Array.isArray(entry?.items) ? entry.items : [];
                  return (
                    <tr key={String(entry?._id || `${entry?.date}-${index}`)}>
                      <td style={{ fontWeight: 600, color: "#94a3b8" }}>{index + 1}</td>
                      <td style={{ fontWeight: 600, color: "#1e293b" }}>
                        {entry?.date ? formatDate(String(entry.date)) : "—"}
                      </td>
                      <td style={{ fontWeight: 600, color: "#64748b" }}>
                        {String(entry?.time || "").trim() || "—"}
                      </td>
                      <td style={{ color: "#1e293b", fontWeight: 600 }}>
                        {renderItemsCell(
                          items,
                          "return",
                          `Return #${index + 1}${entry?.date ? ` · ${formatDate(String(entry.date))}` : ""}`
                        )}
                      </td>
                      <td style={{ color: "#64748b", fontWeight: 500 }}>
                        {String(entry?.note || "").trim() || "—"}
                      </td>
                      {isEdit ? (
                        <td>
                          <button
                            type="button"
                            className={detailStyles.viewImgBtn}
                            onClick={() => openEditReturn(entry)}
                          >
                            <Pencil size={14} /> Edit
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={addStyles.emptyState}>No material returns recorded.</div>
        )}
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <FileText size={22} color="var(--admin-primary, #004d4d)" /> Delivery Summary
        </div>
        <p className={styles.sectionSubtitle}>Issued vs installed vs remaining.</p>

        {summary.length > 0 ? (
          <div className={styles.userTableContainer} style={{ marginTop: "0.5rem" }}>
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>Sr. No</th>
                  <th>SKU / Item</th>
                  <th>Issued</th>
                  <th>Installed</th>
                  <th>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row, index) => (
                  <tr key={`${row.sku}-${index}`}>
                    <td style={{ fontWeight: 600, color: "#94a3b8" }}>{index + 1}</td>
                    <td style={{ fontWeight: 700, color: "#1e293b", fontFamily: "ui-monospace, monospace" }}>
                      {row.sku}
                    </td>
                    <td style={{ fontWeight: 800, color: "#0f172a" }}>{row.issued}</td>
                    <td style={{ fontWeight: 800, color: "#0f172a" }}>{row.used}</td>
                    <td style={{ fontWeight: 800, color: row.remaining > 0 ? "#d97706" : "#16a34a" }}>
                      {row.remaining}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={addStyles.emptyState}>No summary available yet.</div>
        )}
      </section>

      {deliveryModalOpen ? (
        <div className={modalStyles.modalOverlay} onClick={() => setDeliveryModalOpen(false)}>
          <div className={`${modalStyles.modalContent} ${modalStyles.modalMedium}`} onClick={(e) => e.stopPropagation()}>
            <div className={modalStyles.modalHeader}>
              <div>
                <h3>{deliveryForm.id ? "Edit Material Delivery" : "Schedule Material Delivery"}</h3>
              </div>
              <button type="button" className={modalStyles.closeBtn} onClick={() => setDeliveryModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className={modalStyles.modalBody}>
              <div className={modalStyles.formGrid}>
                <div className={modalStyles.formGroup}>
                  <label>Date</label>
                  <input
                    type="date"
                    className={modalStyles.formInput}
                    value={deliveryForm.date}
                    onChange={(e) => setDeliveryForm((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className={modalStyles.formGroup}>
                  <label>Time</label>
                  <input
                    type="time"
                    className={modalStyles.formInput}
                    value={deliveryForm.time}
                    onChange={(e) => setDeliveryForm((prev) => ({ ...prev, time: e.target.value }))}
                  />
                </div>
                <div className={modalStyles.formGroup}>
                  <label>Status</label>
                  <select
                    className={modalStyles.formInput}
                    value={deliveryForm.deliveryStatus}
                    onChange={(e) => setDeliveryForm((prev) => ({ ...prev, deliveryStatus: e.target.value }))}
                  >
                    <option value="pending">Pending</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="approved">Approved</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className={modalStyles.formGroup}>
                <label>Note</label>
                <textarea
                  className={modalStyles.formInput}
                  rows={3}
                  value={deliveryForm.note}
                  onChange={(e) => setDeliveryForm((prev) => ({ ...prev, note: e.target.value }))}
                />
              </div>

              <div className={modalStyles.formGroup}>
                <label>Items</label>
                {deliveryForm.items.map((item, index) => (
                  <div key={`delivery-item-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr 120px auto", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <input
                      list="workflow-sku-options"
                      className={modalStyles.formInput}
                      placeholder="SKU"
                      value={item.sku}
                      onChange={(e) => {
                        const items = [...deliveryForm.items];
                        items[index] = { ...items[index], sku: e.target.value };
                        setDeliveryForm((prev) => ({ ...prev, items }));
                      }}
                    />
                    <input
                      type="number"
                      className={modalStyles.formInput}
                      placeholder="Qty"
                      value={item.issued_qty}
                      onChange={(e) => {
                        const items = [...deliveryForm.items];
                        items[index] = { ...items[index], issued_qty: e.target.value };
                        setDeliveryForm((prev) => ({ ...prev, items }));
                      }}
                    />
                    <button
                      type="button"
                      className={modalStyles.cancelBtn}
                      onClick={() =>
                        setDeliveryForm((prev) => ({
                          ...prev,
                          items: prev.items.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <datalist id="workflow-sku-options">
                  {skuOptions.map((sku) => (
                    <option key={sku} value={sku} />
                  ))}
                </datalist>
                <button
                  type="button"
                  className={detailStyles.viewImgBtn}
                  onClick={() =>
                    setDeliveryForm((prev) => ({
                      ...prev,
                      items: [...prev.items, { sku: skuOptions[0] || "", issued_qty: "" }],
                    }))
                  }
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>
            </div>
            <div className={modalStyles.modalFooter}>
              <button type="button" className={modalStyles.cancelBtn} onClick={() => setDeliveryModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className={modalStyles.saveBtn} onClick={handleSaveDelivery} disabled={saving}>
                {saving ? <Loader2 size={18} className={styles.spinner} /> : null}
                Save Delivery
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {returnModalOpen ? (
        <div className={modalStyles.modalOverlay} onClick={() => setReturnModalOpen(false)}>
          <div className={`${modalStyles.modalContent} ${modalStyles.modalMedium}`} onClick={(e) => e.stopPropagation()}>
            <div className={modalStyles.modalHeader}>
              <div>
                <h3>{returnForm.id ? "Edit Material Return" : "Record Material Return"}</h3>
              </div>
              <button type="button" className={modalStyles.closeBtn} onClick={() => setReturnModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className={modalStyles.modalBody}>
              <div className={modalStyles.formGrid}>
                <div className={modalStyles.formGroup}>
                  <label>Date</label>
                  <input
                    type="date"
                    className={modalStyles.formInput}
                    value={returnForm.date}
                    onChange={(e) => setReturnForm((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className={modalStyles.formGroup}>
                  <label>Time</label>
                  <input
                    type="time"
                    className={modalStyles.formInput}
                    value={returnForm.time}
                    onChange={(e) => setReturnForm((prev) => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>
              <div className={modalStyles.formGroup}>
                <label>Note</label>
                <textarea
                  className={modalStyles.formInput}
                  rows={3}
                  value={returnForm.note}
                  onChange={(e) => setReturnForm((prev) => ({ ...prev, note: e.target.value }))}
                />
              </div>
              <div className={modalStyles.formGroup}>
                <label>Items</label>
                {returnForm.items.map((item, index) => (
                  <div key={`return-item-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr 120px auto", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <input
                      list="workflow-sku-options"
                      className={modalStyles.formInput}
                      placeholder="Item name / SKU"
                      value={item.item_name}
                      onChange={(e) => {
                        const items = [...returnForm.items];
                        items[index] = { ...items[index], item_name: e.target.value };
                        setReturnForm((prev) => ({ ...prev, items }));
                      }}
                    />
                    <input
                      type="number"
                      className={modalStyles.formInput}
                      placeholder="Qty"
                      value={item.returned_qty}
                      onChange={(e) => {
                        const items = [...returnForm.items];
                        items[index] = { ...items[index], returned_qty: e.target.value };
                        setReturnForm((prev) => ({ ...prev, items }));
                      }}
                    />
                    <button
                      type="button"
                      className={modalStyles.cancelBtn}
                      onClick={() =>
                        setReturnForm((prev) => ({
                          ...prev,
                          items: prev.items.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className={detailStyles.viewImgBtn}
                  onClick={() =>
                    setReturnForm((prev) => ({
                      ...prev,
                      items: [...prev.items, { item_name: skuOptions[0] || "", returned_qty: "" }],
                    }))
                  }
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>
            </div>
            <div className={modalStyles.modalFooter}>
              <button type="button" className={modalStyles.cancelBtn} onClick={() => setReturnModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className={modalStyles.saveBtn} onClick={handleSaveReturn} disabled={saving}>
                {saving ? <Loader2 size={18} className={styles.spinner} /> : null}
                Save Return
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {itemsPopup ? (
        <div className={modalStyles.modalOverlay} onClick={() => setItemsPopup(null)}>
          <div className={`${modalStyles.modalContent} ${modalStyles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
            <div className={modalStyles.modalHeader}>
              <div>
                <h3>{itemsPopup.title}</h3>
                <p className={detailStyles.itemsPopupSubtitle}>
                  {itemsPopup.type === "delivery"
                    ? "Item name and issued quantity"
                    : "Item name and returned quantity"}
                </p>
              </div>
              <button type="button" className={modalStyles.closeBtn} onClick={() => setItemsPopup(null)}>
                <X size={24} />
              </button>
            </div>
            <div className={modalStyles.modalBody}>
              <div className={detailStyles.itemsPopupTableWrap}>
                <table className={detailStyles.itemsPopupTable}>
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>{itemsPopup.type === "delivery" ? "Issued Qty" : "Returned Qty"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsPopup.items.map((item, idx) => (
                      <tr key={`popup-item-${idx}`}>
                        <td>
                          {itemsPopup.type === "delivery"
                            ? getDeliveryItemName(item)
                            : getReturnItemName(item)}
                        </td>
                        <td style={{ fontWeight: 800 }}>
                          {itemsPopup.type === "delivery"
                            ? Number(item?.issued_qty ?? item?.issuedQty ?? 0) || 0
                            : Number(item?.returned_qty ?? item?.returnedQty ?? 0) || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={modalStyles.modalFooter}>
              <button type="button" className={modalStyles.cancelBtn} onClick={() => setItemsPopup(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
