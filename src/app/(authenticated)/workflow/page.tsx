"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../dashboard.module.css";
import { 
  Plus, 
  ClipboardCheck, 
  Hammer, 
  Search as SearchIcon, 
  Filter, 
  MoreVertical, 
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
  const [activeTab, setActiveTab] = useState("surveys");
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>(MOCK_SURVEYS);
  
  // Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignType, setAssignType] = useState<"Contractor" | "Project Manager">("Contractor");
  const [targetRecord, setTargetRecord] = useState<any>(null);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [projectManagers, setProjectManagers] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [counts, setCounts] = useState({
    surveys: 0,
    installations: 0,
    inspections: 0
  });

  const fetchWorkflowData = async () => {
    setLoading(true);
    setData([]);
    try {
      // 1. Fetch Surveys / Project Managers
      if (activeTab === "surveys") {
        const pmResponse = await adminApi.getUserList("project_manager");
        const pmList = pmResponse.users || pmResponse.data || pmResponse;
        setProjectManagers(Array.isArray(pmList) ? pmList : []);

        const response = await adminApi.getCustomers();
        const customers = response.customers || response.data || [];
        
        // Update Survey Count dynamically from API
        const totalSurveys = response.count || response.total || customers.length;
        setCounts(prev => ({ ...prev, surveys: totalSurveys }));

        const normalizedData = customers.map((c: any) => ({
          _id: c.id,
          customerName: c.name,
          company: c.company,
          salesperson: c.salesPerson || "Unassigned",
          projectManager: c.assignedTo || "",
          surveyStatus: c.status || "Pending",
          date: c.convertedDate || c.createdDate
        })).filter((item: any) => item.surveyStatus?.toLowerCase() === "completed");
        setData(normalizedData);

      // 2. Fetch Installations
      } else if (activeTab === "Installations") {
        const response = await adminApi.getInstallations();
        const installations = response.installations || response.data || (Array.isArray(response) ? response : []);
        
        // Update Installation Count dynamically from API
        const totalInst = response.total || response.count || installations.length;
        setCounts(prev => ({ ...prev, installations: totalInst }));

        const normalizedData = installations.map((inst: any) => ({
          _id: inst.id || inst._id,
          accountNumber: inst.accountNumber || "N/A",
          customerName: inst.name || inst.customerName || (inst.customer?.name) || "Unknown",
          company: inst.company || (inst.customer?.company) || "N/A",
          salesPerson: inst.salesPerson || (inst.customer?.salesPerson) || "Unassigned",
          contractor: inst.contractorName || inst.contractor?.fullName || inst.contractor || "Unassigned",
          projectManager: inst.assignedTo?.fullName || inst.projectManager?.fullName || inst.projectManager || "Unassigned",
          status: inst.status || "Pending"
        }));
        setData(normalizedData);

      // 3. Fetch Inspections (Static/Mock for now)
      } else if (activeTab === "Inspections") {
        setCounts(prev => ({ ...prev, inspections: MOCK_INSPECTIONS.length }));
        setData(MOCK_INSPECTIONS);
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

  // Initial fetch for all counts to keep stats dynamic
  useEffect(() => {
    const fetchAllCounts = async () => {
      try {
        const [surveys, inst] = await Promise.all([
          adminApi.getCustomers(),
          adminApi.getInstallations()
        ]);
        
        setCounts({
          surveys: surveys.count || surveys.total || (surveys.customers?.length || 0),
          installations: inst.count || inst.total || (inst.installations?.length || 0),
          inspections: MOCK_INSPECTIONS.length
        });
      } catch (err) {
        console.warn("Failed to fetch initial counts:", err);
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
      // Role name must match exactly what's allowed in the backend
      const roleToFetch = type === "Project Manager" ? "project_manager" : "contractor";
      const response = await adminApi.getUserList(roleToFetch);
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
    if (assignType !== "Project Manager") {
      toast.info("Only Project Manager assignment is currently supported with the live API.");
      return;
    }

    try {
      setModalLoading(true);
      const response = await adminApi.assignProjectManager(targetRecord._id, staff._id);
      toast.success(response.message || "Assigned successfully.");
      setShowAssignModal(false);
      
      // Refresh the list to show the new assignment
      fetchWorkflowData();
    } catch (err: any) {
      console.error("Assignment error:", err);
      toast.error(err.message || "Failed to assign Project Manager.");
    } finally {
      setModalLoading(false);
    }
  };

  const summaryStats = [
    { label: "Total Surveys", value: counts.surveys.toLocaleString(), icon: ClipboardCheck, color: "#0076ce", bg: "#e0e7ff" },
    { label: "Total Installations", value: counts.installations.toLocaleString(), icon: Hammer, color: "#475569", bg: "#f1f5f9" },
    { label: "Total Inspections", value: counts.inspections.toLocaleString(), icon: SearchIcon, color: "#854d0e", bg: "#fef3c7" },
  ];

  const getHeaders = () => {
    if (activeTab === "surveys") {
      return ["sr number", "name", "COMPANY", "SALES PERSON", "PROJECT MANAGER", "SURVEY STATUS", "ACTIONS"];
    }
    
    if (activeTab === "Installations") {
      return ["SR NUMBER", "AC NUMBER", "CUSTOMER", "COMPANY", "SALES PERSON", "CONTRACTOR", "PROJECT MANAGER", "INSTALLATION STATUS", "ACTIONS"];
    }
    
    if (activeTab === "Inspections") {
      return ["SR NUMBER", "AC NUMBER", "CUSTOMER", "COMPANY", "SALES PERSON", "CONTRACTOR", "PROJECT MANAGER", "INSPECTION STATUS", "ACTIONS"];
    }
    return [];
  };

  const getStatusStyle = (status: string) => {
    if (!status) return { color: "#64748b", bg: "#f8fafc" };
    switch (status.toLowerCase()) {
      case "completed": return { color: "#94a3b8", bg: "#f1f5f9" };
      case "verified": return { color: "#3b82f6", bg: "#eff6ff" };
      case "pending": 
      case "not started": return { color: "#ef4444", bg: "#fef2f2" };
      case "in progress": 
      case "in-process":
      case "in process": return { color: "#10b981", bg: "#ecfdf5" };
      case "reopened": return { color: "#fbbf24", bg: "#fffbeb" };
      case "new": return { color: "#8b5cf6", bg: "#f5f3ff" }; // Purple for new
      default: return { color: "#64748b", bg: "#f8fafc" };
    }
  };

  return (
    <div className={styles.usersPage} onClick={() => setOpenActionId(null)}>
      <div className={styles.breadcrumb}>
        ADMIN <span>/</span> WORKFLOW
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Workflow Management</h1>
        <button className={styles.addBtn} onClick={() => router.push(`/workflow/add-${activeTab.toLowerCase()}`)}>
          <Plus size={20} /> New {activeTab}
        </button>
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
            {["surveys", "Installations", "Inspections"].map((tab) => (
              <div 
                key={tab} 
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div className={styles.filterBtn}>
              <Filter size={18} /> Filters
            </div>
            <div className={styles.searchUsers}>
              <SearchIcon size={16} color="#94a3b8" />
              <input type="text" placeholder="Search Users" className={styles.searchInputSmall} />
            </div>
            <div style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: 500 }}>
              Showing {data.length} {activeTab}
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
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "4rem", color: "#94a3b8", fontWeight: 600 }}>
                    No {activeTab.toLowerCase()}s found.
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={item._id || `${activeTab}-${index}`}>
                    {activeTab === "surveys" ? (
                      <>
                        <td style={{ color: "#64748b", fontWeight: 500 }}>{index + 1}</td>
                        <td>
                          <span style={{ color: "#1e293b", fontWeight: 600 }}>{item.customerName}</span>
                        </td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.company}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.salesperson}</td>
                        <td>
                          {item.projectManager ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1e293b", fontWeight: 600 }}>
                              <User size={14} color="#94a3b8" />
                              {projectManagers.find(pm => pm._id === item.projectManager)?.fullName || "Unknown PM"}
                            </div>
                          ) : item.surveyStatus?.toLowerCase() === "completed" ? (
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
                            <span style={{ color: "#94a3b8", fontSize: "0.85rem", fontStyle: "italic" }}>Awaiting Completion</span>
                          )}
                        </td>
                        <td>
                          <div className={styles.statusCell}>
                            <span className={styles.statusDotActive} style={{ backgroundColor: getStatusStyle(item.surveyStatus).color }}></span>
                            <span style={{ color: "rgb(30, 41, 59)", fontWeight: 600 }}>{item.surveyStatus || "N/A"}</span>
                          </div>
                        </td>
                      </>
                    ) : activeTab === "Installations" ? (
                      <>
                        <td style={{ color: "#64748b", fontWeight: 500 }}>{index + 1}</td>
                        <td style={{ color: "#1e293b", fontWeight: 600 }}>{item.accountNumber}</td>
                        <td style={{ color: "#1e293b", fontWeight: 600 }}>{item.customerName}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.company}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.salesPerson}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.contractor}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.projectManager}</td>
                        <td>
                          <div className={styles.statusCell}>
                            <span 
                              className={styles.statusDotActive} 
                              style={{ backgroundColor: getStatusStyle(item.status).color }}
                            ></span>
                            <span style={{ color: "rgb(30, 41, 59)", fontWeight: 600 }}>
                              {item.status}
                            </span>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ color: "#64748b", fontWeight: 500 }}>{index + 1}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.displayId || item._id}</td>
                        <td style={{ color: "#1e293b", fontWeight: 600 }}>{item.customerName}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.company}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.salesPerson}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.contractor}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.projectManager}</td>
                        <td>
                          <div className={styles.statusCell}>
                            <span 
                              className={styles.statusDotActive} 
                              style={{ backgroundColor: getStatusStyle(item.status).color }}
                            ></span>
                            <span style={{ color: "rgb(30, 41, 59)", fontWeight: 600 }}>
                              {item.status || "N/A"}
                            </span>
                          </div>
                        </td>
                      </>
                    )}

                    <td style={{ overflow: "visible", position: "relative" }}>
                      <div onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionId(openActionId === item._id ? null : item._id);
                      }}>
                        <MoreVertical size={18} color="#94a3b8" style={{ cursor: "pointer" }} />
                      </div>
                      
                      {openActionId === item._id && (
                        <div className={styles.actionDropdown}>
                          <div className={styles.dropdownItem} onClick={() => router.push(`/workflow/view/${item._id}`)}>View</div>
                          <div className={styles.dropdownDivider}></div>
                          <div className={styles.dropdownItem} onClick={() => router.push(`/workflow/edit/${item._id}`)}>Edit</div>
                        </div>
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
            Showing {data.length} {activeTab}
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
