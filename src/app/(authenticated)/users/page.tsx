"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../dashboard.module.css";
import userStyles from "./users.module.css";
import {
  Plus,
  Users,
  Handshake,
  Workflow,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  ShieldCheck,
  Briefcase,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { USER_TABS, type UserTab, parseUserTabFromParam, withUserTab } from "./user-tabs";
import { WorkingHoursCell } from "./components/WorkingHoursCell";

function normalizeRole(role?: string): string {
  return (role || "").toLowerCase().trim();
}

function userMatchesTab(user: { userRole?: string }, tab: UserTab): boolean {
  const role = normalizeRole(user.userRole);
  switch (tab) {
    case "All Users":
      return true;
    case "Sales Person":
      return role === "sales person";
    case "Contractors":
      return role === "contractor";
    case "Project Manager":
      return role === "project manager";
    case "Sales Manager":
      return role === "sales manager";
    case "Admin":
      return role === "admin";
    default:
      return true;
  }
}

function countByRole(users: { userRole?: string }[], role: string): number {
  return users.filter((u) => normalizeRole(u.userRole) === role).length;
}

function getSupervisorName(user: { reportsTo?: { fullName?: string } | null }): string {
  return user.reportsTo?.fullName?.trim() || "—";
}

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const canCreateUsers = hasPermission("User", "create");
  const canEditUsers = hasPermission("User", "edit");

  const [activeTab, setActiveTab] = useState<UserTab>(() =>
    parseUserTabFromParam(searchParams.get("tab"))
  );

  useEffect(() => {
    setActiveTab(parseUserTabFromParam(searchParams.get("tab")));
  }, [searchParams]);

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [stats, setStats] = useState({
    total_sales_persons: 0,
    total_contractors: 0,
    total_project_managers: 0,
    total_sales_managers: 0,
    total_admins: 0,
  });

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getUserList();
      const results = response.users || response.data || (Array.isArray(response) ? response : []);
      setAllUsers(results);

      setStats({
        total_sales_persons:
          response.counts?.total_sales_persons ?? countByRole(results, "sales person"),
        total_contractors:
          response.counts?.total_contractors ?? countByRole(results, "contractor"),
        total_project_managers:
          response.counts?.total_project_managers ?? countByRole(results, "project manager"),
        total_sales_managers:
          response.counts?.total_sales_managers ?? countByRole(results, "sales manager"),
        total_admins: response.counts?.total_admins ?? countByRole(results, "admin"),
      });
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const tabUsers = useMemo(
    () => allUsers.filter((user) => userMatchesTab(user, activeTab)),
    [allUsers, activeTab]
  );

  const filteredUsers = useMemo(
    () =>
      tabUsers.filter(
        (user) =>
          user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.mobileNumber?.includes(searchQuery)
      ),
    [tabUsers, searchQuery]
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  function handleTabChange(tab: UserTab) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/users?${params.toString()}`, { scroll: false });
  }

  const summaryStats = [
    {
      label: "Total Sales Persons",
      value: stats.total_sales_persons.toLocaleString(),
      icon: Users,
      color: "#3b6fd9",
      bg: "#e8f0fe",
    },
    {
      label: "Total Contractors",
      value: stats.total_contractors.toLocaleString(),
      icon: Handshake,
      color: "#475569",
      bg: "#f1f5f9",
    },
    {
      label: "Total Project Managers",
      value: stats.total_project_managers.toLocaleString(),
      icon: Workflow,
      color: "#c9922e",
      bg: "#faf3e8",
    },
    {
      label: "Total Sales Managers",
      value: stats.total_sales_managers.toLocaleString(),
      icon: Briefcase,
      color: "#0d9488",
      bg: "#ccfbf1",
    },
    {
      label: "Total Admins",
      value: stats.total_admins.toLocaleString(),
      icon: ShieldCheck,
      color: "#7c3aed",
      bg: "#ede9fe",
    },
  ];

  const getHeaders = () => {
    const commonPrefix = ["S.No", "Name"];
    const commonSuffix = ["Status", "Actions"];
    const contactCols = ["Mobile Number", "Email", "Working Hours"];

    if (activeTab === "All Users") {
      return [...commonPrefix, "Role", ...contactCols, "Status", "Actions"];
    }
    if (activeTab === "Sales Person") {
      return [
        ...commonPrefix,
        "Manager",
        ...contactCols,
        "Active Leads",
        "Customers",
        "Lost Leads",
        ...commonSuffix,
      ];
    }
    if (activeTab === "Contractors") {
      return [...commonPrefix, ...contactCols, "Assigned Projects", "Completed Inst.", "In Progress Inst.", ...commonSuffix];
    }
    if (activeTab === "Project Manager") {
      return [...commonPrefix, "Manager", ...contactCols, "Pending Inspections", "Completed Inspections", ...commonSuffix];
    }
    if (activeTab === "Sales Manager") {
      return [...commonPrefix, "Manager", ...contactCols, "Status", "Actions"];
    }
    if (activeTab === "Admin") {
      return [...commonPrefix, ...contactCols, "Status", "Actions"];
    }
    return commonPrefix;
  };

  const tableColSpan = getHeaders().length;

  const showRoleColumn = activeTab === "All Users";
  const showStandardUserColumns = activeTab === "All Users" || activeTab === "Admin";

  const workingHoursCell = (user: Record<string, unknown>) => (
    <WorkingHoursCell key={`hours-${String(user._id)}`} user={user} />
  );

  return (
    <div className={styles.usersPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>USERS</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Users</h1>
        {canCreateUsers && (
          <button className={styles.addBtn} onClick={() => router.push("/users/add")}>
            <Plus size={20} /> Add User
          </button>
        )}
      </div>

      <div className={userStyles.usersStatsGrid}>
        {summaryStats.map((stat) => (
          <div key={stat.label} className={userStyles.usersStatCard}>
            <div
              className={userStyles.usersStatIcon}
              style={{ backgroundColor: stat.bg, color: stat.color }}
            >
              <stat.icon size={22} />
            </div>
            <div className={userStyles.usersStatValue}>{stat.value}</div>
            <div className={userStyles.usersStatLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={userStyles.usersTabs}>
            {USER_TABS.map((tab) => (
              <div
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
                onClick={() => handleTabChange(tab)}
              >
                {tab}
              </div>
            ))}
          </div>
          <div className={styles.searchUsers}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search Users..."
              className={styles.searchInputSmall}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className={styles.userTableContainer}>
          <table className={styles.userTable}>
            <thead>
              <tr>
                {getHeaders().map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={tableColSpan} style={{ textAlign: "center", padding: "4rem" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "1rem",
                        color: "#94a3b8",
                      }}
                    >
                      <Loader2 size={32} className={styles.spinner} />
                      <span style={{ fontWeight: 600 }}>Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={tableColSpan} style={{ textAlign: "center", padding: "4rem", color: "#94a3b8", fontWeight: 600 }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                currentItems.map((user, index) => (
                  <tr key={user._id || index}>
                    <td style={{ fontWeight: 600, color: "#94a3b8" }}>{indexOfFirstItem + index + 1}</td>
                    <td>
                      <div className={styles.userDetails}>
                        <span
                          className={styles.userNameTable}
                          style={{
                            color: "var(--admin-primary, #004d4d)",
                            fontWeight: 700,
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                          onClick={() =>
                            router.push(withUserTab(`/users/view/${user._id}`, activeTab))
                          }
                        >
                          {user.fullName}
                        </span>
                      </div>
                    </td>

                    {showStandardUserColumns && (
                      <>
                        {showRoleColumn && (
                          <td>
                            <span className={`${styles.roleBadge} ${styles.badgeBlue}`}>
                              {user.userRole?.replace("_", " ").toUpperCase()}
                            </span>
                          </td>
                        )}
                        <td style={{ fontWeight: 500, color: "#1e293b" }}>{user.mobileNumber}</td>
                        <td style={{ color: "#64748b" }}>{user.email || "—"}</td>
                        {workingHoursCell(user)}
                        <td>
                          <div className={styles.statusCell}>
                            <span
                              className={
                                user.status === "active" ? styles.statusDotActive : styles.statusDotInactive
                              }
                            />
                            {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                          </div>
                        </td>
                      </>
                    )}

                    {activeTab === "Sales Person" && (
                      <>
                        <td style={{ fontWeight: 600, color: "var(--admin-primary, #004d4d)" }}>
                          {getSupervisorName(user)}
                        </td>
                        <td style={{ fontWeight: 500, color: "#1e293b" }}>{user.mobileNumber}</td>
                        <td style={{ color: "#64748b" }}>{user.email || "—"}</td>
                        {workingHoursCell(user)}
                        <td style={{ fontWeight: 600, color: "#1e293b" }}>{user.activeLeads || 0}</td>
                        <td style={{ fontWeight: 600, color: "#1e293b" }}>{user.customers || 0}</td>
                        <td style={{ fontWeight: 600, color: "#1e293b" }}>{user.closedLeads || 0}</td>
                        <td>
                          <div className={styles.statusCell}>
                            <span
                              className={
                                user.status === "active" ? styles.statusDotActive : styles.statusDotInactive
                              }
                            />
                            {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                          </div>
                        </td>
                      </>
                    )}

                    {activeTab === "Contractors" && (
                      <>
                        <td style={{ fontWeight: 500, color: "#1e293b" }}>{user.mobileNumber}</td>
                        <td style={{ color: "#64748b" }}>{user.email || "—"}</td>
                        {workingHoursCell(user)}
                        <td style={{ fontWeight: 600, color: "#1e293b" }}>{user.assignedProjects || 0}</td>
                        <td style={{ fontWeight: 600, color: "#1e293b" }}>{user.completedInstallations || 0}</td>
                        <td style={{ fontWeight: 600, color: "#1e293b" }}>{user.pendingInstallations || 0}</td>
                        <td>
                          <div className={styles.statusCell}>
                            <span
                              className={
                                user.status === "active" ? styles.statusDotActive : styles.statusDotInactive
                              }
                            />
                            {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                          </div>
                        </td>
                      </>
                    )}

                    {activeTab === "Sales Manager" && (
                      <>
                        <td style={{ fontWeight: 600, color: "var(--admin-primary, #004d4d)" }}>
                          {getSupervisorName(user)}
                        </td>
                        <td style={{ fontWeight: 500, color: "#1e293b" }}>{user.mobileNumber}</td>
                        <td style={{ color: "#64748b" }}>{user.email || "—"}</td>
                        {workingHoursCell(user)}
                        <td>
                          <div className={styles.statusCell}>
                            <span
                              className={
                                user.status === "active" ? styles.statusDotActive : styles.statusDotInactive
                              }
                            />
                            {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                          </div>
                        </td>
                      </>
                    )}

                    {activeTab === "Project Manager" && (
                      <>
                        <td style={{ fontWeight: 600, color: "var(--admin-primary, #004d4d)" }}>
                          {getSupervisorName(user)}
                        </td>
                        <td style={{ fontWeight: 500, color: "#1e293b" }}>{user.mobileNumber}</td>
                        <td style={{ color: "#64748b" }}>{user.email || "—"}</td>
                        {workingHoursCell(user)}
                        <td style={{ fontWeight: 600, color: "#1e293b" }}>{user.pendingInspections || 0}</td>
                        <td style={{ fontWeight: 600, color: "#1e293b" }}>{user.completedInspections || 0}</td>
                        <td>
                          <div className={styles.statusCell}>
                            <span
                              className={
                                user.status === "active" ? styles.statusDotActive : styles.statusDotInactive
                              }
                            />
                            {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                          </div>
                        </td>
                      </>
                    )}

                    <td>
                      {canEditUsers && (
                        <button
                          className={styles.assignBtn}
                          onClick={() =>
                            router.push(withUserTab(`/users/edit/${user._id}`, activeTab))
                          }
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
            Showing {filteredUsers.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} results
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
    </div>
  );
}
