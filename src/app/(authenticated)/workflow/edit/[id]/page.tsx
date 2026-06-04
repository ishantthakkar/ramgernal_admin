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
  CheckCircle2,
  FileText,
  Info,
} from "lucide-react";
import addStyles from "../../../leads/add/leads-add.module.css";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import { formatDate, formatDateTime } from "@/lib/dateUtils";
import {
  mapNotes,
  mapSiteDetails,
  mapSurveyDetails,
  type NoteEntry,
  type SiteDetailRow,
} from "@/lib/workflow-survey-view";
import modalStyles from "../../../commissions/commissions-modal.module.css";
import { hasPermission } from "@/lib/permissions";

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

export default function WorkflowEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const searchParams = useSearchParams();
  const fromTab = searchParams.get("from");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [rawSurveyRecords, setRawSurveyRecords] = useState<any[]>([]);
  const [siteRows, setSiteRows] = useState<SiteDetailRow[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<"survey" | "installations">(fromTab?.toLowerCase() === "installations" ? "installations" : "survey");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    item_name: "",
    issued_qty: "",
    images: [] as File[],
    imagePreviews: [] as string[]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await adminApi.getCustomerWorkflowDetails(id);
        const raw = (result.surveys || []).slice().sort(
          (a: any, b: any) =>
            new Date(b.createdAt || b.surveyDate || 0).getTime() -
            new Date(a.createdAt || a.surveyDate || 0).getTime()
        );
        setCustomer(result.customer);
        setRawSurveyRecords(raw);
        setSiteRows(mapSiteDetails(raw));
        setMaterials(result.materials || []);
      } catch (err: any) {
        toast.error(err.message || "Failed to load workflow details.");
        router.push("/workflow");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, router]);

  const surveyInfo = useMemo(() => {
    if (!customer) return null;
    return mapSurveyDetails(customer, rawSurveyRecords);
  }, [customer, rawSurveyRecords]);

  const noteEntries: NoteEntry[] = useMemo(() => {
    if (!customer) return [];
    return mapNotes(rawSurveyRecords, customer);
  }, [customer, rawSurveyRecords]);

  const handleSiteRowChange = (idx: number, field: keyof SiteDetailRow, value: string) => {
    const updated = [...siteRows];
    updated[idx] = { ...updated[idx], [field]: value };
    setSiteRows(updated);
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

  const handleAddMaterial = () => {
    setNewMaterial({
      item_name: "",
      issued_qty: "",
      images: [],
      imagePreviews: []
    });
    setShowAddModal(true);
  };

  const handleRemoveMaterial = (index: number) => {
    const updated = [...materials];
    updated.splice(index, 1);
    setMaterials(updated);
  };

  const handleMaterialChange = (index: number, field: string, value: any) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    setMaterials(updated);
  };

  const handleModalImageUpload = (files: FileList) => {
    const fileArray = Array.from(files);
    const previews = fileArray.map(file => URL.createObjectURL(file));
    setNewMaterial(prev => ({
      ...prev,
      images: [...prev.images, ...fileArray],
      imagePreviews: [...prev.imagePreviews, ...previews]
    }));
  };

  const removeNewImage = (index: number) => {
    setNewMaterial(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index)
    }));
  };

  const handleSaveNewMaterial = async () => {
    if (!newMaterial.item_name || !newMaterial.issued_qty) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("item_name", newMaterial.item_name);
      formData.append("issued_qty", newMaterial.issued_qty);
      newMaterial.images.forEach(image => {
        formData.append("images", image);
      });

      await adminApi.updateCustomerMaterials(id, formData);
      toast.success("Material added successfully!");

      // Refresh materials list
      const result = await adminApi.getCustomerWorkflowDetails(id);
      setMaterials(result.materials || []);

      setShowAddModal(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to add material.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === "survey") {
        await adminApi.updateCustomerWorkflow(id, { surveys: siteRows });
        toast.success("Survey site details saved successfully.");
        router.push(`/workflow/view/${id}?from=${fromTab || "Surveys"}`);
      } else {
        // For installations, we now save individually via popup, 
        // but we might still want to save other changes if any.
        // For now, just redirect back.
        router.push(`/workflow?tab=${fromTab || "Installations"}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    const name = surveyInfo?.surveyName || customer.name || "this survey";
    if (!window.confirm(`Are you sure you want to verify the survey for ${name}?`)) {
      return;
    }

    setSaving(true);
    try {
      const response = await adminApi.verifyCustomerSurvey(id);
      toast.success(response.message || "Survey verified successfully!");
      router.push(`/workflow?tab=${fromTab || "Surveys"}`);
    } catch (err: any) {
      console.error("Verification error:", err);
      toast.error(err.message || "Failed to verify survey.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className={styles.spinner} />
      </div>
    );
  }

  if (!customer) return null;

  const isContractorAssigned = !!(customer.assignToContractor || customer.contractorName || customer.contractor);
  const isSurveyEdit = fromTab === "Surveys" || activeTab === "survey";
  const workflowTab = fromTab || (activeTab === "survey" ? "Surveys" : "Installations");
  const backUrl = `/workflow?tab=${workflowTab}`;
  const viewUrl = `/workflow/view/${id}?from=${fromTab || "Surveys"}`;
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
                </span>
              ) : (
                <span
                  style={{
                    backgroundColor: "#f1f5f9",
                    color: "#64748b",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "99px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Not Verified
                </span>
              )}
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

        {activeTab === "survey" && customer.verifyStatus !== "verified" && hasPermission("Surveys", "create") && (
          <button
            type="button"
            className={styles.createBtn}
            onClick={handleVerify}
            disabled={saving}
            style={{ background: "#10b981" }}
          >
            {saving ? <Loader2 size={18} className={styles.spinner} /> : <CheckCircle2 size={18} />}
            {saving ? "Verifying..." : "Verify Survey"}
          </button>
        )}
      </div>

      {activeTab === "survey" && surveyInfo && (
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <Info size={22} color="var(--admin-primary, #004d4d)" /> Survey Details
          </div>
          <div className={styles.formGrid}>
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
            <p className={styles.sectionSubtitle}>Modify fixtures, quantities, and pricing for surveyed areas.</p>

            <div className={styles.userTableContainer} style={{ marginTop: "0.5rem", overflowX: "auto" }}>
              <table className={styles.userTable}>
                <thead>
                  <tr>
                    <th style={{ minWidth: "120px" }}>Area</th>
                    <th style={{ minWidth: "80px" }}>Height</th>
                    <th style={{ minWidth: "150px" }}>Existing Fixture Type</th>
                    <th style={{ minWidth: "120px" }}>Existing Bulbs</th>
                    <th style={{ minWidth: "80px" }}>Existing Qty</th>
                    <th style={{ minWidth: "150px" }}>Proposed Fixture</th>
                    <th style={{ minWidth: "80px" }}>Proposed Qty</th>
                    <th style={{ minWidth: "100px" }}>Price / Unit</th>
                    <th style={{ minWidth: "100px" }}>Total Price</th>
                    <th style={{ minWidth: "150px" }}>Note</th>
                    <th style={{ minWidth: "100px" }}>Images</th>
                  </tr>
                </thead>
                <tbody>
                  {siteRows.map((row, index) => (
                    <tr key={row._id || index}>
                      <td>
                        <input
                          type="text"
                          className={styles.formInput}
                          value={row.area || ""}
                          onChange={(e) => handleSiteRowChange(index, "area", e.target.value)}
                          style={{ padding: "0.4rem", fontSize: "0.85rem" }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.formInput}
                          value={row.heightInInches || ""}
                          onChange={(e) => handleSiteRowChange(index, "heightInInches", e.target.value)}
                          style={{ padding: "0.4rem", fontSize: "0.85rem" }}
                          placeholder="in"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.formInput}
                          value={row.existingFixtureType || ""}
                          onChange={(e) => handleSiteRowChange(index, "existingFixtureType", e.target.value)}
                          style={{ padding: "0.4rem", fontSize: "0.85rem" }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.formInput}
                          value={row.existingBulbs || ""}
                          onChange={(e) => handleSiteRowChange(index, "existingBulbs", e.target.value)}
                          style={{ padding: "0.4rem", fontSize: "0.85rem" }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className={styles.formInput}
                          value={row.existingQuantity || ""}
                          onChange={(e) => handleSiteRowChange(index, "existingQuantity", e.target.value)}
                          style={{ padding: "0.4rem", fontSize: "0.85rem" }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.formInput}
                          value={row.proposedFixture || ""}
                          onChange={(e) => handleSiteRowChange(index, "proposedFixture", e.target.value)}
                          style={{ padding: "0.4rem", fontSize: "0.85rem", fontWeight: 600 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className={styles.formInput}
                          value={row.proposedQuantity || ""}
                          onChange={(e) => handleSiteRowChange(index, "proposedQuantity", e.target.value)}
                          style={{ padding: "0.4rem", fontSize: "0.85rem" }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.formInput}
                          value={row.pricePerUnit || ""}
                          onChange={(e) => handleSiteRowChange(index, "pricePerUnit", e.target.value)}
                          style={{ padding: "0.4rem", fontSize: "0.85rem" }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.formInput}
                          value={row.totalPrice || ""}
                          onChange={(e) => handleSiteRowChange(index, "totalPrice", e.target.value)}
                          style={{ padding: "0.4rem", fontSize: "0.85rem", fontWeight: 700 }}
                        />
                      </td>
                      <td>
                        <textarea
                          className={styles.formInput}
                          value={row.note || ""}
                          onChange={(e) => handleSiteRowChange(index, "note", e.target.value)}
                          style={{ padding: "0.4rem", fontSize: "0.8rem", height: "35px", resize: "none" }}
                        />
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600 }}>
                          <ImageIcon size={14} /> {row.images?.length || 0}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {siteRows.length === 0 && (
                    <tr>
                      <td colSpan={11} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontWeight: 600 }}>
                        No survey records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.formSection}>
            <div className={styles.sectionTitle}>
              <FileText size={22} color="var(--admin-primary, #004d4d)" /> Notes
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
                {noteEntries.length > 0 && (
                  <div
                    style={{
                      marginBottom: "1rem",
                      padding: "1rem",
                      background: "#f8fafc",
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#94a3b8",
                        marginBottom: "0.75rem",
                        display: "block",
                      }}
                    >
                      PAST NOTES
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {noteEntries.map((entry, index) => (
                        <div
                          key={entry.id}
                          style={{
                            paddingBottom: index !== noteEntries.length - 1 ? "0.75rem" : "0",
                            borderBottom:
                              index !== noteEntries.length - 1 ? "1px solid #f1f5f9" : "none",
                          }}
                        >
                          <div
                            style={{
                              color: "#64748b",
                              fontSize: "0.7rem",
                              marginBottom: "0.25rem",
                              display: "flex",
                              justifyContent: "space-between",
                              gap: "0.5rem",
                            }}
                          >
                            <span>
                              {entry.title || (entry.source === "survey" ? "Survey" : "Customer")}
                            </span>
                            <span>{entry.timestamp ? formatDateTime(entry.timestamp) : ""}</span>
                          </div>
                          <div style={{ color: "#475569", fontSize: "0.85rem", fontWeight: 500, whiteSpace: "pre-wrap" }}>
                            {entry.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <label>New note</label>
                <textarea
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
            </div>
          </section>
        </>
      ) : (
        <section className={styles.formSection}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <div className={styles.sectionTitle}>
                <Hammer size={22} color="var(--admin-primary, #004d4d)" /> Installation Materials
              </div>
              <p className={styles.sectionSubtitle}>Manage items and quantities issued for installation.</p>
            </div>
            <button
              type="button"
              onClick={handleAddMaterial}
              className={addStyles.modalSaveBtn}
              style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
            >
              <Plus size={16} /> Add Item
            </button>
          </div>

          <div className={styles.userTableContainer} style={{ marginTop: "0.5rem", overflowX: "auto" }}>
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>Sr. No</th>
                  <th style={{ minWidth: "250px" }}>Item Name</th>
                  <th style={{ minWidth: "150px" }}>Issued Qty</th>
                  <th style={{ minWidth: "200px" }}>Image</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((item, index) => (
                  <tr key={item._id || index}>
                    <td style={{ fontWeight: 600, color: "#64748b" }}>{index + 1}</td>
                    <td style={{ fontWeight: 600, color: "#1e293b" }}>{item.item_name}</td>
                    <td style={{ fontWeight: 700, color: "var(--admin-primary, #004d4d)" }}>{item.issued_qty}</td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", maxWidth: "200px" }}>
                        {(item.images || item.image ? [item.image || item.images].flat().filter(Boolean) : []).map((img: string, i: number) => (
                          <div key={i} style={{ width: "40px", height: "40px", borderRadius: "4px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                            <img
                              src={img.startsWith('http') ? img : `${process.env.NEXT_PUBLIC_API_BASE_URL}${img}`}
                              alt="Material"
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                        ))}
                        {(!item.image && (!item.images || item.images.length === 0)) && (
                          <div style={{ color: "#94a3b8", fontSize: "0.75rem" }}>No image</div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {materials.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                      No materials added yet. Click "Add Item" to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Read-only Survey History for reference during Installation editing */}
          <section className={styles.formSection}>
            <div className={styles.sectionTitle}>
              <ClipboardCheck size={22} color="var(--admin-primary, #004d4d)" /> Survey Details
            </div>
            <div className={styles.userTableContainer} style={{ marginTop: "0.5rem", overflowX: "auto" }}>
              <table className={styles.userTable}>
                <thead>
                  <tr>
                    <th style={{ minWidth: "150px" }}>Area</th>
                    <th>Fixture</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {siteRows.map((row, index) => (
                    <tr key={row._id || index}>
                      <td style={{ fontWeight: 600, color: "#1e293b" }}>{row.area}</td>
                      <td style={{ color: "#64748b" }}>{row.proposedFixture}</td>
                      <td style={{ color: "#1e293b", fontWeight: 700 }}>{row.proposedQuantity}</td>
                      <td style={{ color: "#64748b" }}>
                        {row.totalPrice && row.totalPrice !== "—" ? `$${row.totalPrice}` : "—"}
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{row.note || "N/A"}</td>
                    </tr>
                  ))}
                  {siteRows.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>No survey data.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
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

      {/* Add Material Modal */}
      {showAddModal && (
        <div className={modalStyles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={`${modalStyles.modalContent} ${modalStyles.modalMedium}`} onClick={(e) => e.stopPropagation()}>
            <div className={modalStyles.modalHeader}>
              <div>
                <h3>Add Installation Material</h3>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.2rem" }}>
                  Record new items issued for installation.
                </div>
              </div>
              <button className={modalStyles.closeBtn} onClick={() => setShowAddModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className={modalStyles.modalBody}>
              <div className={modalStyles.formGrid} style={{ gridTemplateColumns: "1fr" }}>
                <div className={modalStyles.formGroup}>
                  <label>Item Name <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. LED Panel 60x60"
                    className={modalStyles.formInput}
                    value={newMaterial.item_name}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, item_name: e.target.value }))}
                  />
                </div>

                <div className={modalStyles.formGroup}>
                  <label>Issued Quantity <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    type="number"
                    placeholder="0"
                    className={modalStyles.formInput}
                    value={newMaterial.issued_qty}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, issued_qty: e.target.value }))}
                  />
                </div>

                <div className={modalStyles.formGroup}>
                  <label>Material Images</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {newMaterial.imagePreviews.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "1rem", maxHeight: "300px", overflowY: "auto", padding: "0.5rem", background: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
                        {newMaterial.imagePreviews.map((preview, idx) => (
                          <div key={idx} style={{ position: "relative", aspectRatio: "1/1", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                            <img src={preview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <button
                              onClick={(e) => { e.stopPropagation(); removeNewImage(idx); }}
                              style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(239, 68, 68, 0.9)", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div
                      onClick={() => document.getElementById('materialImages')?.click()}
                      style={{
                        border: "2px dashed #e2e8f0",
                        borderRadius: "12px",
                        padding: "2rem",
                        textAlign: "center",
                        cursor: "pointer",
                        background: "#f8fafc",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = "#0076ce"}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                    >
                      <ImageIcon size={32} color="#94a3b8" style={{ margin: "0 auto 1rem" }} />
                      <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                        Click to upload material photos (Multiple allowed)
                      </div>
                      <input
                        id="materialImages"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => e.target.files && handleModalImageUpload(e.target.files)}
                        style={{ display: "none" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={modalStyles.modalFooter}>
              <button className={modalStyles.cancelBtn} onClick={() => setShowAddModal(false)}>
                <X size={18} /> Cancel
              </button>
              <button
                className={modalStyles.saveBtn}
                onClick={handleSaveNewMaterial}
                disabled={!newMaterial.item_name || !newMaterial.issued_qty || saving}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                {saving ? <Loader2 size={18} className={styles.spinner} /> : <CheckCircle2 size={18} />}
                {saving ? "Saving..." : "Save Material"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
