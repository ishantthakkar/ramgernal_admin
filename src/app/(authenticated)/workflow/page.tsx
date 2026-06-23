"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../dashboard.module.css";
import workflowStyles from "./workflow.module.css";
import {
  ClipboardCheck,
  Hammer,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  User,
  UserPlus,
  X,
  FileText,
} from "lucide-react";
import { toast } from "react-toastify";
import { SignedQuotationUpload } from "@/components/workflow/signed-quotation-upload";
import { adminApi } from "@/lib/api";
import { canViewModule, hasPermission } from "@/lib/permissions";
import modalStyles from "./assign-modal.module.css";
import {
  fetchWorkflowTabData,
  filterWorkflowRows,
  loadWorkflowCustomerMetaMap,
  type WorkflowCustomerMeta,
  type WorkflowTab,
  type WorkflowTabRow,
} from "@/lib/mappers/workflow";
import { getStatusBadgeStyle } from "@/lib/mappers/status-labels";
import {
  formatAdminInspectionApprovalLabel,
  getAdminInspectionApprovalColor,
} from "@/lib/workflow-installation";

function QuotationPdfLink({
  url,
  label,
  title,
}: {
  url: string;
  label: string;
  title?: string;
}) {
  if (!url) {
    return <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>—</span>;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={workflowStyles.btnPrimary}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        textDecoration: "none",
      }}
      title={title || label}
    >
      <FileText size={14} />
      {label}
    </a>
  );
}

export default function WorkflowPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const canViewSurveys = canViewModule("Surveys");
  const canViewInstallations = canViewModule("Installation");
  const canViewInspections = canViewModule("Inspection");

  const tabParam = searchParams.get("tab");
  const validTabs = ["Surveys", "Quotations", "Installations", "Inspections"].filter(t => {
    if (t === "Surveys" || t === "Quotations") return canViewSurveys;
    if (t === "Installations") return canViewInstallations;
    if (t === "Inspections") return canViewInspections;
    return false;
  });

  const initialTab = validTabs.includes(tabParam || "") ? tabParam! : (validTabs[0] || "Surveys");
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WorkflowTabRow[]>([]);
  const [customerMetaMap, setCustomerMetaMap] = useState<
    Map<string, WorkflowCustomerMeta>
  >(new Map());

  // Permissions for actions
  const canEditSurveys = hasPermission("Surveys", "edit");
  const canEditInstallations = hasPermission("Installation", "edit");
  const canEditInspections = hasPermission("Inspection", "edit");

  const canCreateSurveys = hasPermission("Surveys", "create");
  const canCreateInstallations = hasPermission("Installation", "create");

  // Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignType, setAssignType] = useState<"Contractor" | "Project Manager">("Contractor");
  const [targetRecord, setTargetRecord] = useState<any>(null);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [counts, setCounts] = useState({
    totalSurveys: 0,
    totalQuotations: 0,
    totalInstallations: 0,
    totalInspections: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const fetchWorkflowData = async () => {
    setLoading(true);
    setData([]);
    try {
      const { rows, total } = await fetchWorkflowTabData(
        activeTab as WorkflowTab,
        customerMetaMap.size > 0 ? customerMetaMap : undefined
      );
      setData(rows);

      if (activeTab === "Surveys") {
        setCounts((prev) => ({ ...prev, totalSurveys: total }));
      } else if (activeTab === "Quotations") {
        setCounts((prev) => ({ ...prev, totalQuotations: total }));
      } else if (activeTab === "Installations") {
        setCounts((prev) => ({ ...prev, totalInstallations: total }));
      } else if (activeTab === "Inspections") {
        setCounts((prev) => ({ ...prev, totalInspections: total }));
      }
    } catch (err) {
      console.error("Failed to fetch workflow data:", err);
      toast.error(`Failed to load ${activeTab.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflowCustomerMetaMap()
      .then(setCustomerMetaMap)
      .catch((err) => console.warn("Failed to preload customer meta:", err));
  }, []);

  useEffect(() => {
    fetchWorkflowData();
  }, [activeTab, customerMetaMap.size]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  useEffect(() => {
    const fetchWorkflowStats = async () => {
      setStatsLoading(true);
      try {
        const stats = await adminApi.getWorkflowStats();
        setCounts({
          totalSurveys: stats.totalSurveys ?? 0,
          totalQuotations: stats.totalQuotations ?? 0,
          totalInstallations: stats.totalInstallations ?? 0,
          totalInspections: stats.totalInspections ?? 0,
        });
      } catch (err) {
        console.warn("Failed to fetch workflow stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchWorkflowStats();
  }, []);

  const openAssignModal = async (type: "Contractor" | "Project Manager", record: any) => {
    setAssignType(type);
    setTargetRecord(record);
    setShowAssignModal(true);
    setModalLoading(true);
    setAvailableStaff([]);

    try {
      let apiRole = "";
      if (type === "Project Manager") apiRole = "Project Manager";
      else if (type === "Contractor") apiRole = "Contractor";

      const response = await adminApi.getUserList(apiRole || type);
      const staff = response.users || response.data || response;
      setAvailableStaff(Array.isArray(staff) ? staff : []);
    } catch (err) {
      console.error("Failed to fetch staff:", err);
      toast.error(`Could not load ${type} list.`);
    } finally {
      setModalLoading(false);
    }
  };

  const handleAssignStaff = async (staff: any) => {
    try {
      setModalLoading(true);

      const surveyId = targetRecord?.surveyId || targetRecord?.rowId;
      if (!surveyId) {
        toast.error("Survey ID is missing for this installation.");
        return;
      }

      const isChanging =
        (assignType === "Contractor" &&
          targetRecord?.contractor &&
          targetRecord.contractor !== "Unassigned") ||
        (assignType === "Project Manager" &&
          targetRecord?.projectManager &&
          targetRecord.projectManager !== "Unassigned");

      const response =
        assignType === "Contractor"
          ? await adminApi.assignContractor(surveyId, staff._id)
          : await adminApi.assignProjectManager(surveyId, staff._id);

      toast.success(
        response.message ||
          `${assignType} ${isChanging ? "changed" : "assigned"} successfully.`
      );
      setShowAssignModal(false);
      fetchWorkflowData();
    } catch (err: any) {
      console.error("Assignment error:", err);
      toast.error(err.message || `Failed to assign ${assignType}.`);
    } finally {
      setModalLoading(false);
    }
  };

  const isChangingAssignment =
    targetRecord &&
    ((assignType === "Contractor" &&
      targetRecord.contractor &&
      targetRecord.contractor !== "Unassigned") ||
      (assignType === "Project Manager" &&
        targetRecord.projectManager &&
        targetRecord.projectManager !== "Unassigned"));

  const summaryStats = [
    { label: "Total Surveys", value: counts.totalSurveys, icon: ClipboardCheck, color: "#3b6fd9", bg: "#e8f0fe" },
    { label: "Total Quotations", value: counts.totalQuotations, icon: FileText, color: "#7c3aed", bg: "#ede9fe" },
    { label: "Total Installations", value: counts.totalInstallations, icon: Hammer, color: "#475569", bg: "#f1f5f9" },
    { label: "Total Inspections", value: counts.totalInspections, icon: ClipboardList, color: "#0d9488", bg: "#ccfbf1" },
  ];

  const getHeaders = () => {
    if (activeTab === "Surveys") {
      return [
        "ID",
        "Customer",
        "Survey",
        "DBA",
        "Sales Person",
        "Sales Manager",
        "Status",
        "Actions",
      ];
    }

    if (activeTab === "Quotations") {
      return [
        "ID",
        "Customer",
        "Survey",
        "Sales Manager",
        "Sales Person",
        "Generated",
        "Signed",
        "Status",
        "Actions",
      ];
    }

    if (activeTab === "Installations") {
      return ["ID", "Job No", "Customer", "DBA", "Sales Person", "Contractor", "Project Manager", "Installation Status", "Actions"];
    }

    if (activeTab === "Inspections") {
      return [
        "Customer ID",
        "Customer",
        "DBA",
        "Sales Person",
        "Contractor",
        "Project Manager",
        "Inspection Status",
        "Admin Approval",
        "Actions",
      ];
    }
    return [];
  };

  const tableColSpan = getHeaders().length;

  const getStatusStyle = (status: string) => getStatusBadgeStyle(status);

  const filteredData = useMemo(
    () => filterWorkflowRows(data, activeTab as WorkflowTab, searchTerm),
    [data, searchTerm, activeTab]
  );

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  function getWorkflowRowKey(item: WorkflowTabRow, index: number): string {
    const row = item as Record<string, unknown>;
    return String(row.rowId || row.surveyId || row._id || `${activeTab}-${index}`);
  }

  function row(item: WorkflowTabRow): Record<string, unknown> {
    return item as Record<string, unknown>;
  }

  function getQuotationStatusStyle(status: string) {
    switch (status?.toLowerCase()) {
      case "approved":
        return { color: "#3b82f6", bg: "#eff6ff" };
      case "pending":
        return { color: "#f59e0b", bg: "#fffbeb" };
      default:
        return { color: "#64748b", bg: "#f8fafc" };
    }
  }

  return (
    <div className={styles.usersPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>WORKFLOW</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Workflow</h1>
      </div>

      <div className={workflowStyles.workflowStatsGrid}>
        {summaryStats.map((stat) => (
          <div key={stat.label} className={workflowStyles.workflowStatCard}>
            <div
              className={workflowStyles.workflowStatIcon}
              style={{ backgroundColor: stat.bg, color: stat.color }}
            >
              <stat.icon size={22} />
            </div>
            <div className={workflowStyles.workflowStatValue}>
              {statsLoading ? "—" : stat.value.toLocaleString()}
            </div>
            <div className={workflowStyles.workflowStatLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={workflowStyles.workflowTabs}>
            {validTabs.map((tab) => (
              <div
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
                onClick={() => {
                  setActiveTab(tab);
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("tab", tab);
                  router.replace(`/workflow?${params.toString()}`, { scroll: false });
                }}
              >
                {tab}
              </div>
            ))}
          </div>
          <div className={styles.searchUsers}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              className={styles.searchInputSmall}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className={styles.userTableContainer}>
          <table className={styles.userTable}>
            <thead>
              <tr>
                {getHeaders().map((header, idx) => <th key={typeof header === 'string' ? header : idx}>{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={tableColSpan} style={{ textAlign: "center", padding: "4rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", color: "#94a3b8" }}>
                      <Loader2 size={32} className={styles.spinner} />
                      <span style={{ fontWeight: 600 }}>Synchronizing workflow data...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={tableColSpan} style={{ textAlign: "center", padding: "4rem", color: "#94a3b8", fontWeight: 600 }}>
                    No {activeTab.toLowerCase()} found.
                  </td>
                </tr>
              ) : (
                currentItems.map((item, index) => {
                  const r = row(item);
                  return (
                  <tr key={getWorkflowRowKey(item, index)}>
                    {activeTab === "Surveys" ? (
                      <>
                        <td style={{ fontWeight: 600, color: "#94a3b8" }}>{String(r.leadId || "—")}</td>
                        <td>
                          <span
                            className={workflowStyles.linkName}
                            onClick={() =>
                              router.push(
                                `/workflow/view/${r._id}?from=Surveys&surveyId=${r.surveyId}`
                              )
                            }
                          >
                            {String(r.leadName || "—")}
                          </span>
                        </td>
                        <td style={{ color: "#1e293b", fontWeight: 700 }}>{String(r.surveyName || "—")}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{String(r.dba || "—")}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{String(r.salesPerson || "—")}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{String(r.salesManager || "—")}</td>
                        <td>
                          <div className={styles.statusCell}>
                            <span
                              className={styles.statusDotActive}
                              style={{
                                backgroundColor: getStatusStyle(String(r.surveyStatus || "")).color,
                              }}
                            />
                            <span
                              style={{
                                color: getStatusStyle(String(r.surveyStatus || "")).color,
                                fontWeight: 600,
                                fontSize: "0.875rem",
                              }}
                            >
                              {String(r.surveyStatus || "—")}
                            </span>
                          </div>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {canEditSurveys ? (
                            <button
                              type="button"
                              className={styles.assignBtn}
                              onClick={() =>
                                router.push(
                                  `/workflow/edit/${r._id}?from=Surveys&surveyId=${r.surveyId}`
                                )
                              }
                            >
                              Edit
                            </button>
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>—</span>
                          )}
                        </td>
                      </>
                    ) : activeTab === "Quotations" ? (
                      <>
                        <td style={{ fontWeight: 600, color: "#94a3b8" }}>{String(r.leadId || "—")}</td>
                        <td>
                          <span
                            className={workflowStyles.linkName}
                            onClick={() =>
                              router.push(
                                `/workflow/quotations/${r.customerId}?surveyId=${r.surveyId}&from=Quotations`
                              )
                            }
                          >
                            {String(r.customerName || "—")}
                          </span>
                        </td>
                        <td style={{ color: "#1e293b", fontWeight: 700 }}>{String(r.surveyName || "—")}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{String(r.salesManager || "—")}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{String(r.salesPerson || "—")}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <QuotationPdfLink
                            url={String(r.generatedPdfUrl || "")}
                            label="PDF"
                            title={String(r.generatedPdfName || "")}
                          />
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {r.signedPdfUrl ? (
                            <QuotationPdfLink
                              url={String(r.signedPdfUrl || "")}
                              label="PDF"
                              title={String(r.signedPdfName || "")}
                            />
                          ) : canCreateSurveys ? (
                            <SignedQuotationUpload
                              customerId={String(r.customerId || "")}
                              surveyId={String(r.surveyId || "")}
                              onUploaded={fetchWorkflowData}
                            />
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>—</span>
                          )}
                        </td>
                        <td>
                          <div className={styles.statusCell}>
                            <span
                              className={styles.statusDotActive}
                              style={{
                                backgroundColor: getQuotationStatusStyle(String(r.quotationStatus || "")).color,
                              }}
                            />
                            <span style={{ color: "#1e293b", fontWeight: 600 }}>
                              {String(r.statusLabel || "—")}
                            </span>
                          </div>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className={styles.assignBtn}
                            onClick={() =>
                              router.push(
                                `/workflow/edit/${r.customerId}?surveyId=${r.surveyId}&from=Quotations`
                              )
                            }
                          >
                            Edit
                          </button>
                        </td>
                      </>
                    ) : activeTab === "Installations" ? (
                      <>
                        <td style={{ fontWeight: 600, color: "#94a3b8" }}>
                          {String(r.leadId || r.customerCode || r.accountNumber || "—")}
                        </td>
                        <td style={{ fontWeight: 600, color: "#1e293b" }}>
                          {String(r.jobId || "—")}
                        </td>
                        <td>
                          <span
                            className={workflowStyles.linkName}
                            onClick={() => router.push(`/workflow/view/${r.surveyId}?from=Installations`)}
                          >
                            {String(r.customerName || "—")}
                          </span>
                        </td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{String(r.company || "—")}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{String(r.salesPerson || "—")}</td>
                        <td>
                          {r.contractor && r.contractor !== "Unassigned" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1e293b", fontWeight: 600 }}>
                              <User size={14} color="#94a3b8" />
                              {String(r.contractor)}
                            </div>
                          ) : canCreateInstallations ? (
                            <button
                              type="button"
                              className={styles.assignBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                openAssignModal("Contractor", r);
                              }}
                              style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                            >
                              <UserPlus size={14} /> Assign
                            </button>
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Unassigned</span>
                          )}
                        </td>
                        <td>
                          {r.projectManager && r.projectManager !== "Unassigned" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1e293b", fontWeight: 600 }}>
                              <User size={14} color="#94a3b8" />
                              {String(r.projectManager)}
                            </div>
                          ) : canCreateInstallations ? (
                            <button
                              className={styles.assignBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                openAssignModal("Project Manager", r);
                              }}
                              style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                            >
                              <UserPlus size={14} /> Assign
                            </button>
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Unassigned</span>
                          )}
                        </td>
                        <td>
                          <div className={styles.statusCell}>
                            {r.status !== "-" && (
                              <span
                                className={styles.statusDotActive}
                                style={{ backgroundColor: getStatusStyle(String(r.status || "")).color }}
                              ></span>
                            )}
                            <span style={{ color: "#1e293b", fontWeight: 600 }}>
                              {String(r.status || "—")}
                            </span>
                          </div>
                        </td>
                      </>
                    ) : activeTab === "Inspections" ? (
                      <>
                        <td style={{ fontWeight: 600, color: "#94a3b8" }}>
                          {String(r.leadId || r.customerCode || "—")}
                        </td>
                        <td>
                          <span
                            className={workflowStyles.linkName}
                            onClick={() =>
                              router.push(
                                `/workflow/view/${r.surveyId || r._id}?from=Inspections`
                              )
                            }
                          >
                            {String(r.customerName || "—")}
                          </span>
                        </td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{String(r.company || "—")}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{String(r.salesPerson || "—")}</td>
                        <td>
                          {r.contractor && r.contractor !== "Unassigned" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1e293b", fontWeight: 600 }}>
                              <User size={14} color="#94a3b8" />
                              {String(r.contractor)}
                            </div>
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Unassigned</span>
                          )}
                        </td>
                        <td>
                          {r.projectManager && r.projectManager !== "Unassigned" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1e293b", fontWeight: 600 }}>
                              <User size={14} color="#94a3b8" />
                              {String(r.projectManager)}
                            </div>
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Unassigned</span>
                          )}
                        </td>
                        <td>
                          <div className={styles.statusCell}>
                            {r.status !== "-" && (
                              <span
                                className={styles.statusDotActive}
                                style={{ backgroundColor: getStatusStyle(String(r.status || "")).color }}
                              ></span>
                            )}
                            <span style={{ color: "#1e293b", fontWeight: 600 }}>
                              {String(r.status || "To Do")}
                            </span>
                          </div>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <span
                            style={{
                              color: getAdminInspectionApprovalColor(
                                String(r.inspectionStatusRaw || "")
                              ),
                              fontWeight: 700,
                              fontSize: "0.85rem",
                            }}
                          >
                            {formatAdminInspectionApprovalLabel(
                              String(r.inspectionStatusRaw || "")
                            )}
                          </span>
                        </td>
                      </>
                    ) : null}

                    {activeTab !== "Surveys" && activeTab !== "Quotations" && (
                      <td>
                        {((activeTab === "Installations" && canEditInstallations) ||
                          (activeTab === "Inspections" && canEditInspections)) && (
                            <button
                              type="button"
                              className={styles.assignBtn}
                              onClick={() =>
                                router.push(
                                  `/workflow/edit/${
                                    activeTab === "Installations" || activeTab === "Inspections"
                                      ? r.surveyId || r._id
                                      : r._id
                                  }?from=${activeTab}`
                                )
                              }
                            >
                              Edit
                            </button>
                          )}
                      </td>
                    )}
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.tableFooter}>
          <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
            Showing {filteredData.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} results
          </div>
          <div className={styles.pagination}>
            <div
              className={`${styles.pageBtn} ${currentPage === 1 ? styles.disabled : ""}`}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft size={18} />
            </div>

            {[...Array(totalPages)].map((_, i) => (
              <div
                key={i}
                className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.pageActive : ""}`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </div>
            ))}

            <div
              className={`${styles.pageBtn} ${currentPage === totalPages ? styles.disabled : ""}`}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <ChevronRight size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className={modalStyles.modalOverlay} onClick={() => setShowAssignModal(false)}>
          <div className={modalStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={modalStyles.modalHeader}>
              <h3>{isChangingAssignment ? "Change" : "Assign"} {assignType}</h3>
              <button className={modalStyles.closeBtn} onClick={() => setShowAssignModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className={modalStyles.modalBody}>
              {modalLoading ? (
                <div className={modalStyles.modalLoading}>
                  <Loader2 size={40} className={modalStyles.spinner} />
                  <p>Fetching available {assignType.toLowerCase()}s...</p>
                </div>
              ) : availableStaff.length === 0 ? (
                <div className={modalStyles.emptyState}>
                  <p>No {assignType.toLowerCase()}s found in the system.</p>
                </div>
              ) : (
                <div className={modalStyles.staffList}>
                  {availableStaff.map((staff) => (
                    <div
                      key={staff._id}
                      className={modalStyles.staffItem}
                    >
                      <div className={modalStyles.staffLeft}>
                        <div className={modalStyles.staffAvatar}>
                          {staff.fullName?.charAt(0) || "U"}
                        </div>
                        <div className={modalStyles.staffInfo}>
                          <span className={modalStyles.staffName}>{staff.fullName}</span>
                          <span className={modalStyles.staffRole}>{staff.userRole || assignType}</span>
                        </div>
                      </div>
                      <button
                        className={modalStyles.modalAssignBtn}
                        onClick={() => handleAssignStaff(staff)}
                      >
                        {isChangingAssignment ? "Change" : "Assign"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
