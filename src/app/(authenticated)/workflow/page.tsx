"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../dashboard.module.css";
import {
  Plus,
  ClipboardCheck,
  Hammer,
  Search as SearchIcon,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  Calendar,
  User,
  MapPin,
  UserPlus,
  X
} from "lucide-react";
import { toast } from "react-toastify";
import { adminApi } from "@/lib/api";
import { canViewModule, hasPermission } from "@/lib/permissions";
import modalStyles from "./assign-modal.module.css";

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
  const validTabs = ["Surveys", "Installations", "Inspections"].filter(t => {
    if (t === "Surveys") return canViewSurveys;
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

  // Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignType, setAssignType] = useState<"Contractor" | "Project Manager">("Contractor");
  const [targetRecord, setTargetRecord] = useState<any>(null);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [projectManagers, setProjectManagers] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [counts, setCounts] = useState({
    Surveys: 0,
    installations: 0,
    inspections: 0
  });
  const [searchTerm, setSearchTerm] = useState("");

  const fetchWorkflowData = async () => {
    setLoading(true);
    setData([]);
    try {
      if (activeTab === "Surveys") {
        const pmResponse = await adminApi.getUserList(); // Fetch all users to be safe
        const pmList = pmResponse.users || pmResponse.data || pmResponse;
        setProjectManagers(Array.isArray(pmList) ? pmList : []);

        const response = await adminApi.getCustomers();
        const customers = response.customers || response.data || [];

        const totalSurveys = response.count || response.total || customers.length;
        setCounts(prev => ({ ...prev, Surveys: totalSurveys }));

        const normalizedData = customers.map((c: any) => ({
          _id: c.id,
          customerName: c.name,
          company: c.company,
          salesperson: c.salesPersonName || "Unassigned",
          projectManager: (typeof c.assignedTo === 'object' && c.assignedTo !== null) ? (c.assignedTo._id || c.assignedTo.id) : (c.assignedTo || c.projectManager || ""),
          pmName: (typeof c.assignedTo === 'object' && c.assignedTo !== null ? c.assignedTo.fullName : null) || (typeof c.projectManager === 'object' && c.projectManager !== null ? c.projectManager.fullName : null),
          surveyStatus: c.status || "Pending",
          verifyStatus: c.verifyStatus || "pending",
          date: c.convertedDate || c.createdDate
        })).filter((item: any) => {
          const status = item.surveyStatus?.toLowerCase();
          return status === "completed" || status === "reopened" || status === "reopen" || status === "pending_edit_approval";
        });
        setData(normalizedData);

      } else if (activeTab === "Installations") {
        const response = await adminApi.getInstallations();
        const installations = response.installations || response.data || (Array.isArray(response) ? response : []);

        const totalInst = response.total || response.count || installations.length;
        setCounts(prev => ({ ...prev, installations: totalInst }));

        const normalizedData = installations.map((inst: any) => ({
          _id: inst.id || inst._id,
          accountNumber: inst.accountNumber || "N/A",
          customerName: inst.name || inst.customerName || (inst.customer?.name) || "Unknown",
          company: inst.company || (inst.customer?.company) || "N/A",
          salesPerson: inst.salesPersonName || (inst.customer?.salesPerson) || "Unassigned",
          contractor: inst.contractorName || inst.contractor?.fullName || inst.contractor || "Unassigned",
          projectManager: inst.assignedTo?.fullName || inst.projectManager?.fullName || inst.projectManager || "Unassigned",
          status: inst.installationStatus || "-"
        }));
        setData(normalizedData);

      } else if (activeTab === "Inspections") {
        const response = await adminApi.getInspections();
        const customers = response.customers || response.data || [];

        const totalInsp = response.total || response.count || customers.length;
        setCounts(prev => ({ ...prev, inspections: totalInsp }));

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
    const fetchAllCounts = async () => {
      try {
        const [Surveys, inst, insp] = await Promise.all([
          adminApi.getCustomers(),
          adminApi.getInstallations(),
          adminApi.getInspections()
        ]);

        setCounts({
          Surveys: Surveys.count || Surveys.total || (Surveys.customers?.length || 0),
          installations: inst.count || inst.total || (inst.installations?.length || 0),
          inspections: insp.count || insp.total || (insp.customers?.length || 0)
        });
      } catch (err) {
        console.warn("Failed to fetch initial counts:", err);
        setCounts(prev => ({ ...prev, inspections: 0 }));
      }
    };
    fetchAllCounts();
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
      let response;

      if (assignType === "Project Manager") {
        response = await adminApi.assignProjectManager(targetRecord._id, staff._id);
      } else if (assignType === "Contractor") {
        response = await adminApi.assignContractor(targetRecord._id, staff._id);
      } else {
        toast.error("Invalid assignment type.");
        return;
      }

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

  const handleVerify = async (record: any) => {
    if (!window.confirm(`Are you sure you want to verify the survey for ${record.customerName}?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await adminApi.verifyCustomerSurvey(record._id);
      toast.success(response.message || "Survey verified successfully!");
      fetchWorkflowData();
    } catch (err: any) {
      console.error("Verification error:", err);
      toast.error(err.message || "Failed to verify survey.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminApproval = async (record: any, status: "Approved" | "Rejected") => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} the survey edits for ${record.customerName}?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await adminApi.adminApproval(record._id, status);
      toast.success(response.message || `Survey edits ${status.toLowerCase()} successfully!`);
      fetchWorkflowData();
    } catch (err: any) {
      console.error(`Approval error (${status}):`, err);
      toast.error(err.message || `Failed to ${status.toLowerCase()} survey edits.`);
    } finally {
      setLoading(false);
    }
  };

  const summaryStats = [
    { label: "Total Surveys", value: counts.Surveys.toLocaleString(), icon: ClipboardCheck, color: "#0076ce", bg: "#e0e7ff" },
    { label: "Total Installations", value: counts.installations.toLocaleString(), icon: Hammer, color: "#475569", bg: "#f1f5f9" },
    { label: "Total Inspections", value: counts.inspections.toLocaleString(), icon: SearchIcon, color: "#854d0e", bg: "#fef3c7" },
  ];

  const getHeaders = () => {
    if (activeTab === "Surveys") {
      return ["S.No", "name", "COMPANY", "SALES PERSON", "PROJECT MANAGER", "SURVEY STATUS", "VERIFY / APPROVAL", "ACTIONS"];
    }

    if (activeTab === "Installations") {
      return ["S.No", "CUSTOMER", "AC NUMBER", "COMPANY", "SALES PERSON", "CONTRACTOR", "PROJECT MANAGER", "INSTALLATION STATUS", "ACTIONS"];
    }

    if (activeTab === "Inspections") {
      return ["S.No", "CUSTOMER", "AC NUMBER", "COMPANY", "SALES PERSON", "CONTRACTOR", "PROJECT MANAGER", "INSPECTION STATUS", "ACTIONS"];
    }
    return [];
  };

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

  const filteredData = data.filter(item =>
    item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.salesPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.projectManager?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.usersPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>WORKFLOW</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Workflow Management</h1>
      </div>

      <div className={styles.userStatsGrid}>
        {summaryStats.map((stat) => (
          <div key={stat.label} className={styles.userStatCard}>
            <div
              className={styles.userStatIcon}
              style={{ backgroundColor: stat.bg, color: stat.color }}
            >
              <stat.icon size={22} />
            </div>
            <div className={styles.userStatValue}>{stat.value}</div>
            <div className={styles.userStatLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.tabs}>
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
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div className={styles.searchUsers}>
              <SearchIcon size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                className={styles.searchInputSmall}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: 500 }}>
              Showing {filteredData.length} {activeTab}
            </div>
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
                  <td colSpan={10} style={{ textAlign: "center", padding: "4rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", color: "#94a3b8" }}>
                      <Loader2 size={32} className={styles.spinner} />
                      <span style={{ fontWeight: 600 }}>Fetching workflow data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "4rem", color: "#94a3b8", fontWeight: 600 }}>
                    No {activeTab.toLowerCase()} found.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={item._id || `${activeTab}-${index}`}>
                    {activeTab === "Surveys" ? (
                      <>
                        <td style={{ color: "#64748b", fontWeight: 500 }}>{index + 1}</td>
                        <td>
                          <span
                            style={{ color: "#0076ce", fontWeight: 700, cursor: "pointer", textDecoration: "underline", textDecorationColor: "#0076ce" }}
                            onClick={() => router.push(`/workflow/view/${item._id}?from=Surveys`)}
                          >
                            {item.customerName}
                          </span>
                        </td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.company}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.salesperson}</td>
                        <td>
                          {item.projectManager ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1e293b", fontWeight: 600 }}>
                              <User size={14} color="#94a3b8" />
                              {item.pmName || projectManagers.find(pm => {
                                const pmId = (pm._id || pm.id || "").toString().toLowerCase();
                                const targetId = (item.projectManager || "").toString().toLowerCase();
                                return pmId === targetId && targetId !== "";
                              })?.fullName || item.projectManager || "Unknown PM"}
                            </div>
                          ) : ((item.surveyStatus?.toLowerCase() === "completed" || item.surveyStatus?.toLowerCase() === "reopened" || item.surveyStatus?.toLowerCase() === "reopen" || item.surveyStatus?.toLowerCase() === "pending_edit_approval") && canCreateSurveys) ? (
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
                            <span style={{ color: "#94a3b8", fontSize: "0.85rem", fontStyle: "italic" }}>
                              {(item.surveyStatus?.toLowerCase() === "completed" || item.surveyStatus?.toLowerCase() === "reopened" || item.surveyStatus?.toLowerCase() === "reopen" || item.surveyStatus?.toLowerCase() === "pending_edit_approval") ? "No Assign Permission" : "Awaiting Completion"}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className={styles.statusCell}>
                            {item.surveyStatus !== "-" && (
                              <span className={styles.statusDotActive} style={{ backgroundColor: getStatusStyle(item.surveyStatus).color }}></span>
                            )}
                            <span style={{ color: "rgb(30, 41, 59)", fontWeight: 600 }}>
                              {item.surveyStatus === "pending_edit_approval"
                                ? "Pending Approval"
                                : item.surveyStatus === "reopen" || item.surveyStatus === "reopened"
                                  ? "Reopened"
                                  : item.surveyStatus || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td>
                          {item.surveyStatus?.toLowerCase() === "pending_edit_approval" ? (
                            <div style={{ display: "flex", gap: "0.5rem" }} onClick={(e) => e.stopPropagation()}>
                              <button
                                className={styles.assignBtn}
                                onClick={() => handleAdminApproval(item, "Approved")}
                                style={{ background: "#10b981", color: "white", border: "none" }}
                              >
                                Approve
                              </button>
                              <button
                                className={styles.assignBtn}
                                onClick={() => handleAdminApproval(item, "Rejected")}
                                style={{ background: "#ef4444", color: "white", border: "none" }}
                              >
                                Reject
                              </button>
                            </div>
                          ) : item.verifyStatus === "verified" ? (
                            <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase" }}>Verified</span>
                          ) : (
                            <span style={{ color: "#64748b", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase" }}>Pending</span>
                          )}
                        </td>
                      </>
                    ) : activeTab === "Installations" ? (
                      <>
                        <td style={{ color: "#64748b", fontWeight: 500 }}>{index + 1}</td>
                        <td
                          style={{ color: "#0076ce", fontWeight: 700, cursor: "pointer", textDecoration: "underline", textDecorationColor: "#0076ce" }}
                          onClick={() => router.push(`/workflow/view/${item._id}?from=Installations`)}
                        >
                          {item.customerName}
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
                          ) : canCreateInstallations ? (
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
                            <span style={{ color: "rgb(30, 41, 59)", fontWeight: 600 }}>
                              {item.status}
                            </span>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ color: "#64748b", fontWeight: 500 }}>{index + 1}</td>
                        <td
                          style={{ color: "#0076ce", fontWeight: 700, cursor: "pointer", textDecoration: "underline", textDecorationColor: "#0076ce" }}
                          onClick={() => router.push(`/workflow/view/${item._id}?from=Inspections`)}
                        >
                          {item.customerName}
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
                            <span style={{ color: "rgb(30, 41, 59)", fontWeight: 600 }}>
                              {item.status || "N/A"}
                            </span>
                          </div>
                        </td>
                      </>
                    )}

                    <td>
                      {((activeTab === "Surveys" && canEditSurveys) ||
                        (activeTab === "Installations" && canEditInstallations) ||
                        (activeTab === "Inspections" && canEditInspections)) && (
                          <button
                            className={styles.assignBtn}
                            onClick={() => router.push(`/workflow/edit/${item._id}?from=${activeTab}`)}
                          >
                            Edit
                          </button>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.tableFooter}>
          <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
            Showing {filteredData.length} {activeTab}
          </div>
          <div className={styles.pagination}>
            <div className={styles.pageBtn}><ChevronLeft size={18} /></div>
            <div className={`${styles.pageBtn} ${styles.pageActive}`}>1</div>
            <div className={styles.pageBtn}><ChevronRight size={18} /></div>
          </div>
        </div>
      </div>

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
