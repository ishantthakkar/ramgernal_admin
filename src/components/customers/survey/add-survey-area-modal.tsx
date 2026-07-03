"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, Loader2, Plus, X } from "lucide-react";
import addStyles from "@/app/(authenticated)/leads/add/leads-add.module.css";
import areaStyles from "@/app/(authenticated)/customers/[id]/customer-survey.module.css";
import {
  calculateFixtureTotal,
  createEmptyAreaForm,
  createEmptyFixture,
  resolveProductPrice,
  type SurveyAreaForm,
  type SurveyFixtureForm,
  type SurveyProductOption,
  type SurveyTypeValue,
} from "@/lib/customer-survey";

interface AddSurveyAreaModalProps {
  open: boolean;
  saving: boolean;
  loadingProducts?: boolean;
  surveyType: SurveyTypeValue;
  existingFixtures: Array<{ _id?: string; name: string; isOtherFixture?: boolean }>;
  proposedProducts: SurveyProductOption[];
  initialArea?: SurveyAreaForm;
  areaId?: string;
  onClose: () => void;
  onSubmit: (area: SurveyAreaForm, areaId?: string, deletedFixtureIds?: string[]) => void;
}

function FixtureFields({
  index,
  fixture,
  surveyType,
  loadingProducts,
  existingFixtures,
  proposedProducts,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  fixture: SurveyFixtureForm;
  surveyType: SurveyTypeValue;
  loadingProducts?: boolean;
  existingFixtures: Array<{ _id?: string; name: string; isOtherFixture?: boolean }>;
  proposedProducts: SurveyProductOption[];
  canRemove: boolean;
  onChange: (index: number, next: SurveyFixtureForm) => void;
  onRemove: (index: number) => void;
}) {
  const selectedProduct = proposedProducts.find((product) => product._id === fixture.productId);
  const totalPrice = calculateFixtureTotal(fixture.price, fixture.proposedQty || fixture.existingQty);
  const isOtherExisting = fixture.existingFixtureType === "__other__";

  const update = (patch: Partial<SurveyFixtureForm>) => {
    const next = { ...fixture, ...patch };
    if (patch.productId !== undefined) {
      const product = proposedProducts.find((item) => item._id === patch.productId);
      next.price = resolveProductPrice(product, surveyType);
      if (!next.proposedQty && next.existingQty) {
        next.proposedQty = next.existingQty;
      }
    }
    onChange(index, next);
  };

  return (
    <div className={areaStyles.areaFixtureCard}>
      <div className={areaStyles.areaFixtureCardHeader}>
        <div className={areaStyles.areaFixtureCardTitle}>Fixture {index + 1}</div>
        {canRemove ? (
          <button
            type="button"
            className={areaStyles.removeItemBtn}
            onClick={() => onRemove(index)}
          >
            Remove
          </button>
        ) : null}
      </div>

      <div className={areaStyles.areaFormGrid}>
        <div className={addStyles.formGroup}>
          <label>Existing Fixture Type</label>
          <select
            className={addStyles.formSelect}
            value={fixture.existingFixtureType}
            onChange={(event) =>
              update({
                existingFixtureType: event.target.value,
                otherFixtureName: event.target.value === "__other__" ? fixture.otherFixtureName : "",
              })
            }
          >
            <option value="">Select existing fixture</option>
            {existingFixtures.map((item) => (
              <option key={item._id || item.name} value={item.name}>
                {item.name}
              </option>
            ))}
            <option value="__other__">Other</option>
          </select>
        </div>

        {isOtherExisting ? (
          <div className={addStyles.formGroup}>
            <label>Other Fixture Name</label>
            <input
              className={addStyles.formInput}
              placeholder="Enter fixture name"
              value={fixture.otherFixtureName}
              onChange={(event) => update({ otherFixtureName: event.target.value })}
            />
          </div>
        ) : null}

        <div className={addStyles.formGroup}>
          <label>Fixture Height (FT)</label>
          <input
            className={addStyles.formInput}
            placeholder="FT"
            value={fixture.heightFt}
            onChange={(event) => update({ heightFt: event.target.value })}
          />
        </div>

        <div className={addStyles.formGroup}>
          <label>Fixture Height (IN)</label>
          <input
            className={addStyles.formInput}
            placeholder="IN"
            value={fixture.heightIn}
            onChange={(event) => update({ heightIn: event.target.value })}
          />
        </div>

        <div className={addStyles.formGroup}>
          <label>Existing Bulbs</label>
          <input
            className={addStyles.formInput}
            placeholder="Enter bulbs"
            value={fixture.existingBulbs}
            onChange={(event) => update({ existingBulbs: event.target.value })}
          />
        </div>

        <div className={addStyles.formGroup}>
          <label>Existing Quantity</label>
          <input
            className={addStyles.formInput}
            placeholder="Enter quantity"
            value={fixture.existingQty}
            onChange={(event) =>
              update({
                existingQty: event.target.value,
                proposedQty: fixture.proposedQty || event.target.value,
              })
            }
          />
        </div>

        <div className={`${addStyles.formGroup} ${areaStyles.areaFormGridFull}`}>
          <label>Proposed Fixture Type</label>
          <select
            className={addStyles.formSelect}
            value={fixture.productId}
            onChange={(event) => update({ productId: event.target.value })}
            disabled={loadingProducts}
          >
            <option value="">
              {loadingProducts
                ? "Loading proposed fixtures..."
                : proposedProducts.length
                  ? "Select proposed fixture"
                  : "No Proposed Fixture products found"}
            </option>
            {proposedProducts.map((product) => (
              <option key={product._id} value={product._id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        <div className={addStyles.formGroup}>
          <label>Proposed Quantity</label>
          <input
            className={addStyles.formInput}
            placeholder="Same as existing quantity"
            value={fixture.proposedQty}
            onChange={(event) => update({ proposedQty: event.target.value })}
          />
        </div>

        <div className={addStyles.formGroup}>
          <label>Price Per Unit</label>
          <input className={addStyles.formInput} value={fixture.price || "—"} readOnly />
        </div>

        <div className={addStyles.formGroup}>
          <label>Total Price</label>
          <input className={addStyles.formInput} value={totalPrice || "—"} readOnly />
        </div>

        <div className={`${addStyles.formGroup} ${areaStyles.areaFormGridFull}`}>
          <label>Fixture Note</label>
          <input
            className={addStyles.formInput}
            placeholder="Enter fixture note"
            value={fixture.note}
            onChange={(event) => update({ note: event.target.value })}
          />
        </div>

        <div className={`${addStyles.formGroup} ${areaStyles.areaFormGridFull}`}>
          <label>Upload Image</label>
          <label className={areaStyles.uploadPhotoBtn}>
            <Camera size={18} />
            Upload Photo
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(event) => {
                const files = Array.from(event.target.files || []);
                if (!files.length) return;
                update({ imageFiles: [...fixture.imageFiles, ...files] });
                event.target.value = "";
              }}
            />
          </label>
          {(fixture.existingImageUrls.length > 0 || fixture.imageFiles.length > 0) && (
            <div className={areaStyles.imagePreviewGrid}>
              {fixture.existingImageUrls.map((url) => (
                <div key={url} className={areaStyles.imagePreviewItem}>
                  <img src={url} alt="Fixture" className={areaStyles.imagePreviewThumb} />
                  <button
                    type="button"
                    className={areaStyles.imageRemoveBtn}
                    onClick={() =>
                      update({
                        existingImageUrls: fixture.existingImageUrls.filter((item) => item !== url),
                      })
                    }
                    aria-label="Remove image"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {fixture.imageFiles.map((file, fileIndex) => (
                <div key={`${file.name}-${fileIndex}`} className={areaStyles.imagePreviewItem}>
                  <div className={areaStyles.imagePreviewPlaceholder}>{file.name}</div>
                  <button
                    type="button"
                    className={areaStyles.imageRemoveBtn}
                    onClick={() =>
                      update({
                        imageFiles: fixture.imageFiles.filter((_, idx) => idx !== fileIndex),
                      })
                    }
                    aria-label="Remove image"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedProduct ? (
        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
          Selected: {selectedProduct.name}
        </div>
      ) : null}
    </div>
  );
}

export function AddSurveyAreaModal({
  open,
  saving,
  loadingProducts = false,
  surveyType,
  existingFixtures,
  proposedProducts,
  initialArea,
  areaId,
  onClose,
  onSubmit,
}: AddSurveyAreaModalProps) {
  const [areaForm, setAreaForm] = useState<SurveyAreaForm>(createEmptyAreaForm());
  const [deletedFixtureIds, setDeletedFixtureIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setAreaForm(initialArea ? { ...initialArea } : createEmptyAreaForm());
    setDeletedFixtureIds([]);
  }, [open, initialArea]);

  const canSave = useMemo(() => areaForm.areaName.trim().length > 0, [areaForm.areaName]);
  const canRemoveFixture = areaForm.fixtures.length > 1;

  if (!open) return null;

  const updateFixture = (index: number, next: SurveyFixtureForm) => {
    setAreaForm((current) => {
      const fixtures = [...current.fixtures];
      fixtures[index] = next;
      return { ...current, fixtures };
    });
  };

  const removeFixture = (index: number) => {
    setAreaForm((current) => {
      if (current.fixtures.length <= 1) return current;
      const fixture = current.fixtures[index];
      if (fixture?._id) {
        setDeletedFixtureIds((ids) => [...ids, fixture._id!]);
      }
      return {
        ...current,
        fixtures: current.fixtures.filter((_, fixtureIndex) => fixtureIndex !== index),
      };
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    onSubmit(areaForm, areaId, deletedFixtureIds);
  };

  return (
    <div className={addStyles.modalBackdrop} onClick={onClose}>
      <div
        className={`${addStyles.modalContainer} ${areaStyles.areaModalContainer}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`${addStyles.modalHeader} ${areaStyles.areaModalHeader}`}>
          <h3 className={addStyles.modalTitle}>{areaId ? "Edit Area" : "Add Area Form"}</h3>
          <button type="button" className={addStyles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={areaStyles.areaModalForm}>
          <div className={areaStyles.areaModalBody}>
            <div className={addStyles.formGroup}>
              <label>Area</label>
              <input
                className={addStyles.formInput}
                placeholder="Enter area name"
                value={areaForm.areaName}
                onChange={(event) =>
                  setAreaForm((current) => ({ ...current, areaName: event.target.value }))
                }
                required
              />
            </div>

            <div className={addStyles.formGroup}>
              <label>Area Note</label>
              <input
                className={addStyles.formInput}
                placeholder="Enter area note"
                value={areaForm.areaNote}
                onChange={(event) =>
                  setAreaForm((current) => ({ ...current, areaNote: event.target.value }))
                }
              />
            </div>

            {areaForm.fixtures.map((fixture, index) => (
              <FixtureFields
                key={`fixture-${index}`}
                index={index}
                fixture={fixture}
                surveyType={surveyType}
                loadingProducts={loadingProducts}
                existingFixtures={existingFixtures}
                proposedProducts={proposedProducts}
                canRemove={canRemoveFixture}
                onChange={updateFixture}
                onRemove={removeFixture}
              />
            ))}

            <button type="button" className={areaStyles.addFixtureBtn} onClick={() =>
                setAreaForm((current) => ({
                  ...current,
                  fixtures: [...current.fixtures, createEmptyFixture()],
                }))
              }>
              <Plus size={16} /> Add Fixture
            </button>
          </div>

          <div className={`${addStyles.modalFooter} ${areaStyles.areaModalFooter}`}>
            <button type="button" className={addStyles.modalCancelBtn} onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              type="submit"
              className={addStyles.modalSaveBtn}
              disabled={saving || !canSave}
            >
              {saving ? (
                <>
                  <Loader2 size={16} style={{ marginRight: 6 }} />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function buildAddAreaFormData(
  surveyId: string,
  area: SurveyAreaForm,
  areaId?: string,
  deletedFixtureIds: string[] = []
): FormData {
  const formData = new FormData();
  formData.append("survey_id", surveyId);

  if (deletedFixtureIds.length) {
    formData.append("delete_fixture_ids", JSON.stringify(deletedFixtureIds));
  }

  const fixtures = area.fixtures.map((fixture) => ({
    ...(fixture._id ? { _id: fixture._id } : {}),
    existingFixtureType:
      fixture.existingFixtureType === "__other__"
        ? fixture.otherFixtureName.trim()
        : fixture.existingFixtureType,
    otherFixtureName: fixture.otherFixtureName.trim(),
    heightFt: fixture.heightFt,
    heightIn: fixture.heightIn,
    existingBulbs: fixture.existingBulbs,
    existingQty: fixture.existingQty,
    product_id: fixture.productId || undefined,
    proposedQty: fixture.proposedQty || fixture.existingQty,
    price: fixture.price,
    note: fixture.note,
  }));

  formData.append(
    "areas",
    JSON.stringify([
      {
        ...(areaId ? { _id: areaId } : {}),
        areaName: area.areaName.trim(),
        note: area.areaNote.trim(),
        fixtures,
      },
    ])
  );

  area.fixtures.forEach((fixture, fixtureIdx) => {
    fixture.imageFiles.forEach((file) => {
      formData.append(`area_0_fixture_${fixtureIdx}`, file);
    });
  });

  return formData;
}

export function mapAreaRecordToForm(
  area: Record<string, unknown>,
  imageBase?: string
): SurveyAreaForm {
  const fixturesRaw = Array.isArray(area.fixtures) ? area.fixtures : [];
  const fixtures: SurveyFixtureForm[] =
    fixturesRaw.length > 0
      ? fixturesRaw.map((item) => {
          const fixture = item as Record<string, unknown>;
          const product = fixture.product_id as Record<string, unknown> | string | undefined;
          const productId =
            product && typeof product === "object"
              ? String(product._id || "")
              : String(product || "");
          const images = Array.isArray(fixture.images)
            ? fixture.images.map((img) => {
                const value = String(img);
                if (value.startsWith("http")) return value;
                return imageBase ? `${imageBase}${value}` : value;
              })
            : [];

          return {
            _id: String(fixture._id || fixture.id || "") || undefined,
            existingFixtureType: String(fixture.existingFixtureType || ""),
            otherFixtureName: String(fixture.otherFixtureName || ""),
            heightFt: String(fixture.heightFt || ""),
            heightIn: String(fixture.heightIn || ""),
            existingBulbs: String(fixture.existingBulbs || ""),
            existingQty: String(fixture.existingQty || ""),
            productId,
            proposedQty: String(fixture.proposedQty || ""),
            price: String(fixture.price || ""),
            note: String(fixture.note || ""),
            imageFiles: [],
            existingImageUrls: images,
          };
        })
      : [createEmptyFixture()];

  return {
    areaName: String(area.areaName || ""),
    areaNote: String(area.note || ""),
    fixtures,
  };
}
