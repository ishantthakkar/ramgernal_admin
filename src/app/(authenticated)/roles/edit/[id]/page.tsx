"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "../../../dashboard.module.css";
import { X, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { adminApi } from "@/lib/api";
import { PermissionAllMatrix } from "@/components/roles/permission-all-matrix";
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

  const togglePermission = (key: string, action: PermissionAction) => {
    if (isAdminRole) return;

    setPermissions((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [action]: !prev[key][action],
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
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/roles")}>
          ROLES & PERMISSIONS
        </span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>EDIT ROLE</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Edit Role</h1>
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

      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Role Information</h2>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Role</label>
            <input
              type="text"
              className={styles.formInput}
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

          <div className={styles.formGroup}>
            <label>Note</label>
            <input
              type="text"
              className={styles.formInput}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional description for this role"
            />
          </div>
        </div>

        <div style={{ marginTop: "2rem" }}>
          <h2 className={styles.sectionTitle}>Permissions</h2>
          <PermissionAllMatrix
            permissions={permissions}
            onToggle={togglePermission}
            readOnly={isAdminRole}
          />
        </div>
      </div>

      <div className={styles.actionFooter}>
        <button onClick={() => router.push("/roles")} className={styles.cancelBtn}>
          <X size={18} /> Cancel
        </button>
        <button onClick={handleSave} className={styles.addBtn} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
