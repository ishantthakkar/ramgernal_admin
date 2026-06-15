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
import { WorkflowSurveyListModal } from "@/components/workflow/workflow-survey-list-modal";
import { adminApi } from "@/lib/api";
import { canViewModule, hasPermission } from "@/lib/permissions";
import modalStyles from "./assign-modal.module.css";
import {
  mapSurveyQuotationListItem,
  type SurveyQuotationApiRow,
} from "@/lib/quotation-utils";
import { mapInstallationSurveyRow } from "@/lib/workflow-installation";

function resolveUserDisplayName(
  user: { fullName?: string; _id?: unknown } | null | undefined
): string {
  if (!user) return "—";
  const idStr = String(user._id || "");
  if (idStr === "[object Object]" || !user.fullName) return "—";
  return user.fullName;
}

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

// Mock data for workflow items
const MOCK_SURVEYS = [
  {
    _id: "S001",
    customerName: "John Doe",
    company: "Sunwell Solar",
    salesperson: "Alice Smith",
    contractor: "",
    projectManager: "",
    surveyStatus: "Completed",
    installationStatus: "In Progress",
    inspectionStatus: "Not Started",
    date: "2024-04-20"
  },
  {
    _id: "S002",
    customerName: "Jane Roe",
    company: "Green Energy Co",
    salesperson: "Bob Johnson",
    contractor: "Dave Wilson",
    projectManager: "Sarah Connor",
    surveyStatus: "Verified",
    installationStatus: "Not Started",
    inspectionStatus: "Not Started",
    date: "2024-04-19"
  },
  {
    _id: "S003",
    customerName: "Marcus Aurelius",
    company: "Rome Renewables",
    salesperson: "Alice Smith",
    contractor: "",
    projectManager: "",
    surveyStatus: "Pending",
    installationStatus: "Not Started",
    inspectionStatus: "Not Started",
    date: "2024-04-21"
  },
];

const MOCK_INSTALLATIONS = [
  {
    _id: "inst_1",
    displayId: "VC-92410",
    customerName: "Andrew Scoff",
    company: "Xelectronics",
    salesPerson: "Jack Hclison",
    contractor: "Methew Zynd",
    projectManager: "Medison Cly",
    status: "Not Started"
  },
  {
    _id: "inst_2",
    displayId: "VC-92410",
    customerName: "Cliff Booth",
    company: "Xelectronics",
    salesPerson: "Jack Hclison",
    contractor: "Methew Zynd",
    projectManager: "Medison Cly",
    status: "In Process"
  },
  {
    _id: "inst_3",
    displayId: "VC-92410",
    customerName: "Mark Zyden",
    company: "Xelectronics",
    salesPerson: "Jack Hclison",
    contractor: "Methew Zynd",
    projectManager: "Medison Cly",
    status: "Completed"
  },
  {
    _id: "inst_4",
    displayId: "VC-92410",
    customerName: "Halisen Margot",
    company: "Xelectronics",
    salesPerson: "Jack Hclison",
    contractor: "Methew Zynd",
    projectManager: "Medison Cly",
    status: "Verified"
  },
  {
    _id: "inst_5",
    displayId: "VC-92410",
    customerName: "Halisen Margot",
    company: "Xelectronics",
    salesPerson: "Jack Hclison",
    contractor: "Methew Zynd",
    projectManager: "Medison Cly",
    status: "Reopened"
  },
];

const MOCK_INSPECTIONS = [
  {
    _id: "insp_1",
    customerName: "Andrew Scoff",
    company: "Xelectronics",
    salesPerson: "Jack Hclison",
    contractor: "Methew Zynd",
    projectManager: "Medison Cly",
    status: "Not Started"
  },
  {
    _id: "insp_2",
    customerName: "Cliff Booth",
    company: "Xelectronics",
    salesPerson: "Jack Hclison",
    contractor: "Methew Zynd",
    projectManager: "Medison Cly",
    status: "In Process"
  },
  {
    _id: "insp_3",
    customerName: "Mark Zyden",
    company: "Xelectronics",
    salesPerson: "Jack Hclison",
    contractor: "Methew Zynd",
    projectManager: "Medison Cly",
    status: "Completed"
  },
  {
    _id: "insp_4",
    customerName: "Halisen Margot",
    company: "Xelectronics",
    salesPerson: "Jack Hclison",
    contractor: "Methew Zynd",
    projectManager: "Medison Cly",
    status: "Verified"
  },
  {
    _id: "insp_5",
    customerName: "Halisen Margot",
    company: "Xelectronics",
    salesPerson: "Jack Hclison",
    contractor: "Methew Zynd",
    projectManager: "Medison Cly",
    status: "Reopened"
  },
];

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
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>(MOCK_SURVEYS);

  // Permissions for actions
  const canEditSurveys = hasPermission("Surveys", "edit");
  const canEditInstallations = hasPermission("Installation", "edit");
  const canEditInspections = hasPermission("Inspection", "edit");

  const canCreateSurveys = hasPermission("Surveys", "create");
  const canCreateInstallations = hasPermission("Installation", "create");
  const canCreateInspections = hasPermission("Inspection", "create");

  // Survey list modal (per-customer surveys)
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [surveyModalCustomer, setSurveyModalCustomer] = useState<{
    _id: string;
    leadName: string;
    surveyStatus: string;
  } | null>(null);

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
      if (activeTab === "Surveys") {
        const response = await adminApi.getCustomers();
        const customers = response.customers || response.data || [];

        const normalizedData = customers.map((c: any) => {
          const lead = typeof c.leadId === "object" && c.leadId !== null ? c.leadId : null;
          const customerId = String(c.customerCode || c.customer_code || "");
          return {
            _id: c.id || c._id,
            customerId,
            leadId: c.lead_id || lead?.lead_id || "",
            leadName: c.leadName || lead?.leadName || lead?.name || c.name || "",
            dba: c.dba || lead?.dba || "",
            salesPerson: c.salesPersonName || "Unassigned",
            salesManager: c.salesManagerName || "",
            surveyStatus: c.status || "Pending",
            verifyStatus: c.verifyStatus || "pending",
            date: c.convertedDate || c.createdDate,
          };
        }).filter((item: any) => {
          const status = item.surveyStatus?.toLowerCase();
          if (item.verifyStatus === "verified") return true;
          return (
            status === "submitted" ||
            status === "completed" ||
            status === "reopened" ||
            status === "reopen" ||
            status === "pending_edit_approval"
          );
        });
        setData(normalizedData);
        setCounts((prev) => ({
          ...prev,
          totalSurveys: normalizedData.length,
        }));

      } else if (activeTab === "Quotations") {
        const [quotationsRes, customersListRes] = await Promise.all([
          adminApi.getQuotationsAdmin(),
          adminApi.getCustomers(),
        ]);
        const quotations = (quotationsRes.quotations || []) as SurveyQuotationApiRow[];

        const customerMetaMap = new Map<
          string,
          { leadId: string; salesManagerName: string; salesPersonName: string }
        >();
        for (const row of customersListRes.customers || []) {
          const id = String(row.id || row._id || "");
          if (!id) continue;
          customerMetaMap.set(id, {
            leadId: row.lead_id || "",
            salesManagerName: row.salesManagerName || "",
            salesPersonName: row.salesPersonName || "",
          });
        }

        const normalizedData = quotations.map((row, index) => {
          const customerId = String(row.customerId || "");
          const meta = customerMetaMap.get(customerId);
          return mapSurveyQuotationListItem(row, index, meta);
        });
        setData(normalizedData);
        setCounts((prev) => ({
          ...prev,
          totalQuotations: quotationsRes.total ?? normalizedData.length,
        }));

      } else if (activeTab === "Installations") {
        const response = await adminApi.getInstallations();
        const surveys = response.surveys || response.installations || response.data || [];

        const normalizedData = (Array.isArray(surveys) ? surveys : []).map((survey: Record<string, unknown>) =>
          mapInstallationSurveyRow(survey)
        );
        setData(normalizedData);
        setCounts((prev) => ({
          ...prev,
          totalInstallations: response.total ?? normalizedData.length,
        }));

      } else if (activeTab === "Inspections") {
        const response = await adminApi.getInspections();
        const customers = response.customers || response.data || [];

        const normalizedData = customers.map((c: any) => ({
          _id: c.id || c._id,
          accountNumber: c.accountNumber || "N/A",
          customerName: c.name || "Unknown",
          company: c.company || "N/A",
          salesPerson: c.user_id?.fullName || "Unassigned",
          contractor: c.contractorName || c.assignToContractor?.fullName || "Unassigned",
          projectManager: c.assignedTo?.fullName || "Unassigned",
          status: c.status || "-"
        }));
        setData(normalizedData);
      }
    } catch (err) {
      console.error("Failed to fetch workflow data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflowData();
  }, [activeTab]);

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

      const response = await adminApi.assignSurvey(surveyId, staff._id);

      toast.success(response.message || `${assignType} assigned successfully.`);
      setShowAssignModal(false);
      fetchWorkflowData();
    } catch (err: any) {
      console.error("Assignment error:", err);
      toast.error(err.message || `Failed to assign ${assignType}.`);
    } finally {
      setModalLoading(false);
    }
  };

  const summaryStats = [
    { label: "Total Surveys", value: counts.totalSurveys, icon: ClipboardCheck, color: "#3b6fd9", bg: "#e8f0fe" },
    { label: "Total Quotations", value: counts.totalQuotations, icon: FileText, color: "#7c3aed", bg: "#ede9fe" },
    { label: "Total Installations", value: counts.totalInstallations, icon: Hammer, color: "#475569", bg: "#f1f5f9" },
    { label: "Total Inspections", value: counts.totalInspections, icon: ClipboardList, color: "#0d9488", bg: "#ccfbf1" },
  ];

  const openSurveyModal = (item: {
    _id: string;
    leadName: string;
    surveyStatus: string;
  }) => {
    setSurveyModalCustomer(item);
    setShowSurveyModal(true);
  };

  const getHeaders = () => {
    if (activeTab === "Surveys") {
      return ["ID", "Customer ID", "Name", "DBA", "Sales Person", "Sales Manager", "Survey", "Actions"];
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
      return ["Customer ID", "Customer", "Company", "Sales Person", "Contractor", "Project Manager", "Installation Status", "Actions"];
    }

    if (activeTab === "Inspections") {
      return ["S.No", "Customer", "AC Number", "Company", "Sales Person", "Contractor", "Project Manager", "Inspection Status", "Actions"];
    }
    return [];
  };

  const tableColSpan = getHeaders().length;

  const getStatusStyle = (status: string) => {
    if (!status || status === "-") return { color: "#94a3b8", bg: "#f1f5f9" };
    switch (status.toLowerCase()) {
      case "completed": return { color: "#94a3b8", bg: "#f1f5f9" };
      case "verified": return { color: "#3b82f6", bg: "#eff6ff" };
      case "pending":
      case "not started": return { color: "#ef4444", bg: "#fef2f2" };
      case "in progress":
      case "in-process":
      case "in process": return { color: "#10b981", bg: "#ecfdf5" };
      case "reopened":
      case "reopen": return { color: "#fbbf24", bg: "#fffbeb" };
      case "pending_edit_approval": return { color: "#d97706", bg: "#fef3c7" };
      case "new": return { color: "#8b5cf6", bg: "#f5f3ff" };
      default: return { color: "#64748b", bg: "#f8fafc" };
    }
  };

  const filteredData = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return data.filter((item) => {
      if (activeTab === "Surveys") {
        return (
          item.leadId?.toLowerCase().includes(q) ||
          item.customerId?.toLowerCase().includes(q) ||
          item.leadName?.toLowerCase().includes(q) ||
          item.dba?.toLowerCase().includes(q) ||
          item.salesPerson?.toLowerCase().includes(q) ||
          item.salesManager?.toLowerCase().includes(q) ||
          item.surveyStatus?.toLowerCase().includes(q)
        );
      }
      if (activeTab === "Quotations") {
        return (
          item.leadId?.toString().toLowerCase().includes(q) ||
          item.customerName?.toLowerCase().includes(q) ||
          item.surveyName?.toLowerCase().includes(q) ||
          item.salesManager?.toLowerCase().includes(q) ||
          item.salesPerson?.toLowerCase().includes(q) ||
          item.statusLabel?.toLowerCase().includes(q)
        );
      }
      return (
        item.customerName?.toLowerCase().includes(q) ||
        item.surveyName?.toLowerCase().includes(q) ||
        item.leadId?.toLowerCase().includes(q) ||
        item.customerCode?.toLowerCase().includes(q) ||
        item.dba?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.mobileNumber?.toLowerCase().includes(q) ||
        item.company?.toLowerCase().includes(q) ||
        item.salesPerson?.toLowerCase().includes(q) ||
        item.contractor?.toLowerCase().includes(q) ||
        item.projectManager?.toLowerCase().includes(q) ||
        item.status?.toLowerCase().includes(q) ||
        item.accountNumber?.toLowerCase().includes(q)
      );
    });
  }, [data, searchTerm, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

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
                currentItems.map((item, index) => (
                  <tr key={item.rowId || item.surveyId || item._id || `${activeTab}-${index}`}>
                    {activeTab === "Surveys" ? (
                      <>
                        <td style={{ fontWeight: 600, color: "#94a3b8" }}>{item.leadId || "—"}</td>
                        <td style={{ fontWeight: 600, color: "#94a3b8" }}>{item.customerId || "—"}</td>
                        <td>
                          <span
                            className={workflowStyles.linkName}
                            onClick={() => router.push(`/workflow/view/${item._id}?from=Surveys`)}
                          >
                            {item.leadName || "—"}
                          </span>
                        </td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.dba || "—"}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.salesPerson}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.salesManager || "—"}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className={workflowStyles.surveyLinkBtn}
                            onClick={() =>
                              openSurveyModal({
                                _id: item._id,
                                leadName: item.leadName || "Customer",
                                surveyStatus: item.surveyStatus || "",
                              })
                            }
                          >
                            Survey
                          </button>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {canEditSurveys ? (
                            <button
                              type="button"
                              className={styles.assignBtn}
                              onClick={() => router.push(`/workflow/edit/${item._id}?from=Surveys`)}
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
                        <td style={{ fontWeight: 600, color: "#94a3b8" }}>{item.leadId}</td>
                        <td>
                          <span
                            className={workflowStyles.linkName}
                            onClick={() =>
                              router.push(
                                `/workflow/quotations/${item.customerId}?surveyId=${item.surveyId}&from=Quotations`
                              )
                            }
                          >
                            {item.customerName}
                          </span>
                        </td>
                        <td style={{ color: "#1e293b", fontWeight: 700 }}>{item.surveyName}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.salesManager}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.salesPerson}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <QuotationPdfLink
                            url={item.generatedPdfUrl}
                            label="PDF"
                            title={item.generatedPdfName}
                          />
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {item.signedPdfUrl ? (
                            <QuotationPdfLink
                              url={item.signedPdfUrl}
                              label="PDF"
                              title={item.signedPdfName}
                            />
                          ) : canCreateSurveys ? (
                            <SignedQuotationUpload
                              customerId={item.customerId}
                              surveyId={item.surveyId}
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
                                backgroundColor: getQuotationStatusStyle(item.quotationStatus).color,
                              }}
                            />
                            <span style={{ color: "#1e293b", fontWeight: 600 }}>
                              {item.statusLabel}
                            </span>
                          </div>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className={styles.assignBtn}
                            onClick={() =>
                              router.push(
                                `/workflow/edit/${item.customerId}?surveyId=${item.surveyId}&from=Quotations`
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
                          {item.leadId || item.customerCode || item.accountNumber || "—"}
                        </td>
                        <td>
                          <span
                            className={workflowStyles.linkName}
                            onClick={() => router.push(`/workflow/view/${item._id}?from=Installations`)}
                          >
                            {item.customerName}
                          </span>
                        </td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.company}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.salesPerson}</td>
                        <td>
                          {item.contractor && item.contractor !== "Unassigned" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1e293b", fontWeight: 600 }}>
                              <User size={14} color="#94a3b8" />
                              {item.contractor}
                            </div>
                          ) : canCreateInstallations ? (
                            <button
                              type="button"
                              className={styles.assignBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                openAssignModal("Contractor", item);
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
                          {item.projectManager && item.projectManager !== "Unassigned" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1e293b", fontWeight: 600 }}>
                              <User size={14} color="#94a3b8" />
                              {item.projectManager}
                            </div>
                          ) : canCreateInstallations ? (
                            <button
                              className={styles.assignBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                openAssignModal("Project Manager", item);
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
                            {item.status !== "-" && (
                              <span
                                className={styles.statusDotActive}
                                style={{ backgroundColor: getStatusStyle(item.status).color }}
                              ></span>
                            )}
                            <span style={{ color: "#1e293b", fontWeight: 600 }}>
                              {item.status}
                            </span>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ fontWeight: 600, color: "#94a3b8" }}>{indexOfFirstItem + index + 1}</td>
                        <td>
                          <span
                            className={workflowStyles.linkName}
                            onClick={() => router.push(`/workflow/view/${item._id}?from=Inspections`)}
                          >
                            {item.customerName}
                          </span>
                        </td>
                        <td style={{ color: "#1e293b", fontWeight: 600 }}>{item.accountNumber}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.company}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.salesPerson}</td>
                        <td>
                          {item.contractor && item.contractor !== "Unassigned" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1e293b", fontWeight: 600 }}>
                              <User size={14} color="#94a3b8" />
                              {item.contractor}
                            </div>
                          ) : canCreateInspections ? (
                            <button
                              className={styles.assignBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                openAssignModal("Contractor", item);
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
                          {item.projectManager && item.projectManager !== "Unassigned" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1e293b", fontWeight: 600 }}>
                              <User size={14} color="#94a3b8" />
                              {item.projectManager}
                            </div>
                          ) : canCreateInspections ? (
                            <button
                              className={styles.assignBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                openAssignModal("Project Manager", item);
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
                            {item.status !== "-" && (
                              <span
                                className={styles.statusDotActive}
                                style={{ backgroundColor: getStatusStyle(item.status).color }}
                              ></span>
                            )}
                            <span style={{ color: "#1e293b", fontWeight: 600 }}>
                              {item.status || "N/A"}
                            </span>
                          </div>
                        </td>
                      </>
                    )}

                    {activeTab !== "Surveys" && activeTab !== "Quotations" && (
                      <td>
                        {((activeTab === "Installations" && canEditInstallations) ||
                          (activeTab === "Inspections" && canEditInspections)) && (
                            <button
                              type="button"
                              className={styles.assignBtn}
                              onClick={() => router.push(`/workflow/edit/${item._id}?from=${activeTab}`)}
                            >
                              Edit
                            </button>
                          )}
                      </td>
                    )}
                  </tr>
                ))
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

      {showSurveyModal && surveyModalCustomer ? (
        <WorkflowSurveyListModal
          customerId={surveyModalCustomer._id}
          customerName={surveyModalCustomer.leadName}
          customerStatus={surveyModalCustomer.surveyStatus}
          canApproveEdits={canCreateSurveys}
          onClose={() => {
            setShowSurveyModal(false);
            setSurveyModalCustomer(null);
          }}
          onUpdated={fetchWorkflowData}
        />
      ) : null}

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className={modalStyles.modalOverlay} onClick={() => setShowAssignModal(false)}>
          <div className={modalStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={modalStyles.modalHeader}>
              <h3>Assign {assignType}</h3>
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
                        Assign
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
