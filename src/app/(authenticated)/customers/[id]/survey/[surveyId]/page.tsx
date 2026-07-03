"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../../../../dashboard.module.css";
import surveyStyles from "../../customer-survey.module.css";
import viewStyles from "../../customer-details.module.css";
import {
  ArrowLeft,
  ClipboardCheck,
  FileText,
  Loader2,
  MapPin,
  Plus,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { formatDateTime } from "@/lib/dateUtils";
import { toast } from "react-toastify";
import {
  loadProposedFixtureProductsForSurvey,
  resolveCustomerElectricCompany,
  resolveNoteAuthor,
  type SurveyAreaForm,
  type SurveyProductOption,
  type SurveyTypeValue,
} from "@/lib/customer-survey";
import { AddSurveyNoteModal } from "@/components/customers/survey/add-survey-note-modal";
import {
  AddSurveyAreaModal,
  buildAddAreaFormData,
  mapAreaRecordToForm,
} from "@/components/customers/survey/add-survey-area-modal";
import ConfirmationModal from "@/components/modals/ConfirmationModal";

const IMAGE_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}/uploads/surveys/`
  : "https://ramgeneral-api.onrender.com/uploads/surveys/";

const PRIMARY_ICON = "var(--admin-primary, #004d4d)";

function formatHeight(heightFt: unknown, heightIn: unknown): string {
  const ft = String(heightFt || "").trim();
  const inches = String(heightIn || "").trim();
  if (!ft && !inches) return "—";
  return `${ft ? `${ft}'` : ""}${inches ? `${inches}"` : ""}`.trim() || "—";
}

export default function CustomerStartSurveyPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const surveyId = params.surveyId as string;

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Record<string, unknown> | null>(null);
  const [survey, setSurvey] = useState<Record<string, unknown> | null>(null);
  const [surveyName, setSurveyName] = useState("");
  const [surveyType, setSurveyType] = useState<SurveyTypeValue>("direct");
  const [existingFixtures, setExistingFixtures] = useState<
    Array<{ _id?: string; name: string; isOtherFixture?: boolean }>
  >([]);
  const [proposedProducts, setProposedProducts] = useState<SurveyProductOption[]>([]);
  const [loadingProposedProducts, setLoadingProposedProducts] = useState(false);

  const [updatingName, setUpdatingName] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [savingArea, setSavingArea] = useState(false);
  const [deletingAreaId, setDeletingAreaId] = useState<string | null>(null);
  const [editingAreaId, setEditingAreaId] = useState<string | undefined>();
  const [editingAreaForm, setEditingAreaForm] = useState<SurveyAreaForm | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);

  const loadProposedProducts = useCallback(
    async (customerRecord: Record<string, unknown> | null) => {
      setLoadingProposedProducts(true);
      try {
        const products = await loadProposedFixtureProductsForSurvey(customerId, customerRecord);
        setProposedProducts(products);
        return products;
      } finally {
        setLoadingProposedProducts(false);
      }
    },
    [customerId]
  );

  const loadData = useCallback(async () => {
    const [customerRes, surveyRes, existingRes] = await Promise.all([
      adminApi.getCustomerWorkflowDetails(customerId),
      adminApi.getSurvey(surveyId),
      adminApi.getProducts("Existing Fixture").catch(() => ({ products: [] })),
    ]);

    const customerRecord = (customerRes.customer as Record<string, unknown>) || null;
    const surveyRecord = (surveyRes.survey as Record<string, unknown>) || null;

    setCustomer(customerRecord);
    setSurvey(surveyRecord);
    setSurveyName(String(surveyRecord?.surveyName || ""));
    setSurveyType(
      String(surveyRecord?.surveyType || "direct").toLowerCase() === "utility"
        ? "utility"
        : "direct"
    );

    const existingList = Array.isArray(existingRes.products) ? existingRes.products : [];
    setExistingFixtures(
      existingList.map((item: Record<string, unknown>) => ({
        _id: String(item._id || item.id || ""),
        name: String(item.name || ""),
        isOtherFixture: Boolean(item.isOtherFixture),
      }))
    );

    await loadProposedProducts(customerRecord);
  }, [customerId, surveyId, loadProposedProducts]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await loadData();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load survey.";
        toast.error(message);
        router.push(`/customers/${customerId}`);
      } finally {
        setLoading(false);
      }
    };
    if (customerId && surveyId) fetchData();
  }, [customerId, surveyId, loadData, router]);

  const notes = useMemo(() => {
    return Array.isArray(survey?.notes) ? (survey.notes as Record<string, unknown>[]) : [];
  }, [survey?.notes]);

  const areas = useMemo(() => {
    return Array.isArray(survey?.areas) ? (survey.areas as Record<string, unknown>[]) : [];
  }, [survey?.areas]);

  const electricCompany = resolveCustomerElectricCompany(customer);

  const salesPersonName = String(
    (customer?.user_id as Record<string, unknown> | undefined)?.fullName ||
      (customer?.user_id as Record<string, unknown> | undefined)?.name ||
      "—"
  );

  const surveyDate = survey?.createdAt || survey?.surveyDate;
  const surveyStatus = survey?.status;
  const isSubmitted = String(surveyStatus || "").toLowerCase() === "submitted";

  const handleUpdateName = async () => {
    const name = surveyName.trim();
    if (!name) {
      toast.error("Survey name is required.");
      return;
    }
    setUpdatingName(true);
    try {
      const response = await adminApi.updateSurveyName(surveyId, name);
      setSurvey((response.survey as Record<string, unknown>) || survey);
      toast.success("Survey name updated.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update survey name.";
      toast.error(message);
    } finally {
      setUpdatingName(false);
    }
  };

  const handleAddNote = async (payload: { title: string; note: string }) => {
    setSavingNote(true);
    try {
      const response = await adminApi.updateSurveyNotes(surveyId, payload);
      setSurvey((response.survey as Record<string, unknown>) || survey);
      setShowNoteModal(false);
      toast.success("Note added.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add note.";
      toast.error(message);
    } finally {
      setSavingNote(false);
    }
  };

  const handleOpenAddArea = async () => {
    const products = await loadProposedProducts(customer);
    if (!products.length) {
      toast.error("No Proposed Fixture products found. Add products with type Proposed Fixture first.");
    }
    setEditingAreaId(undefined);
    setEditingAreaForm(undefined);
    setShowAreaModal(true);
  };

  const handleOpenEditArea = async (area: Record<string, unknown>) => {
    await loadProposedProducts(customer);
    const areaId = String(area._id || area.id || "").trim();
    setEditingAreaId(areaId || undefined);
    setEditingAreaForm(mapAreaRecordToForm(area, IMAGE_BASE));
    setShowAreaModal(true);
  };

  const handleSaveArea = async (
    area: SurveyAreaForm,
    areaId?: string,
    deletedFixtureIds?: string[]
  ) => {
    setSavingArea(true);
    try {
      const formData = buildAddAreaFormData(surveyId, area, areaId, deletedFixtureIds);
      const response = await adminApi.addSurveyArea(formData);
      setSurvey((response.survey as Record<string, unknown>) || survey);
      setShowAreaModal(false);
      setEditingAreaId(undefined);
      setEditingAreaForm(undefined);
      toast.success(areaId ? "Area updated." : "Area added.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save area.";
      toast.error(message);
    } finally {
      setSavingArea(false);
    }
  };

  const handleDeleteArea = async (area: Record<string, unknown>) => {
    const areaId = String(area._id || area.id || "").trim();
    if (!areaId) return;

    const areaName = String(area.areaName || "this area").trim();
    if (!window.confirm(`Remove area "${areaName}"?`)) return;

    setDeletingAreaId(areaId);
    try {
      const formData = new FormData();
      formData.append("survey_id", surveyId);
      formData.append("delete_area_ids", JSON.stringify([areaId]));
      const response = await adminApi.addSurveyArea(formData);
      setSurvey((response.survey as Record<string, unknown>) || survey);
      toast.success("Area removed.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove area.";
      toast.error(message);
    } finally {
      setDeletingAreaId(null);
    }
  };

  const handleSubmitSurveyClick = () => {
    if (!areas.length) {
      toast.error("Add at least one site area before submitting.");
      return;
    }
    setShowSubmitConfirmModal(true);
  };

  const handleConfirmSubmitSurvey = async () => {
    setSubmitting(true);
    try {
      await adminApi.submitCustomerSurveyStatus(surveyId, "submitted");
      toast.success("Survey submitted successfully.");
      setShowSubmitConfirmModal(false);
      router.push(`/customers/${customerId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit survey.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className={styles.spinner} />
      </div>
    );
  }

  if (!survey || !customer) {
    return null;
  }

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        <button
          type="button"
          onClick={() => router.push(`/customers/${customerId}`)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            background: "transparent",
            border: "none",
            color: "#64748b",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          <ArrowLeft size={16} /> Customer
        </button>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>Start Survey</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Start Survey</h1>
      </div>

      <section className={styles.formSection}>
        <div className={`${styles.sectionTitle} ${viewStyles.viewSectionTitle}`}>
          <ClipboardCheck size={22} color={PRIMARY_ICON} /> Survey Details
        </div>

        <div className={surveyStyles.updateNameRow}>
          <div className={styles.formGroup}>
            <label>Survey Name</label>
            <input
              className={styles.formInput}
              value={surveyName}
              onChange={(event) => setSurveyName(event.target.value)}
              disabled={isSubmitted}
            />
          </div>
          <button
            type="button"
            className={surveyStyles.primaryActionBtn}
            onClick={handleUpdateName}
            disabled={updatingName || isSubmitted}
          >
            {updatingName ? "Updating..." : "Update"}
          </button>
        </div>

        <div className={styles.formGrid} style={{ marginTop: "1.5rem" }}>
          <div className={styles.formGroup}>
            <label>Survey Type</label>
            <div>
              <span className={surveyStyles.typeTag}>{surveyType}</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Electric Company</label>
            <div>
              {electricCompany ? (
                <span className={surveyStyles.electricTag}>{electricCompany}</span>
              ) : (
                <span className={viewStyles.readonlyFieldMuted}>—</span>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Sales Person Name</label>
            <div className={surveyStyles.readonlyValue}>{salesPersonName}</div>
          </div>

          <div className={styles.formGroup}>
            <label>Survey Date</label>
            <div className={surveyStyles.readonlyValue}>
              {surveyDate ? formatDateTime(surveyDate) : "—"}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={viewStyles.sectionTitleRow}>
          <div className={`${styles.sectionTitle} ${viewStyles.viewSectionTitle}`}>
            <FileText size={22} color={PRIMARY_ICON} /> Notes
          </div>
          {!isSubmitted && (
            <button
              type="button"
              className={styles.assignBtn}
              onClick={() => setShowNoteModal(true)}
            >
              <Plus size={16} /> Add Note
            </button>
          )}
        </div>

        {notes.length === 0 ? (
          <div className={viewStyles.emptyState}>No notes yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {notes.map((note, index) => (
              <div key={String(note._id || index)} className={surveyStyles.noteCard}>
                <div className={surveyStyles.noteCardTitle}>
                  {index + 1}. {String(note.title || "Note")}
                </div>
                <div className={surveyStyles.noteCardBody}>{String(note.note || "")}</div>
                <div className={surveyStyles.noteCardMeta}>
                  <span className={surveyStyles.noteAuthor}>{resolveNoteAuthor(note)}</span>
                  <span>{note.createdAt ? formatDateTime(note.createdAt) : "—"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.formSection}>
        <div className={viewStyles.sectionTitleRow}>
          <div className={`${styles.sectionTitle} ${viewStyles.viewSectionTitle}`}>
            <MapPin size={22} color={PRIMARY_ICON} /> Site Details
          </div>
          {!isSubmitted && (
            <button type="button" className={styles.assignBtn} onClick={handleOpenAddArea}>
              <Plus size={16} /> Add Area
            </button>
          )}
        </div>

        {areas.length === 0 ? (
          <div className={viewStyles.emptyState}>No site areas added yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {areas.map((area, areaIndex) => {
              const fixtures = Array.isArray(area.fixtures) ? area.fixtures : [];
              return (
                <div key={String(area._id || areaIndex)} className={surveyStyles.areaCard}>
                  <div className={surveyStyles.areaCardHeader}>
                    <div>
                      <div className={surveyStyles.areaLabel}>Area</div>
                      <div className={surveyStyles.areaValue}>{String(area.areaName || "—")}</div>
                    </div>
                    {!isSubmitted && (
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className={styles.assignBtn}
                          onClick={() => handleOpenEditArea(area)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={surveyStyles.removeItemBtn}
                          onClick={() => handleDeleteArea(area)}
                          disabled={deletingAreaId === String(area._id || area.id || "")}
                        >
                          {deletingAreaId === String(area._id || area.id || "") ? (
                            <>
                              <Loader2 size={14} style={{ marginRight: 4 }} />
                              Removing...
                            </>
                          ) : (
                            "Remove"
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: "0.75rem" }}>
                    <div className={surveyStyles.areaLabel}>Note</div>
                    <div className={surveyStyles.areaValue}>{String(area.note || "—")}</div>
                  </div>

                  <div className={surveyStyles.areaLabel}>Fixtures</div>
                  {fixtures.length === 0 ? (
                    <div className={viewStyles.emptyState}>No fixtures in this area.</div>
                  ) : (
                    fixtures.map((fixtureItem, fixtureIndex) => {
                      const fixture = fixtureItem as Record<string, unknown>;
                      const product = fixture.product_id as Record<string, unknown> | undefined;
                      const proposedName =
                        product && typeof product === "object"
                          ? String(product.name || "—")
                          : "—";
                      const images = Array.isArray(fixture.images)
                        ? fixture.images.map((img) => {
                            const value = String(img);
                            return value.startsWith("http") ? value : `${IMAGE_BASE}${value}`;
                          })
                        : [];

                      return (
                        <div key={String(fixture._id || fixtureIndex)} className={surveyStyles.fixtureCard}>
                          <div className={surveyStyles.fixtureTitle}>Fixture {fixtureIndex + 1}</div>
                          <div className={surveyStyles.fixtureGrid}>
                            <div>
                              <div className={surveyStyles.fixtureFieldLabel}>Existing Fixture Type</div>
                              <div className={surveyStyles.fixtureFieldValue}>
                                {String(fixture.existingFixtureType || "—")}
                              </div>
                            </div>
                            <div>
                              <div className={surveyStyles.fixtureFieldLabel}>Height</div>
                              <div className={surveyStyles.fixtureFieldValue}>
                                {formatHeight(fixture.heightFt, fixture.heightIn)}
                              </div>
                            </div>
                            <div>
                              <div className={surveyStyles.fixtureFieldLabel}>Existing Bulbs</div>
                              <div className={surveyStyles.fixtureFieldValue}>
                                {String(fixture.existingBulbs || "—")}
                              </div>
                            </div>
                            <div>
                              <div className={surveyStyles.fixtureFieldLabel}>Existing Quantity</div>
                              <div className={surveyStyles.fixtureFieldValue}>
                                {String(fixture.existingQty || "—")}
                              </div>
                            </div>
                            <div>
                              <div className={surveyStyles.fixtureFieldLabel}>Proposed Fixture</div>
                              <div className={surveyStyles.fixtureFieldValue}>{proposedName}</div>
                            </div>
                            <div>
                              <div className={surveyStyles.fixtureFieldLabel}>Proposed Quantity</div>
                              <div className={surveyStyles.fixtureFieldValue}>
                                {String(fixture.proposedQty || "—")}
                              </div>
                            </div>
                            <div>
                              <div className={surveyStyles.fixtureFieldLabel}>Price Per Unit</div>
                              <div className={surveyStyles.fixtureFieldValue}>
                                {fixture.price ? `${fixture.price} $` : "—"}
                              </div>
                            </div>
                            <div>
                              <div className={surveyStyles.fixtureFieldLabel}>Total Price</div>
                              <div className={surveyStyles.fixtureFieldValue}>
                                {fixture.price && fixture.proposedQty
                                  ? `${(Number(fixture.price) * Number(fixture.proposedQty)).toFixed(2)} $`
                                  : "—"}
                              </div>
                            </div>
                          </div>
                          {fixture.note ? (
                            <div style={{ marginTop: "0.75rem" }}>
                              <div className={surveyStyles.fixtureFieldLabel}>Note</div>
                              <div className={surveyStyles.fixtureFieldValue}>{String(fixture.note)}</div>
                            </div>
                          ) : null}
                          {images.length > 0 ? (
                            <div className={surveyStyles.fixtureImages}>
                              {images.map((src) => (
                                <img key={src} src={src} alt="Fixture upload" />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {!isSubmitted && (
        <div className={surveyStyles.submitBar}>
          <button
            type="button"
            className={surveyStyles.submitBtn}
            onClick={handleSubmitSurveyClick}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Survey"}
          </button>
        </div>
      )}

      <ConfirmationModal
        isOpen={showSubmitConfirmModal}
        onClose={() => {
          if (!submitting) setShowSubmitConfirmModal(false);
        }}
        onConfirm={handleConfirmSubmitSurvey}
        title="Submit this survey?"
        message="Are you sure you want to submit this survey? You will not be able to edit it unless it is reopened."
        confirmText="OK"
        cancelText="Cancel"
        type="warning"
        isLoading={submitting}
      />

      <AddSurveyNoteModal
        open={showNoteModal}
        saving={savingNote}
        onClose={() => setShowNoteModal(false)}
        onSubmit={handleAddNote}
      />

      <AddSurveyAreaModal
        open={showAreaModal}
        saving={savingArea}
        loadingProducts={loadingProposedProducts}
        surveyType={surveyType}
        existingFixtures={existingFixtures}
        proposedProducts={proposedProducts}
        initialArea={editingAreaForm}
        areaId={editingAreaId}
        onClose={() => {
          setShowAreaModal(false);
          setEditingAreaId(undefined);
          setEditingAreaForm(undefined);
        }}
        onSubmit={handleSaveArea}
      />
    </div>
  );
}
