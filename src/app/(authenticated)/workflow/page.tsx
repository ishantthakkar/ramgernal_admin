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
    contractor: "Mike Miller",
    projectManager: "Sarah Connor",
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
];

const MOCK_INSTALLATIONS = [
  { _id: "I001", customerName: "Robert Paulson", propertyAddress: "789 Oak Rd, Capital City", contractor: "Mike Miller", status: "in-progress", date: "2024-04-21" },
];

const MOCK_INSPECTIONS = [
  { _id: "N001", customerName: "Sarah Connor", propertyAddress: "101 Pine Ln, Tech City", inspector: "Sarah Connor", status: "pending", date: "2024-04-22" },
];

export default function WorkflowPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Survey");
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>(MOCK_SURVEYS);
  
  // Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignType, setAssignType] = useState<"Contractor" | "Project Manager">("Contractor");
  const [targetRecord, setTargetRecord] = useState<any>(null);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    // Simulate loading
    setLoading(true);
    setData([]); // Clear data to avoid rendering old data with new tab logic
    setTimeout(() => {
      if (activeTab === "Survey") setData(MOCK_SURVEYS);
      else if (activeTab === "Installation") setData(MOCK_INSTALLATIONS);
      else if (activeTab === "Inspection") setData(MOCK_INSPECTIONS);
      setLoading(false);
    }, 500);
  }, [activeTab]);

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

  const handleAssignStaff = (staff: any) => {
    // This is where you would call the API to update the record
    toast.success(`${staff.fullName} successfully assigned as ${assignType} for ${targetRecord.customerName}.`);
    setShowAssignModal(false);
    
    // Optimistic update for UI if needed
    setData(prev => prev.map(item => 
      item._id === targetRecord._id 
        ? { ...item, [assignType === "Contractor" ? 'contractor' : 'projectManager']: staff.fullName }
        : item
    ));
  };

  const summaryStats = [
    { label: "Total Surveys", value: "124", icon: ClipboardCheck, color: "#0076ce", bg: "#e0e7ff" },
    { label: "Total Installations", value: "45", icon: Hammer, color: "#475569", bg: "#f1f5f9" },
    { label: "Total Inspections", value: "32", icon: SearchIcon, color: "#854d0e", bg: "#fef3c7" },
  ];

  const getHeaders = () => {
    if (activeTab === "Survey") {
      return ["ID", "Customer", "Company", "Salesperson", "Contractor", "Project Manager", 
        <div key="assign-contractor">Assign <br/> Contractor</div>, 
        <div key="assign-pm">Assign <br/> PM</div>, 
        "Survey Status", "Installation Status", "Inspection Status", "Actions"];
    }
    
    const commonPrefix = ["ID", "Customer Details", "Property Address"];
    const commonSuffix = ["Date", "Status", "Actions"];
    
    if (activeTab === "Installation") {
      return [...commonPrefix, "Contractor", ...commonSuffix];
    }
    if (activeTab === "Inspection") {
      return [...commonPrefix, "Inspector", ...commonSuffix];
    }
    return commonPrefix;
  };

  const getStatusStyle = (status: string) => {
    if (!status) return { color: "#64748b", bg: "#f8fafc" };
    switch (status.toLowerCase()) {
      case "completed": 
      case "verified": return { color: "#10b981", bg: "#ecfdf5" };
      case "pending": 
      case "not started": return { color: "#94a3b8", bg: "#f1f5f9" };
      case "in progress": 
      case "in-progress": return { color: "#3b82f6", bg: "#eff6ff" };
      case "reopened": return { color: "#ef4444", bg: "#fef2f2" };
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
            {["Survey", "Installation", "Inspection"].map((tab) => (
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
              <input type="text" placeholder={`Search ${activeTab}s`} className={styles.searchInputSmall} />
            </div>
            <div style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: 500 }}>
              Showing {data.length} {activeTab.toLowerCase()}s
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
                  <td colSpan={12} style={{ textAlign: "center", padding: "4rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", color: "#94a3b8" }}>
                      <Loader2 size={32} className={styles.spinner} />
                      <span style={{ fontWeight: 600 }}>Fetching workflow data...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: "center", padding: "4rem", color: "#94a3b8", fontWeight: 600 }}>
                    No {activeTab.toLowerCase()}s found.
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={item._id || index}>
                    <td style={{ fontWeight: 600, color: "#94a3b8" }}>{index + 1}</td>
                    
                    {activeTab === "Survey" ? (
                      <>
                        <td>
                          <div className={styles.userDetails}>
                            <div className={styles.avatar} style={{ width: 32, height: 32, border: 'none', boxShadow: 'none' }}>
                              <div style={{ 
                                background: "#eff6ff", 
                                color: "#1d4ed8", 
                                width: "100%", 
                                height: "100%", 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                fontWeight: 700, 
                                fontSize: "0.75rem",
                                borderRadius: "50%"
                              }}>
                                {item.customerName?.charAt(0) || "C"}
                              </div>
                            </div>
                            <span className={styles.userNameTable} style={{ color: "#1e293b", fontWeight: 600 }}>{item.customerName}</span>
                          </div>
                        </td>
                        <td style={{ color: "#64748b", fontWeight: 500 }}>{item.company}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.salesperson}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.contractor}</td>
                        <td style={{ color: "#1e293b", fontWeight: 500 }}>{item.projectManager}</td>
                        <td>
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
                        </td>
                        <td>
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
                        </td>
                        <td>
                          <div className={styles.statusCell}>
                            <span className={styles.statusDotActive} style={{ backgroundColor: getStatusStyle(item.surveyStatus).color }}></span>
                            <span style={{ color: getStatusStyle(item.surveyStatus).color, fontWeight: 600 }}>{item.surveyStatus || "N/A"}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.statusCell}>
                            <span className={styles.statusDotActive} style={{ backgroundColor: getStatusStyle(item.installationStatus).color }}></span>
                            <span style={{ color: getStatusStyle(item.installationStatus).color, fontWeight: 600 }}>{item.installationStatus || "N/A"}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.statusCell}>
                            <span className={styles.statusDotActive} style={{ backgroundColor: getStatusStyle(item.inspectionStatus).color }}></span>
                            <span style={{ color: getStatusStyle(item.inspectionStatus).color, fontWeight: 600 }}>{item.inspectionStatus || "N/A"}</span>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <div className={styles.userDetails}>
                            <div className={styles.avatar} style={{ width: 36, height: 36, border: 'none', boxShadow: 'none' }}>
                              <div style={{ 
                                background: "#eff6ff", 
                                color: "#1d4ed8", 
                                width: "100%", 
                                height: "100%", 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                fontWeight: 700, 
                                fontSize: "0.8rem",
                                borderRadius: "50%"
                              }}>
                                {item.customerName?.charAt(0) || "C"}
                              </div>
                            </div>
                            <span className={styles.userNameTable} style={{ color: "#1e293b", fontWeight: 600 }}>{item.customerName}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b" }}>
                            <MapPin size={14} />
                            <span>{item.propertyAddress}</span>
                          </div>
                        </td>
                        
                        {activeTab === "Installation" && (
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1e293b", fontWeight: 500 }}>
                              <User size={14} color="#94a3b8" />
                              {item.contractor}
                            </div>
                          </td>
                        )}
                        
                        {activeTab === "Inspection" && (
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1e293b", fontWeight: 500 }}>
                              <User size={14} color="#94a3b8" />
                              {item.inspector}
                            </div>
                          </td>
                        )}

                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b" }}>
                            <Calendar size={14} />
                            {item.date}
                          </div>
                        </td>

                        <td>
                          <div className={styles.statusCell}>
                            <span 
                              className={styles.statusDotActive} 
                              style={{ backgroundColor: getStatusStyle(item.status).color }}
                            ></span>
                            <span style={{ color: getStatusStyle(item.status).color, fontWeight: 600 }}>
                              {(item.status?.charAt(0).toUpperCase() + item.status?.slice(1)) || "N/A"}
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
            Showing {data.length} results
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
