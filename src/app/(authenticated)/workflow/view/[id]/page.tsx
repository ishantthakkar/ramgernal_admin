"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import styles from "../../../dashboard.module.css";
import modalStyles from "./workflow-details.module.css";
import {
  Loader2,
  X,
  ClipboardCheck,
  Image as ImageIcon,
  Download,
  Eye,
  FileText,
  Hammer,
  Edit2,
  Info,
} from "lucide-react";
import addStyles from "../../../leads/add/leads-add.module.css";
import { adminApi } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { toast } from "react-toastify";
import { formatDate, formatDateTime } from "@/lib/dateUtils";
import {
  mapNotes,
  mapSiteDetails,
  mapSurveyDetails,
  type NoteEntry,
  type SiteDetailRow,
} from "@/lib/workflow-survey-view";

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
  if (s === "in progress" || s === "in-process") return "#3b82f6";
  return "#64748b";
}

function formatSurveyStatusLabel(status: string): string {
  if (status === "pending_edit_approval") return "Pending Approval";
  if (status === "reopen" || status === "reopened") return "Reopened";
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

function SiteDetailsTable({
  rows,
  onViewImages,
}: {
  rows: SiteDetailRow[];
  onViewImages: (images: string[], area: string) => void;
}) {
  if (!rows.length) {
    return <div className={addStyles.emptyState}>No site survey details found.</div>;
  }

  return (
    <div className={styles.userTableContainer} style={{ marginTop: "0.5rem", overflowX: "auto" }}>
      <table className={styles.userTable}>
        <thead>
          <tr>
            <th style={{ minWidth: "140px" }}>Area</th>
            <th>Height</th>
            <th>Existing Fixture Type</th>
            <th>Existing Bulbs</th>
            <th>Existing Qty</th>
            <th>Proposed Fixture</th>
            <th>Proposed Qty</th>
            <th>Price / Unit</th>
            <th>Total Price</th>
            <th>Note</th>
            <th>Images</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              <td style={{ fontWeight: 600, color: "#1e293b" }}>{row.area}</td>
              <td style={{ color: "#64748b" }}>{row.heightInInches}</td>
              <td style={{ color: "#64748b" }}>{row.existingFixtureType}</td>
              <td style={{ color: "#64748b" }}>{row.existingBulbs}</td>
              <td style={{ color: "#64748b", fontWeight: 600 }}>{row.existingQuantity}</td>
              <td style={{ color: "var(--admin-primary, #004d4d)", fontWeight: 600 }}>{row.proposedFixture}</td>
              <td style={{ color: "#1e293b", fontWeight: 700 }}>{row.proposedQuantity}</td>
              <td style={{ color: "#64748b" }}>
                {row.pricePerUnit !== "—" ? `$${row.pricePerUnit}` : "—"}
              </td>
              <td style={{ fontWeight: 700, color: "#1e293b" }}>
                {row.totalPrice !== "—" ? `$${row.totalPrice}` : "—"}
              </td>
              <td
                style={{
                  maxWidth: "200px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "#64748b",
                  fontSize: "0.8rem",
                }}
                title={row.note}
              >
                {row.note || "—"}
              </td>
              <td>
                {row.images.length > 0 ? (
                  <button
                    type="button"
                    className={modalStyles.viewImgBtn}
                    onClick={() => onViewImages(row.images, row.area)}
                  >
                    <Eye size={14} /> View
                    <span style={{ opacity: 0.7, fontWeight: 500 }}>({row.images.length})</span>
                  </button>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      color: "#94a3b8",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    <ImageIcon size={14} /> None
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SurveyViewSections({
  surveyName,
  salesPerson,
  surveyDate,
  siteDetails,
  noteEntries,
  onViewImages,
}: {
  surveyName: string;
  salesPerson: string;
  surveyDate: string | null;
  siteDetails: SiteDetailRow[];
  noteEntries: NoteEntry[];
  onViewImages: (images: string[], area: string) => void;
}) {
  return (
    <>
      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <Info size={22} color="var(--admin-primary, #004d4d)" /> Survey Details
        </div>
        <div className={styles.formGrid}>
          <ReadOnlyField label="Survey Name" value={surveyName} />
          <ReadOnlyField label="Sales Person Name" value={salesPerson} />
          <ReadOnlyField
            label="Survey Date"
            value={surveyDate ? formatDate(surveyDate) : "—"}
          />
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <ClipboardCheck size={22} color="var(--admin-primary, #004d4d)" /> Site Details
        </div>
        <p className={styles.sectionSubtitle}>
          All surveyed areas, fixtures, quantities, and pricing.
        </p>
        <SiteDetailsTable rows={siteDetails} onViewImages={onViewImages} />
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <FileText size={22} color="var(--admin-primary, #004d4d)" /> Notes
        </div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
            {noteEntries.length === 0 ? (
              <div className={addStyles.emptyState}>No notes on file.</div>
            ) : (
              <div className={addStyles.itemGrid}>
                {noteEntries.map((entry) => (
                  <div key={entry.id} className={addStyles.itemCard}>
                    <div className={addStyles.itemHeader}>
                      <span className={addStyles.itemTitle}>
                        {entry.title || (entry.source === "survey" ? "Survey" : "Customer")}
                      </span>
                      {entry.timestamp && (
                        <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
                          {formatDateTime(entry.timestamp)}
                        </span>
                      )}
                    </div>
                    <div className={addStyles.itemContent} style={{ whiteSpace: "pre-wrap" }}>
                      {entry.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export default function WorkflowViewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const searchParams = useSearchParams();
  const fromTab = searchParams.get("from");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedImages, setSelectedImages] = useState<string[] | null>(null);
  const [activeArea, setActiveArea] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"survey" | "installations">(
    fromTab?.toLowerCase() === "installations" ? "installations" : "survey"
  );

  const isSurveyView = fromTab === "Surveys";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await adminApi.getCustomerWorkflowDetails(id);
        setData(result);
      } catch (err: any) {
        toast.error(err.message || "Failed to load workflow details.");
        router.push("/workflow");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, router]);

  const surveyRecords = useMemo(() => {
    const list = data?.surveys;
    return Array.isArray(list) ? list : [];
  }, [data]);

  const surveyDetails = useMemo(() => {
    if (!data?.customer) {
      return { surveyName: "N/A", salesPerson: "N/A", surveyDate: null as string | null };
    }
    return mapSurveyDetails(data.customer, surveyRecords);
  }, [data, surveyRecords]);

  const siteDetails = useMemo(() => mapSiteDetails(surveyRecords), [surveyRecords]);

  const noteEntries = useMemo(() => {
    if (!data?.customer) return [];
    return mapNotes(surveyRecords, data.customer);
  }, [data, surveyRecords]);

  const handleViewImages = (images: string[], area: string) => {
    setSelectedImages(images);
    setActiveArea(area);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className={styles.spinner} />
      </div>
    );
  }

  if (!data?.customer) return null;

  const { customer } = data;
  const isContractorAssigned = !!(customer.assignToContractor || customer.contractorName || customer.contractor);
  const canEditSurveys = hasPermission("Surveys", "edit");
  const workflowTab = fromTab || (isSurveyView ? "Surveys" : "Installations");
  const backUrl = `/workflow?tab=${workflowTab}`;
  const surveyStatus = customer.status || "Pending";
  const statusColor = getSurveyStatusColor(surveyStatus);
  const displayName = surveyDetails.surveyName !== "N/A" ? surveyDetails.surveyName : "Survey";

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push(backUrl)}>
          WORKFLOW
        </span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>
          {isSurveyView ? "VIEW SURVEY" : "VIEW WORKFLOW"}
        </span>
      </div>

      <div className={styles.pageHeader} style={{ marginBottom: isSurveyView ? "2rem" : undefined }}>
        <div>
          <h1 className={styles.welcomeText}>
            {isSurveyView ? `Survey Profile: ${displayName}` : "Workflow Details"}
          </h1>
          {isSurveyView && (
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
        </div>

        {isSurveyView && canEditSurveys && (
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => router.push(`/workflow/edit/${id}?from=Surveys`)}
          >
            <Edit2 size={20} /> Edit
          </button>
        )}
      </div>

      {!isSurveyView && (
        <div
          className={styles.tabs}
          style={{ marginBottom: "2rem", width: "fit-content", background: "#f1f5f9", padding: "4px", borderRadius: "10px" }}
        >
          {fromTab !== "Installations" && (
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "survey" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("survey")}
              style={{ border: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <ClipboardCheck size={18} /> Survey
            </button>
          )}
          {fromTab !== "Surveys" && (
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "installations" ? styles.tabActive : ""}`}
              onClick={() => {
                if (isContractorAssigned) setActiveTab("installations");
                else toast.warning("Materials are only available after contractor assignment.");
              }}
              style={{
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                opacity: isContractorAssigned ? 1 : 0.5,
                cursor: isContractorAssigned ? "pointer" : "not-allowed",
              }}
            >
              <Hammer size={18} /> Installations
            </button>
          )}
        </div>
      )}

      {isSurveyView || activeTab === "survey" ? (
        <SurveyViewSections
          surveyName={surveyDetails.surveyName}
          salesPerson={surveyDetails.salesPerson}
          surveyDate={surveyDetails.surveyDate}
          siteDetails={siteDetails}
          noteEntries={noteEntries}
          onViewImages={handleViewImages}
        />
      ) : (
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <Hammer size={22} color="var(--admin-primary, #004d4d)" /> Materials Delivered to Site
          </div>
          <p className={styles.sectionSubtitle}>Items and quantities issued for this installation.</p>
          {data.materials?.length > 0 ? (
            <div className={styles.userTableContainer} style={{ marginTop: "0.5rem" }}>
              <table className={styles.userTable}>
                <thead>
                  <tr>
                    <th style={{ width: "80px" }}>Sr. No</th>
                    <th>Item Name</th>
                    <th>Issued Qty</th>
                    <th>Image</th>
                  </tr>
                </thead>
                <tbody>
                  {data.materials.map((item: any, index: number) => (
                    <tr key={index}>
                      <td style={{ fontWeight: 600, color: "#94a3b8" }}>{index + 1}</td>
                      <td style={{ fontWeight: 600, color: "#1e293b" }}>{item.item_name}</td>
                      <td style={{ fontWeight: 700, color: "var(--admin-primary, #004d4d)" }}>{item.issued_qty}</td>
                      <td>
                        {(item.images || []).length > 0 ? (
                          <span style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 500 }}>
                            {item.images.length} image(s)
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>No image</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={addStyles.emptyState}>No materials recorded yet.</div>
          )}
        </section>
      )}

      <div
        className={styles.actionFooter}
        style={{ background: "#f1f5f9", padding: "2.5rem", borderRadius: "16px", marginTop: "3rem", justifyContent: "flex-end" }}
      >
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => router.push(backUrl)}
          style={{ padding: "0.875rem 3rem", background: "#64748b", color: "#ffffff" }}
        >
          <X size={20} /> Close
        </button>
      </div>

      {selectedImages && (
        <div className={modalStyles.imgModalOverlay} onClick={() => setSelectedImages(null)}>
          <div className={modalStyles.imgModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={modalStyles.imgModalHeader}>
              <div>
                <h3>Survey Images</h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
                  Area: <span style={{ color: "#1e293b", fontWeight: 700 }}>{activeArea}</span>
                </p>
              </div>
              <button type="button" className={modalStyles.closeBtn} onClick={() => setSelectedImages(null)}>
                <X size={20} />
              </button>
            </div>
            <div className={modalStyles.imgModalBody}>
              <div className={modalStyles.modalImageGrid}>
                {selectedImages.map((img, idx) => (
                  <div key={idx} className={modalStyles.modalImageWrapper}>
                    <img src={img} alt={`Survey ${idx}`} />
                    <a
                      href={img}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className={modalStyles.downloadIconOverlay}
                      title="Download Image"
                    >
                      <Download size={18} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
