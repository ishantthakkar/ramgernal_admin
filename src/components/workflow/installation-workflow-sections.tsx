"use client";

import { useMemo, useState } from "react";
import styles from "../../app/(authenticated)/dashboard.module.css";
import modalStyles from "../../app/(authenticated)/commissions/commissions-modal.module.css";
import detailStyles from "../../app/(authenticated)/workflow/workflow-details.module.css";
import {
  Hammer,
  ClipboardCheck,
  FileText,
  Plus,
  Pencil,
  Loader2,
  X,
  Image as ImageIcon,
  Eye,
} from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import {
  buildMaterialSummaryFromSurvey,
  extractSkuOptions,
  formatDeliveryStatusLabel,
  getDeliveryStatusStyle,
  resolveMaterialImageUrl,
} from "@/lib/workflow-installation-details";
import { InstallationExtraExpensesSection } from "@/components/workflow/installation-extra-expenses-section";

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

const PRIMARY_ICON = "var(--admin-primary, #004d4d)";

function ViewActionButton({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={styles.assignBtn}
      onClick={onClick}
      style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
    >
      {icon}
      {label}
    </button>
  );
}

interface InstallationWorkflowSectionsProps {
  installationSurvey: Record<string, unknown> | null;
  mode?: "view" | "edit";
  canManageExtraExpenses?: boolean;
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
  canManageExtraExpenses = false,
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

  function renderItemsCell(
    items: Record<string, unknown>[],
    type: "delivery" | "return",
    popupTitle: string
  ) {
    if (!items.length) {
      return <span style={{ color: "#94a3b8" }}>—</span>;
    }

    return (
      <ViewActionButton
        label={`View (${items.length})`}
        icon={<Eye size={14} />}
        onClick={() => setItemsPopup({ title: popupTitle, type, items })}
      />
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
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "2rem",
          }}
        >
          <div className={`${styles.sectionTitle} ${detailStyles.viewSectionTitle}`} style={{ marginBottom: 0 }}>
            <Hammer size={22} color={PRIMARY_ICON} /> Delivery Details
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {isEdit ? (
              <button
                type="button"
                className={styles.addBtn}
                onClick={openAddDelivery}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
              >
                <Plus size={16} /> Add Delivery
              </button>
            ) : null}
          </div>
        </div>

        {deliveries.length > 0 ? (
          <div className={styles.userTableContainer}>
            <table className={detailStyles.detailTable}>
              <thead>
                <tr>
                  <th>Sr. No</th>
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
                      <td className={detailStyles.detailTableMuted}>{index + 1}</td>
                      <td className={detailStyles.detailTableName}>
                        {delivery?.date ? formatDate(String(delivery.date)) : "—"}
                      </td>
                      <td className={detailStyles.detailTableMuted}>
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
                      <td>
                        {renderItemsCell(
                          items,
                          "delivery",
                          `Delivery #${index + 1}${delivery?.date ? ` · ${formatDate(String(delivery.date))}` : ""}`
                        )}
                      </td>
                      <td className={detailStyles.detailTableMuted}>
                        {String(delivery?.note || "").trim() || "—"}
                      </td>
                      <td>
                        {resolvedImages.length > 0 ? (
                          <ViewActionButton
                            label={`View (${resolvedImages.length})`}
                            icon={<ImageIcon size={14} />}
                            onClick={() => onViewImages?.(resolvedImages, "Material Delivery")}
                          />
                        ) : (
                          <span className={detailStyles.detailTableMuted}>No image</span>
                        )}
                      </td>
                      {isEdit ? (
                        <td>
                          <ViewActionButton
                            label="Edit"
                            icon={<Pencil size={14} />}
                            onClick={() => openEditDelivery(delivery)}
                          />
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={detailStyles.viewEmptyState}>No material delivery records found.</div>
        )}
      </section>

      <section className={styles.formSection}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "2rem",
          }}
        >
          <div className={`${styles.sectionTitle} ${detailStyles.viewSectionTitle}`} style={{ marginBottom: 0 }}>
            <ClipboardCheck size={22} color={PRIMARY_ICON} /> Material Return
          </div>
          {isEdit ? (
            <button
              type="button"
              className={styles.addBtn}
              onClick={openAddReturn}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
            >
              <Plus size={16} /> Add Return
            </button>
          ) : null}
        </div>

        {returns.length > 0 ? (
          <div className={styles.userTableContainer}>
            <table className={detailStyles.detailTable}>
              <thead>
                <tr>
                  <th>Sr. No</th>
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
                      <td className={detailStyles.detailTableMuted}>{index + 1}</td>
                      <td className={detailStyles.detailTableName}>
                        {entry?.date ? formatDate(String(entry.date)) : "—"}
                      </td>
                      <td className={detailStyles.detailTableMuted}>
                        {String(entry?.time || "").trim() || "—"}
                      </td>
                      <td>
                        {renderItemsCell(
                          items,
                          "return",
                          `Return #${index + 1}${entry?.date ? ` · ${formatDate(String(entry.date))}` : ""}`
                        )}
                      </td>
                      <td className={detailStyles.detailTableMuted}>
                        {String(entry?.note || "").trim() || "—"}
                      </td>
                      {isEdit ? (
                        <td>
                          <ViewActionButton
                            label="Edit"
                            icon={<Pencil size={14} />}
                            onClick={() => openEditReturn(entry)}
                          />
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={detailStyles.viewEmptyState}>No material returns recorded.</div>
        )}
      </section>

      <section className={styles.formSection}>
        <div className={`${styles.sectionTitle} ${detailStyles.viewSectionTitle}`}>
          <FileText size={22} color={PRIMARY_ICON} /> Delivery Summary
        </div>

        {summary.length > 0 ? (
          <div className={styles.userTableContainer}>
            <table className={detailStyles.detailTable}>
              <thead>
                <tr>
                  <th>Sr. No</th>
                  <th>SKU / Item</th>
                  <th>Issued</th>
                  <th>Installed</th>
                  <th>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row, index) => (
                  <tr key={`${row.sku}-${index}`}>
                    <td className={detailStyles.detailTableMuted}>{index + 1}</td>
                    <td className={detailStyles.detailTableName} style={{ fontFamily: "ui-monospace, monospace" }}>
                      {row.sku}
                    </td>
                    <td className={detailStyles.detailTableName}>{row.issued}</td>
                    <td className={detailStyles.detailTableName}>{row.used}</td>
                    <td style={{ fontWeight: 700, color: row.remaining > 0 ? "#d97706" : "#16a34a" }}>
                      {row.remaining}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={detailStyles.viewEmptyState}>No summary available yet.</div>
        )}
      </section>

      <InstallationExtraExpensesSection
        installationSurvey={installationSurvey}
        canManage={canManageExtraExpenses}
        onRefresh={onRefresh}
        onViewImages={onViewImages}
      />

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
