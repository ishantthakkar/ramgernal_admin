"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../dashboard.module.css";
import {
  Users,
  Plus,
  Search,
  UserPlus,
  Ticket,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";

export default function RolesPermissionsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getRoles();
      setRoles(data.roles || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = roles.filter(role =>
    role.roleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: "TOTAL ROLES", value: roles.length.toString(), icon: Users, color: "#0076ce", bg: "#eff6ff" },
    { label: "SYSTEM ROLES", value: "3", icon: Ticket, color: "#6366f1", bg: "#f5f3ff" },
    { label: "CUSTOM ROLES", value: (roles.length - 3 > 0 ? roles.length - 3 : 0).toString(), icon: UserPlus, color: "#f59e0b", bg: "#fffbeb" },
  ];

  return (
    <div className={styles.usersPage}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb} style={{ color: "#94a3b8", fontWeight: 600 }}>
        Admin <span style={{ margin: "0 0.5rem" }}>&gt;</span>
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
            Showing {filteredRoles.length} roles
          </div>
        </div>

        <div className={styles.userTableContainer}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 className={styles.spinner} />
            </div>
          ) : (
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Note</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.length > 0 ? (
                  filteredRoles.map((role) => (
                    <tr key={role._id}>
                      <td style={{ fontWeight: 600, color: "#475569" }}>{role.roleName}</td>
                      <td style={{ color: "#64748b" }}>{role.notes}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className={styles.assignBtn}
                          style={{ padding: "0.4rem 1.2rem", fontSize: "0.75rem" }}
                          onClick={() => router.push(`/roles/edit/${role._id}`)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No roles found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredRoles.length > 0 && (
          <div className={styles.tableFooter}>
            <div style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 500 }}>
              Showing 1 to {filteredRoles.length} of {roles.length} entries
            </div>
            <div className={styles.pagination}>
              <div className={styles.pageBtn}><ChevronLeft size={18} /></div>
              <div className={`${styles.pageBtn} ${styles.pageActive}`}>1</div>
              <div className={styles.pageBtn}><ChevronRight size={18} /></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
