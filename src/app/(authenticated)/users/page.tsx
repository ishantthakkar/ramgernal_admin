"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "../dashboard.module.css";
import { 
  Plus, 
  Users, 
  Handshake, 
  Workflow, 
  Filter, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Loader2
} from "lucide-react";
import { adminApi } from "@/lib/api";

export default function UsersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All Users");
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_sales_persons: 0,
    total_contractors: 0,
    total_project_managers: 0
  });

  const fetchUsers = async (role?: string) => {
    setLoading(true);
    try {
      let apiRole: string | undefined;
      if (role === "Sales Person") apiRole = "sales_person";
      else if (role === "Contractors") apiRole = "contractor";
      else if (role === "Project Manager") apiRole = "project_manager";
      
      const response = await adminApi.getUserList(apiRole);
      
      // Update Users List
      const results = response.users || response.data || (Array.isArray(response) ? response : []);
      setUsers(results);

      // Update Stats from "counts" object if available
      if (response.counts) {
        setStats({
          total_sales_persons: response.counts.total_sales_persons || 0,
          total_contractors: response.counts.total_contractors || 0,
          total_project_managers: response.counts.total_project_managers || 0
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(activeTab);
  }, [activeTab]);

  const summaryStats = [
    { label: "Total Sales Persons", value: stats.total_sales_persons.toLocaleString(), icon: Users, color: "#0076ce", bg: "#e0e7ff" },
    { label: "Total Contractors", value: stats.total_contractors.toLocaleString(), icon: Handshake, color: "#475569", bg: "#f1f5f9" },
    { label: "Total Project Managers", value: stats.total_project_managers.toLocaleString(), icon: Workflow, color: "#854d0e", bg: "#fef3c7" },
  ];

  const getHeaders = () => {
    const commonPrefix = ["User ID", "User Details"];
    const commonSuffix = ["Status", "Actions"];
    
    if (activeTab === "All Users") {
      return [...commonPrefix, "Role", "Mobile Number", "Status", "Email", "Actions"];
    }
    if (activeTab === "Sales Person") {
      return [...commonPrefix, "Mobile", "Active Leads", "Customers", "Closed Leads", ...commonSuffix];
    }
    if (activeTab === "Contractors") {
      return [...commonPrefix, "Mobile", "Assigned Projects", "Comp. Installations", "Pend. Installations", ...commonSuffix];
    }
    if (activeTab === "Project Manager") {
      return [...commonPrefix, "Mobile", "Pend. Inspections", "Comp. Inspections", ...commonSuffix];
    }
    return commonPrefix;
  };

  return (
    <div className={styles.usersPage} onClick={() => setOpenActionId(null)}>
      <div className={styles.breadcrumb}>
        ADMIN <span>/</span> USERS
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Users</h1>
        <button className={styles.addBtn} onClick={() => router.push("/users/add")}>
          <Plus size={20} /> Add User
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
            {["All Users", "Sales Person", "Contractors", "Project Manager"].map((tab) => (
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
              <Search size={16} color="#94a3b8" />
              <input type="text" placeholder="Search Users" className={styles.searchInputSmall} />
            </div>
            <div style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: 500 }}>
              Showing {users.length} users
            </div>
          </div>
        </div>

        <div className={styles.userTableContainer}>
          <table className={styles.userTable}>
            <thead>
              <tr>
                {getHeaders().map(header => <th key={header}>{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "4rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", color: "#94a3b8" }}>
                      <Loader2 size={32} className={styles.spinner} />
                      <span style={{ fontWeight: 600 }}>Synchronizing user database...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "4rem", color: "#94a3b8", fontWeight: 600 }}>
                    No users found in this category.
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user._id || index}>
                    <td style={{ fontWeight: 600, color: "#94a3b8" }}>#{user._id?.slice(-5).toUpperCase() || "N/A"}</td>
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
                            {user.fullName?.charAt(0) || "U"}
                          </div>
                        </div>
                        <span className={styles.userNameTable} style={{ color: "#1e293b", fontWeight: 600 }}>{user.fullName}</span>
                      </div>
                    </td>

                    {activeTab === "All Users" && (
                      <>
                        <td>
                          <span className={`${styles.roleBadge} ${styles.badgeBlue}`}>
                            {user.userRole?.replace("_", " ").toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500, color: "#1e293b" }}>{user.mobileNumber}</td>
                        <td>
                          <div className={styles.statusCell}>
                            <span className={user.status === "active" ? styles.statusDotActive : styles.statusDotInactive}></span>
                            {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                          </div>
                        </td>
                        <td style={{ color: "#64748b" }}>{user.email}</td>
                      </>
                    )}

                    {activeTab === "Sales Person" && (
                      <>
                        <td style={{ fontWeight: 500, color: "#1e293b" }}>{user.mobileNumber}</td>
                        <td style={{ fontWeight: 600, color: "#1e293b" }}>{user.activeLeads || 0}</td>
                        <td style={{ fontWeight: 600, color: "#1e293b" }}>{user.customers || 0}</td>
                        <td style={{ fontWeight: 600, color: "#1e293b" }}>{user.closedLeads || 0}</td>
                        <td>
                          <div className={styles.statusCell}>
                            <span className={user.status === "active" ? styles.statusDotActive : styles.statusDotInactive}></span>
                            {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                          </div>
                        </td>
                      </>
                    )}

                    {activeTab === "Contractors" && (
                      <>
                        <td style={{ fontWeight: 500, color: "#1e293b" }}>{user.mobileNumber}</td>
                        <td style={{ fontWeight: 600, color: "#1e293b" }}>{user.assignedProjects || 0}</td>
                        <td style={{ fontWeight: 600, color: "#1e293b" }}>{user.completedInstallations || 0}</td>
                        <td style={{ fontWeight: 600, color: "#1e293b" }}>{user.pendingInstallations || 0}</td>
                        <td>
                          <div className={styles.statusCell}>
                            <span className={user.status === "active" ? styles.statusDotActive : styles.statusDotInactive}></span>
                            {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                          </div>
                        </td>
                      </>
                    )}

                    {activeTab === "Project Manager" && (
                      <>
                        <td style={{ fontWeight: 500, color: "#1e293b" }}>{user.mobileNumber}</td>
                        <td style={{ fontWeight: 600, color: "#1e293b" }}>{user.pendingInspections || 0}</td>
                        <td style={{ fontWeight: 600, color: "#1e293b" }}>{user.completedInspections || 0}</td>
                        <td>
                          <div className={styles.statusCell}>
                            <span className={user.status === "active" ? styles.statusDotActive : styles.statusDotInactive}></span>
                            {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                          </div>
                        </td>
                      </>
                    )}

                    <td style={{ overflow: "visible", position: "relative" }}>
                      <div onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionId(openActionId === user._id ? null : user._id);
                      }}>
                        <MoreVertical size={18} color="#94a3b8" cursor="pointer" />
                      </div>
                      
                      {openActionId === user._id && (
                        <div className={styles.actionDropdown} style={{ top: "80%", right: "1.5rem", transform: "none", borderRadius: "20px", boxShadow: "0 15px 40px rgba(0,0,0,0.12)" }}>
                          <div className={styles.dropdownItem} style={{ padding: "1.25rem 2rem" }} onClick={() => router.push(`/users/edit/${user._id}`)}>Edit</div>
                          <div className={styles.dropdownDivider}></div>
                          <div className={styles.dropdownItem} style={{ padding: "1.25rem 2rem" }}>View</div>
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
            Showing {users.length} results
          </div>
          <div className={styles.pagination}>
            <div className={styles.pageBtn}><ChevronLeft size={18} /></div>
            <div className={`${styles.pageBtn} ${styles.pageActive}`}>1</div>
            <div className={styles.pageBtn}><ChevronRight size={18} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
