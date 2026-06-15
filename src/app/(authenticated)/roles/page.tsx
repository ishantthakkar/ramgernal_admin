"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../dashboard.module.css";
import roleStyles from "./roles.module.css";
import {
  Users,
  Plus,
  Search,
  UserPlus,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import { useRequireSuperAdmin } from "@/hooks/use-require-super-admin";
import { isMobileUserRoleName } from "@/lib/role-modules";

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
    {
      label: "Total Roles",
      value: roles.length.toLocaleString(),
      icon: Users,
      color: "#3b6fd9",
      bg: "#e8f0fe",
    },
    {
      label: "System Roles",
      value: systemRoleCount.toLocaleString(),
      icon: ShieldCheck,
      color: "#7c3aed",
      bg: "#ede9fe",
    },
    {
      label: "Custom Roles",
      value: customRoleCount.toLocaleString(),
      icon: UserPlus,
      color: "#0d9488",
      bg: "#ccfbf1",
    },
  ];

  if (!isAuthorized) return null;

  return (
    <div className={styles.usersPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>ROLES & PERMISSIONS</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Roles & Permissions</h1>
        <button className={styles.addBtn} onClick={() => router.push("/roles/create")}>
          <Plus size={20} /> Create Custom Role
        </button>
      </div>

      <div className={roleStyles.rolesStatsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} className={roleStyles.rolesStatCard}>
            <div
              className={roleStyles.rolesStatIcon}
              style={{ backgroundColor: stat.bg, color: stat.color }}
            >
              <stat.icon size={22} />
            </div>
            <div className={roleStyles.rolesStatValue}>{stat.value}</div>
            <div className={roleStyles.rolesStatLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.searchUsers}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search Roles..."
              className={styles.searchInputSmall}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 500 }}>
            Showing {filteredRoles.length} roles
          </div>
        </div>

        <div className={styles.userTableContainer}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
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
                <span style={{ fontWeight: 600 }}>Loading roles...</span>
              </div>
            </div>
          ) : (
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Type</th>
                  <th>Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.length > 0 ? (
                  filteredRoles.map((role) => (
                    <tr key={role._id}>
                      <td>
                        <span className={roleStyles.roleName}>{role.roleName}</span>
                      </td>
                      <td>
                        <span className={role.isSystemRole ? roleStyles.systemBadge : roleStyles.customBadge}>
                          {role.isSystemRole ? "System" : "Custom"}
                        </span>
                      </td>
                      <td style={{ color: "#64748b" }}>{role.notes || "—"}</td>
                      <td>
                        <div className={roleStyles.actionGroup}>
                          <button
                            type="button"
                            className={styles.assignBtn}
                            onClick={() => router.push(`/roles/edit/${role._id}`)}
                          >
                            Edit
                          </button>
                          {!role.isSystemRole && (
                            <button
                              type="button"
                              className={roleStyles.deleteBtn}
                              onClick={() => handleDelete(role)}
                              disabled={deletingId === role._id}
                              aria-label={`Delete ${role.roleName}`}
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
                    <td colSpan={4} style={{ textAlign: "center", padding: "4rem", color: "#94a3b8", fontWeight: 600 }}>
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
