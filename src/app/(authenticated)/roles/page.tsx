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
  Loader2,
  Trash2,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import { useRequireSuperAdmin } from "@/hooks/use-require-super-admin";
import { SYSTEM_ROLE_NAMES, isMobileUserRoleName } from "@/lib/role-modules";

interface RoleRow {
  _id: string;
  roleName?: string;
  notes?: string;
  isSystemRole?: boolean;
}

export default function RolesPermissionsPage() {
  const router = useRouter();
  const isAuthorized = useRequireSuperAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthorized) {
      fetchRoles();
    }
  }, [isAuthorized]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getRoles();
      const allRoles = (data.roles || []) as RoleRow[];
      const visibleRoles = allRoles.filter((role) => !isMobileUserRoleName(role.roleName || ""));
      setRoles(visibleRoles);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (role: RoleRow) => {
    if (role.isSystemRole) {
      toast.error("System roles cannot be deleted.");
      return;
    }

    if (!window.confirm(`Delete role "${role.roleName}"? This cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(role._id);
      await adminApi.deleteRole(role._id);
      toast.success("Role deleted successfully.");
      await fetchRoles();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete role");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.roleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const systemRoleCount = roles.filter((role) => role.isSystemRole).length;
  const customRoleCount = roles.filter((role) => !role.isSystemRole).length;

  const stats = [
    { label: "TOTAL ROLES", value: roles.length.toString(), icon: Users, color: "#0076ce", bg: "#eff6ff" },
    { label: "SYSTEM ROLES", value: systemRoleCount.toString(), icon: Ticket, color: "#6366f1", bg: "#f5f3ff" },
    { label: "CUSTOM ROLES", value: customRoleCount.toString(), icon: UserPlus, color: "#f59e0b", bg: "#fffbeb" },
  ];

  if (!isAuthorized) return null;

  return (
    <div className={styles.usersPage}>
      <div className={styles.breadcrumb} style={{ color: "#94a3b8", fontWeight: 600 }}>
        Admin <span style={{ margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>ROLES & PERMISSIONS</span>
      </div>

      <div className={styles.pageHeader} style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className={styles.welcomeText} style={{ fontSize: "1.875rem" }}>
            Manage Roles & Permissions
          </h1>
          <p style={{ color: "#64748b", marginTop: "0.5rem", fontSize: "0.9rem" }}>
            System roles: {SYSTEM_ROLE_NAMES.join(", ")}. Mobile roles (Contractor, Sales Person) are managed separately.
          </p>
        </div>
        <button
          className={styles.addBtn}
          style={{ padding: "0.75rem 1.75rem" }}
          onClick={() => router.push("/roles/create")}
        >
          <Plus size={20} /> Create Custom Role
        </button>
      </div>

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
            <div className={styles.userStatLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

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
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
              <Loader2 className={styles.spinner} />
            </div>
          ) : (
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Type</th>
                  <th>Note</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.length > 0 ? (
                  filteredRoles.map((role) => (
                    <tr key={role._id}>
                      <td style={{ fontWeight: 600, color: "#475569" }}>{role.roleName}</td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.2rem 0.65rem",
                            borderRadius: "999px",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            background: role.isSystemRole ? "#eff6ff" : "#fffbeb",
                            color: role.isSystemRole ? "#0076ce" : "#b45309",
                          }}
                        >
                          {role.isSystemRole ? "System" : "Custom"}
                        </span>
                      </td>
                      <td style={{ color: "#64748b" }}>{role.notes}</td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                          <button
                            className={styles.assignBtn}
                            style={{ padding: "0.4rem 1.2rem", fontSize: "0.75rem" }}
                            onClick={() => router.push(`/roles/edit/${role._id}`)}
                          >
                            Edit
                          </button>
                          {!role.isSystemRole && (
                            <button
                              className={styles.assignBtn}
                              style={{
                                padding: "0.4rem 0.9rem",
                                fontSize: "0.75rem",
                                color: "#dc2626",
                                borderColor: "#fecaca",
                              }}
                              onClick={() => handleDelete(role)}
                              disabled={deletingId === role._id}
                            >
                              {deletingId === role._id ? (
                                <Loader2 size={14} className={styles.spinner} />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                      No roles found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filteredRoles.length > 0 && (
          <div className={styles.tableFooter}>
            <div style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 500 }}>
              Showing 1 to {filteredRoles.length} of {roles.length} entries
            </div>
            <div className={styles.pagination}>
              <div className={styles.pageBtn}>
                <ChevronLeft size={18} />
              </div>
              <div className={`${styles.pageBtn} ${styles.pageActive}`}>1</div>
              <div className={styles.pageBtn}>
                <ChevronRight size={18} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
