"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import styles from "../../../dashboard.module.css";
import {
  Loader2,
  Save,
  X,
  ClipboardCheck,
  Image as ImageIcon,
  Hammer,
  Plus,
  FileText,
  Info,
} from "lucide-react";
import addStyles from "../../../leads/add/leads-add.module.css";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import { formatDate, formatNoteListDateTime } from "@/lib/dateUtils";
import { SiteSurveyVerifyControl } from "@/components/workflow/site-survey-verify-control";
import {
  mapNotes,
  mapSiteDetailGroups,
  mapSiteDetails,
  mapSurveyDetails,
  type NoteEntry,
  type SiteDetailRow,
  type SiteDetailSurveyGroup,
} from "@/lib/workflow-survey-view";
import detailStyles from "../../workflow-details.module.css";
import { hasPermission } from "@/lib/permissions";
import { QuotationPdfPreview } from "@/components/workflow/quotation-pdf-preview";
import { InstallationWorkflowSections } from "@/components/workflow/installation-workflow-sections";
import {
  resolveInstallationSurvey,
  resolveSurveyContractorName,
} from "@/lib/workflow-installation-details";

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  const display = value?.trim() || "—";
  return (
    <div className={styles.formGroup}>
      <label>{label}</label>
      <div
        className={styles.formInput}
        style={{
          background: "#f8fafc",
          color: display === "—" ? "#94a3b8" : "#1e293b",
          fontWeight: 600,
          border: "1px solid #e2e8f0",
          minHeight: "2.75rem",
          display: "flex",
          alignItems: "center",
        }}
      >
        {display}
      </div>
    </div>
  );
}

function getSurveyStatusColor(status: string): string {
  const s = (status || "").toLowerCase();
  if (s === "completed") return "#64748b";
  if (s === "verified") return "#10b981";
  if (s === "pending_edit_approval") return "#d97706";
  if (s === "reopened" || s === "reopen") return "#f59e0b";
  if (s === "pending" || s === "not started") return "#ef4444";
  return "#64748b";
}

function formatSurveyStatusLabel(status: string): string {
  if (status === "pending_edit_approval") return "Pending Approval";
  if (status === "reopen" || status === "reopened") return "Reopened";
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

function EditableField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className={styles.formGroup}>
      <label>{label}</label>
      <input
        type={type}
        className={styles.formInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function formatNoteMeta(authorName: string | undefined, timestamp: string | null): string {
  const parts: string[] = [];
  if (authorName?.trim()) {
    parts.push(authorName.trim().toUpperCase());
  }
  if (timestamp) {
    const formatted = formatNoteListDateTime(timestamp);
    if (formatted) parts.push(formatted);
  }
  return parts.join(", ");
}

function NotesList({ entries }: { entries: NoteEntry[] }) {
  if (!entries.length) return null;

  return (
    <div className={detailStyles.notesList}>
      {entries.map((entry, index) => {
        const title = (entry.title || (entry.source === "survey" ? "Survey Note" : "Note")).trim();
        const meta = formatNoteMeta(entry.authorName, entry.timestamp);

        return (
          <article key={entry.id} className={detailStyles.noteListItem}>
            <div className={detailStyles.noteListHeader}>
              <h4 className={detailStyles.noteListTitle}>
                {index + 1}. {title.toUpperCase()}
              </h4>
              {meta ? <span className={detailStyles.noteListMeta}>{meta}</span> : null}
            </div>
            <p className={detailStyles.noteListBody}>{entry.text}</p>
          </article>
        );
      })}
    </div>
  );
}

function SiteRoomEditCard({
  row,
  roomIndex,
  onFieldChange,
}: {
  row: SiteDetailRow;
  roomIndex: number;
  onFieldChange: (rowId: string, field: keyof SiteDetailRow, value: string) => void;
}) {
  const change = (field: keyof SiteDetailRow) => (value: string) =>
    onFieldChange(row._id, field, value);

  return (
    <article className={detailStyles.siteRoomCard}>
      <div className={styles.formGrid} style={{ marginBottom: "1.25rem" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <EditableField
            label="Area"
            value={row.area || ""}
            onChange={change("area")}
            placeholder="Room name"
          />
        </div>
      </div>
      <div className={styles.formGrid}>
        <EditableField
          label="Existing Fixture Type"
          value={row.existingFixtureType || ""}
          onChange={change("existingFixtureType")}
        />
        <EditableField
          label="Height Ft"
          value={row.heightFt === "N/A" ? "" : row.heightFt || ""}
          onChange={change("heightFt")}
          placeholder="e.g. 10"
        />
        <EditableField
          label="Height In"
          value={row.heightIn === "N/A" ? "" : row.heightIn || ""}
          onChange={change("heightIn")}
          placeholder="e.g. 6"
        />
        <EditableField
          label="Existing Bulb"
          value={row.existingBulbs || ""}
          onChange={change("existingBulbs")}
        />
        <EditableField
          label="Existing Quantity"
          value={row.existingQuantity || ""}
          onChange={change("existingQuantity")}
          type="number"
        />
      </div>

      <div className={`${styles.formGroup} ${detailStyles.siteMediaBlock}`}>
        <label>Images / Videos</label>
        <div
          className={styles.formInput}
          style={{
            background: "#f8fafc",
            color: "#94a3b8",
            fontWeight: 600,
            border: "1px solid #e2e8f0",
            minHeight: "2.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <ImageIcon size={16} />
          {row.images?.length ? `${row.images.length} image(s) on file` : "No images"}
        </div>
      </div>

      <div className={styles.formGrid}>
        <EditableField
          label="Proposed Fixture"
          value={row.proposedFixture || ""}
          onChange={change("proposedFixture")}
        />
        <EditableField
          label="Proposed Quantity"
          value={row.proposedQuantity || ""}
          onChange={change("proposedQuantity")}
          type="number"
        />
        <EditableField
          label="Price Per Unit"
          value={row.pricePerUnit === "—" ? "" : row.pricePerUnit || ""}
          onChange={change("pricePerUnit")}
        />
        <EditableField
          label="Total Price"
          value={row.totalPrice === "—" ? "" : row.totalPrice || ""}
          onChange={change("totalPrice")}
        />
        <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
          <label>Note</label>
          <textarea
            className={styles.formInput}
            value={row.note || ""}
            onChange={(e) => change("note")(e.target.value)}
            rows={3}
            style={{ resize: "vertical", minHeight: "5rem" }}
          />
        </div>
      </div>
    </article>
  );
}

function SiteDetailsEditCards({
  groups,
  onFieldChange,
  canVerify,
  verifyingSurveyId,
  onVerifySurvey,
}: {
  groups: SiteDetailSurveyGroup[];
  onFieldChange: (rowId: string, field: keyof SiteDetailRow, value: string) => void;
  canVerify: boolean;
  verifyingSurveyId: string | null;
  onVerifySurvey: (surveyId: string, surveyName: string) => void;
}) {
  const hasAreas = groups.some((g) => g.areas.length > 0);

  if (!groups.length || !hasAreas) {
    return <div className={addStyles.emptyState}>No survey records found.</div>;
  }

  return (
    <div className={detailStyles.siteDetailsStack}>
      {groups.map((group) => (
        <div key={group.surveyId} className={detailStyles.siteSurveyBox}>
          <div className={detailStyles.siteSurveyBoxHeaderRow}>
            <div className={detailStyles.siteSurveyBoxHeaderTitle}>
              {groups.length > 1 ? `Survey ${group.surveyIndex + 1} · ` : ""}
              {group.surveyName}
              {group.surveyDate ? ` · ${formatDate(group.surveyDate)}` : ""}
            </div>
            <SiteSurveyVerifyControl
              surveyId={group.surveyId}
              surveyName={group.surveyName}
              isVerified={group.isVerified}
              canVerify={canVerify}
              verifying={verifyingSurveyId === group.surveyId}
              onVerify={onVerifySurvey}
              compact
            />
          </div>
          {group.areas.map((row, roomIndex) => (
            <SiteRoomEditCard
              key={row._id}
              row={row}
              roomIndex={roomIndex}
              onFieldChange={onFieldChange}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function WorkflowEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const searchParams = useSearchParams();
  const fromTab = searchParams.get("from");
  const surveyId = searchParams.get("surveyId") || undefined;
  const isQuotationEdit = fromTab === "Quotations";
  const isInstallationEdit = fromTab === "Installations";

  const [loading, setLoading] = useState(!isQuotationEdit);
  const [saving, setSaving] = useState(false);
  const [verifyingSurveyId, setVerifyingSurveyId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [customerCode, setCustomerCode] = useState("");
  const [rawSurveyRecords, setRawSurveyRecords] = useState<any[]>([]);
  const [siteRows, setSiteRows] = useState<SiteDetailRow[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<"survey" | "installations">(fromTab?.toLowerCase() === "installations" ? "installations" : "survey");
  const [selectedImages, setSelectedImages] = useState<string[] | null>(null);
  const [activeImageTitle, setActiveImageTitle] = useState("");

  useEffect(() => {
    if (!id || isQuotationEdit) return;

    const fetchData = async () => {
      try {
        const result = isInstallationEdit
          ? await adminApi.getInstallationWorkflowDetails(id)
          : await adminApi.getCustomerWorkflowDetails(id);
        const raw = isInstallationEdit
          ? [result.survey]
          : (result.surveys || []).slice().sort(
              (a: any, b: any) =>
                new Date(b.createdAt || b.surveyDate || 0).getTime() -
                new Date(a.createdAt || a.surveyDate || 0).getTime()
            );
        setCustomer(result.customer);
        setCustomerCode(String(result.customer?.customerCode || ""));
        setRawSurveyRecords(raw);
        setSiteRows(mapSiteDetails(raw));
      } catch (err: any) {
        toast.error(err.message || "Failed to load workflow details.");
        router.push("/workflow");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isQuotationEdit, isInstallationEdit, router]);

  const surveyInfo = useMemo(() => {
    if (!customer) return null;
    return mapSurveyDetails(customer, rawSurveyRecords);
  }, [customer, rawSurveyRecords]);

  const noteEntries: NoteEntry[] = useMemo(() => {
    if (!customer) return [];
    return mapNotes(rawSurveyRecords, customer);
  }, [customer, rawSurveyRecords]);

  const siteDetailGroups = useMemo(() => {
    const groups = mapSiteDetailGroups(rawSurveyRecords, customer);
    const byId = new Map(siteRows.map((r) => [r._id, r]));
    return groups.map((g) => ({
      ...g,
      areas: g.areas.map((a) => byId.get(a._id) ?? a),
    }));
  }, [rawSurveyRecords, siteRows, customer]);

  const installationSurvey = useMemo(() => {
    if (isInstallationEdit && rawSurveyRecords[0]) {
      return rawSurveyRecords[0];
    }
    return resolveInstallationSurvey(rawSurveyRecords);
  }, [isInstallationEdit, rawSurveyRecords]);

  async function refreshWorkflow() {
    const result = isInstallationEdit
      ? await adminApi.getInstallationWorkflowDetails(id)
      : await adminApi.getCustomerWorkflowDetails(id);
    const raw = isInstallationEdit
      ? [result.survey]
      : (result.surveys || []).slice().sort(
          (a: any, b: any) =>
            new Date(b.createdAt || b.surveyDate || 0).getTime() -
            new Date(a.createdAt || a.surveyDate || 0).getTime()
        );
    setCustomer(result.customer);
    setRawSurveyRecords(raw);
    setSiteRows(mapSiteDetails(raw));
  }

  const handleSiteRowChange = (idx: number, field: keyof SiteDetailRow, value: string) => {
    const updated = [...siteRows];
    updated[idx] = { ...updated[idx], [field]: value };
    setSiteRows(updated);
  };

  const handleSiteRowChangeById = (rowId: string, field: keyof SiteDetailRow, value: string) => {
    const idx = siteRows.findIndex((r) => r._id === rowId);
    if (idx === -1) return;
    handleSiteRowChange(idx, field, value);
  };

  const handleAddNote = async () => {
    const text = newNoteText.trim();
    if (!text) {
      toast.error("Please enter a note.");
      return;
    }

    setAddingNote(true);
    try {
      const response = await adminApi.updateCustomerWorkflow(id, {
        notes: [{ note: text, title: "Survey Note" }],
      });
      toast.success(response.message || "Note added successfully.");
      setNewNoteText("");
      const result = await adminApi.getCustomerWorkflowDetails(id);
      setCustomer(result.customer);
      const raw = (result.surveys || []).slice().sort(
        (a: any, b: any) =>
          new Date(b.createdAt || b.surveyDate || 0).getTime() -
          new Date(a.createdAt || a.surveyDate || 0).getTime()
      );
      setRawSurveyRecords(raw);
    } catch (err: any) {
      toast.error(err.message || "Failed to add note.");
    } finally {
      setAddingNote(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === "survey") {
        await adminApi.updateCustomerWorkflow(id, {
          customerCode: customerCode.trim(),
          surveys: siteRows,
        });
        toast.success("Survey site details saved successfully.");
        router.push(`/workflow/view/${id}?from=${fromTab || "Surveys"}`);
      } else if (isInstallationEdit) {
        router.push(`/workflow/view/${id}?from=Installations`);
      } else {
        router.push(`/workflow/view/${id}?from=Installations`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifySurvey = async (surveyId: string, surveyName: string) => {
    if (!window.confirm(`Are you sure you want to verify "${surveyName}"?`)) {
      return;
    }

    setVerifyingSurveyId(surveyId);
    try {
      const response = await adminApi.verifySurveyConfirm(surveyId);
      toast.success(response.message || "Survey verified successfully!");
      const result = await adminApi.getCustomerWorkflowDetails(id);
      const raw = (result.surveys || []).slice().sort(
        (a: { createdAt?: string; surveyDate?: string }, b: { createdAt?: string; surveyDate?: string }) =>
          new Date(b.createdAt || b.surveyDate || 0).getTime() -
          new Date(a.createdAt || a.surveyDate || 0).getTime()
      );
      setCustomer(result.customer);
      setRawSurveyRecords(raw);
      setSiteRows(mapSiteDetails(raw));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to verify survey.";
      toast.error(message);
    } finally {
      setVerifyingSurveyId(null);
    }
  };

  if (isQuotationEdit) {
    return (
      <QuotationPdfPreview
        customerId={id}
        surveyId={surveyId}
        fromTab={fromTab || "Quotations"}
        variant="edit"
      />
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className={styles.spinner} />
      </div>
    );
  }

  if (!customer) return null;

  const isContractorAssigned = isInstallationEdit
    ? !!resolveSurveyContractorName(installationSurvey)
    : !!(customer.assignToContractor || customer.contractorName || customer.contractor);
  const isSurveyEdit = fromTab === "Surveys" || activeTab === "survey";
  const workflowTab = fromTab || (activeTab === "survey" ? "Surveys" : "Installations");
  const backUrl = `/workflow?tab=${workflowTab}`;
  const viewUrl = isInstallationEdit
    ? `/workflow/view/${id}?from=Installations`
    : `/workflow/view/${id}?from=${fromTab || "Surveys"}`;
  const displayName = surveyInfo?.surveyName && surveyInfo.surveyName !== "N/A" ? surveyInfo.surveyName : "Survey";
  const surveyStatus = customer.status || "Pending";
  const statusColor = getSurveyStatusColor(surveyStatus);

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push(backUrl)}>
          WORKFLOW
        </span>
        {isSurveyEdit && (
          <>
            <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
            <span style={{ cursor: "pointer" }} onClick={() => router.push(viewUrl)}>
              VIEW SURVEY
            </span>
          </>
        )}
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>
          {isSurveyEdit ? "EDIT SURVEY" : "EDIT WORKFLOW"}
        </span>
      </div>

      <div className={styles.pageHeader} style={{ marginBottom: "2.5rem" }}>
        <div>
          <h1 className={styles.welcomeText}>
            {isSurveyEdit ? `Edit Survey: ${displayName}` : "Edit Workflow"}
          </h1>
          {isSurveyEdit && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
              <span
                style={{
                  backgroundColor: `${statusColor}15`,
                  color: statusColor,
                  padding: "0.25rem 0.75rem",
                  borderRadius: "99px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {formatSurveyStatusLabel(surveyStatus)}
              </span>
              {customer.verifyStatus === "verified" ? (
                <span
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.12)",
                    color: "#10b981",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "99px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Verified
                  {customer.confirmDate
                    ? ` · ${formatDate(customer.confirmDate)}`
                    : ""}
                </span>
              ) : null}
            </div>
          )}

          {fromTab !== "Surveys" && fromTab !== "Installations" && (
            <div
              className={styles.tabs}
              style={{ marginTop: "1.5rem", width: "fit-content", background: "#f1f5f9", padding: "4px", borderRadius: "10px" }}
            >
              <button
                type="button"
                className={`${styles.tab} ${activeTab === "survey" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("survey")}
                style={{ border: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <ClipboardCheck size={18} /> Survey
              </button>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === "installations" ? styles.tabActive : ""}`}
                onClick={() => {
                  if (isContractorAssigned) {
                    setActiveTab("installations");
                  } else {
                    toast.warning("Assign a contractor first to manage materials.");
                  }
                }}
                style={{
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  opacity: isContractorAssigned ? 1 : 0.5,
                  cursor: isContractorAssigned ? "pointer" : "not-allowed",
                }}
                title={!isContractorAssigned ? "Assign a contractor first" : ""}
              >
                <Hammer size={18} /> Installations
              </button>
            </div>
          )}
        </div>

      </div>

      {activeTab === "survey" && surveyInfo && (
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <Info size={22} color="var(--admin-primary, #004d4d)" /> Survey Details
          </div>
          <div className={styles.formGrid}>
            <EditableField
              label="Customer ID"
              value={customerCode}
              onChange={setCustomerCode}
              placeholder="Enter customer ID"
            />
            <ReadOnlyField label="Survey Name" value={surveyInfo.surveyName} />
            <ReadOnlyField label="Sales Person Name" value={surveyInfo.salesPerson} />
            <ReadOnlyField
              label="Survey Date"
              value={surveyInfo.surveyDate ? formatDate(surveyInfo.surveyDate) : "—"}
            />
          </div>
        </section>
      )}

      {activeTab === "survey" ? (
        <>
          <section className={styles.formSection}>
            <div className={styles.sectionTitle}>
              <ClipboardCheck size={22} color="var(--admin-primary, #004d4d)" /> Site Details
            </div>
            <p className={styles.sectionSubtitle}>
              Surveyed areas, fixtures, quantities, and pricing.
            </p>
            <SiteDetailsEditCards
              groups={siteDetailGroups}
              onFieldChange={handleSiteRowChangeById}
              canVerify={isSurveyEdit && hasPermission("Surveys", "create")}
              verifyingSurveyId={verifyingSurveyId}
              onVerifySurvey={handleVerifySurvey}
            />
          </section>

          <section className={styles.formSection}>
            <div className={detailStyles.notesSectionTitle}>
              <span className={detailStyles.notesSectionIcon} aria-hidden>
                <FileText size={22} color="#ea580c" strokeWidth={2} />
              </span>
              Notes
            </div>

            {noteEntries.length === 0 ? (
              <div className={addStyles.emptyState}>No notes on file.</div>
            ) : (
              <NotesList entries={noteEntries} />
            )}

            <div className={detailStyles.notesAddBlock}>
              <label htmlFor="workflow-new-note">New note</label>
              <textarea
                id="workflow-new-note"
                className={styles.formInput}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Enter note text..."
                rows={4}
                style={{ width: "100%", resize: "vertical", minHeight: "100px" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
                <button
                  type="button"
                  className={addStyles.modalSaveBtn}
                  onClick={handleAddNote}
                  disabled={addingNote || !newNoteText.trim()}
                  style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
                >
                  {addingNote ? <Loader2 size={16} className={styles.spinner} /> : <Plus size={16} />}
                  {addingNote ? "Adding..." : "Add Note"}
                </button>
              </div>
            </div>
          </section>
        </>
      ) : (
        <InstallationWorkflowSections
          installationSurvey={installationSurvey}
          mode="edit"
          onRefresh={refreshWorkflow}
          onViewImages={(images, title) => {
            setSelectedImages(images);
            setActiveImageTitle(title);
          }}
        />
      )}

      <div className={styles.actionFooter}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => router.push(backUrl)}
          disabled={saving}
        >
          <X size={20} /> Cancel
        </button>
        <button type="button" className={styles.createBtn} onClick={handleSave} disabled={saving}>
          {saving ? (
            "Saving..."
          ) : (
            <>
              <Save size={20} /> Save Changes
            </>
          )}
        </button>
      </div>

      {selectedImages ? (
        <div className={detailStyles.imgModalOverlay} onClick={() => setSelectedImages(null)}>
          <div className={detailStyles.imgModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={detailStyles.imgModalHeader}>
              <div>
                <h3>{activeImageTitle || "Images"}</h3>
              </div>
              <button type="button" className={detailStyles.closeBtn} onClick={() => setSelectedImages(null)}>
                <X size={20} />
              </button>
            </div>
            <div className={detailStyles.imgModalBody}>
              <div className={detailStyles.modalImageGrid}>
                {selectedImages.map((img, idx) => (
                  <div key={`${img}-${idx}`} className={detailStyles.modalImageWrapper}>
                    <img src={img} alt={`${activeImageTitle} ${idx + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
