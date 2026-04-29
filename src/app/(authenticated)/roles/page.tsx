"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../dashboard.module.css";
import { 
  Users, 
  Plus, 
  MoreVertical, 
  Search, 
  UserPlus,
  Ticket,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function RolesPermissionsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  // Mock roles data based on the image
  const [roles] = useState([
    { id: 1, name: "Sales Person", note: "Jack Heilson" },
    { id: 2, name: "Contractor", note: "Jack Heilson" },
    { id: 3, name: "Project Manager", note: "Jack Heilson" },
  ]);

  const stats = [
    { label: "TOTAL SALES PERSONS", value: "100", icon: Users, color: "#0076ce", bg: "#eff6ff" },
    { label: "TOTAL CONTRACTORS", value: "500", icon: Ticket, color: "#6366f1", bg: "#f5f3ff" },
    { label: "TOTAL PROJECT MANAGERS", value: "20", icon: UserPlus, color: "#f59e0b", bg: "#fffbeb" },
  ];

  return (
    <div className={styles.usersPage}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb} style={{ color: "#94a3b8", fontWeight: 600 }}>
        DASHBOARD <span style={{ margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>ROLES & PERMISSIONS</span>
      </div>

      {/* Page Header */}
      <div className={styles.pageHeader} style={{ marginBottom: "2rem" }}>
        <h1 className={styles.welcomeText} style={{ fontSize: "1.875rem" }}>
          Manage Roles & Permissions
        </h1>
        <button 
          className={styles.addBtn} 
          style={{ padding: "0.75rem 1.75rem" }}
          onClick={() => router.push("/roles/create")}
        >
          <Plus size={20} /> Create New Role
        </button>
      </div>

      {/* Stats Grid */}
      <div className={styles.userStatsGrid} style={{ marginBottom: "2.5rem" }}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.userStatCard} style={{ background: "#ffffff", border: "1px solid #f1f5f9" }}>
            <div 
              className={styles.userStatIcon} 
              style={{ backgroundColor: stat.bg, color: stat.color, width: "44px", height: "44px", borderRadius: "10px" }}
            >
              <stat.icon size={22} />
            </div>
            <div className={styles.userStatValue} style={{ fontSize: "1.75rem" }}>
              {stat.value}
            </div>
            <div className={styles.userStatLabel}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className={styles.tableCard} style={{ padding: "2rem" }}>
        <div className={styles.tableHeader}>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            <div className={styles.searchUsers}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search Roles"
                className={styles.searchInputSmall}
                style={{ width: "440px" }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 500 }}>
            Showing 1-10 of 1,284 users
          </div>
        </div>

        <div className={styles.userTableContainer}>
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>Role</th>
                <th>Note</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td style={{ fontWeight: 600, color: "#475569" }}>{role.name}</td>
                  <td style={{ color: "#64748b" }}>{role.note}</td>
                  <td style={{ textAlign: "right" }}>
                    <button 
                      className={styles.assignBtn}
                      style={{ padding: "0.4rem 1.2rem", fontSize: "0.75rem" }}
                      onClick={() => router.push(`/roles/edit/${role.id}`)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={styles.tableFooter}>
          <div style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 500 }}>
            Showing 1 to 4 of 1,284 entries
          </div>
          <div className={styles.pagination}>
            <div className={styles.pageBtn}><ChevronLeft size={18} /></div>
            <div className={`${styles.pageBtn} ${styles.pageActive}`}>1</div>
            <div className={styles.pageBtn}>2</div>
            <div className={styles.pageBtn}>3</div>
            <div style={{ display: "flex", alignItems: "center", color: "#94a3b8", padding: "0 0.5rem" }}>...</div>
            <div className={styles.pageBtn}>128</div>
            <div className={styles.pageBtn}><ChevronRight size={18} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
