"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "../../../dashboard.module.css";
import { X, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { adminApi } from "@/lib/api";
import { PermissionMatrix } from "@/components/roles/permission-matrix";
import { useRequireSuperAdmin } from "@/hooks/use-require-super-admin";
import {
  buildEmptyPermissionsState,
  formatPermissionsForApi,
  parsePermissionsFromApi,
  type PermissionAction,
} from "@/lib/role-modules";

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isAuthorized = useRequireSuperAdmin();

  const [roleName, setRoleName] = useState("");
  const [note, setNote] = useState("");
  const [isSystemRole, setIsSystemRole] = useState(false);
  const [isAdminRole, setIsAdminRole] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState(buildEmptyPermissionsState);

  useEffect(() => {
    if (id && isAuthorized) {
      fetchRoleDetails();
    }
  }, [id, isAuthorized]);

  const fetchRoleDetails = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getRoleById(id);
      const role = data.role;

      setRoleName(role.roleName);
      setNote(role.notes || "");
      setIsSystemRole(Boolean(role.isSystemRole));
      setIsAdminRole(role.roleName === "Admin");
      setPermissions(parsePermissionsFromApi(role.permissions));
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch role details");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (moduleId: string, action: PermissionAction) => {
    if (isAdminRole) return;

    setPermissions((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [action]: !prev[moduleId][action],
      },
    }));
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      toast.error("Please enter a role name");
      return;
    }

    try {
      setSaving(true);

      await adminApi.updateRole({
        id,
        roleName: roleName.trim(),
        notes: note.trim(),
        permissions: formatPermissionsForApi(permissions),
      });

      toast.success("Role updated successfully!");
      router.push("/roles");
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthorized) return null;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Loader2 className={styles.spinner} size={48} />
      </div>
    );
  }

  return (
    <div className={styles.usersPage}>
      <div className={styles.breadcrumb} style={{ color: "#94a3b8", fontWeight: 600 }}>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/dashboard")}>
          DASHBOARD
        </span>
        <span style={{ margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/roles")}>
          ROLES & PERMISSIONS
        </span>
        <span style={{ margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>EDIT ROLE</span>
      </div>

      <div className={styles.pageHeader} style={{ marginBottom: "2rem" }}>
        <h1 className={styles.welcomeText} style={{ fontSize: "1.875rem" }}>
          Edit Role
        </h1>
        {isSystemRole && (
          <span
            style={{
              background: "#eff6ff",
              color: "#0076ce",
              padding: "0.4rem 0.9rem",
              borderRadius: "999px",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            System Role
          </span>
        )}
      </div>

      <div className={styles.formSection} style={{ padding: "2.5rem", borderRadius: "20px" }}>
        <h2 className={styles.sectionTitle} style={{ fontSize: "1.25rem", marginBottom: "2rem" }}>
          Role Information
        </h2>

        <div className={styles.formGroup} style={{ maxWidth: "400px", marginBottom: "2.5rem" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: "0.5rem", display: "block" }}>
            ROLE
          </label>
          <input
            type="text"
            className={styles.formInput}
            style={{ background: "#f1f5f9", border: "none" }}
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="Enter Role Name"
            disabled={isSystemRole}
            readOnly={isSystemRole}
          />
          {isAdminRole && (
            <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#64748b" }}>
              Admin has full access to all modules. Permissions cannot be changed.
            </p>
          )}
        </div>

        <PermissionMatrix
          permissions={permissions}
          onToggle={togglePermission}
          readOnly={isAdminRole}
        />
      </div>

      <div className={styles.formSection} style={{ padding: "2.5rem", borderRadius: "20px", marginTop: "2rem" }}>
        <h2 className={styles.sectionTitle} style={{ fontSize: "1.25rem", marginBottom: "2rem" }}>
          Notes
        </h2>

        <div className={styles.formGroup}>
          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: "0.5rem", display: "block" }}>
            NOTE
          </label>
          <input
            type="text"
            className={styles.formInput}
            style={{ background: "#f1f5f9", border: "none" }}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional description for this role"
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "3rem", padding: "1.5rem 0" }}>
        <button
          onClick={() => router.push("/roles")}
          className={styles.cancelBtn}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 2.5rem",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            color: "#64748b",
          }}
        >
          <X size={18} /> Cancel
        </button>
        <button onClick={handleSave} className={styles.addBtn} style={{ padding: "0.75rem 3.5rem" }} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
