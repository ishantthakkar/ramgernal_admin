"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../dashboard.module.css";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { adminApi } from "@/lib/api";
import { PermissionAllMatrix } from "@/components/roles/permission-all-matrix";
import { useRequireSuperAdmin } from "@/hooks/use-require-super-admin";
import {
  buildEmptyPermissionsState,
  formatPermissionsForApi,
  isSystemRoleName,
  type PermissionAction,
} from "@/lib/role-modules";

export default function CreateRolePage() {
  const router = useRouter();
  const isAuthorized = useRequireSuperAdmin();
  const [roleName, setRoleName] = useState("");
  const [note, setNote] = useState("");
  const [permissions, setPermissions] = useState(buildEmptyPermissionsState);
  const [loading, setLoading] = useState(false);

  const togglePermission = (key: string, action: PermissionAction) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [action]: !prev[key][action],
      },
    }));
  };

  const handleCreate = async () => {
    if (!roleName.trim()) {
      toast.error("Please enter a role name");
      return;
    }

    if (isSystemRoleName(roleName)) {
      toast.error("This role name is reserved for a system role.");
      return;
    }

    try {
      setLoading(true);

      await adminApi.createRole({
        roleName: roleName.trim(),
        notes: note.trim(),
        permissions: formatPermissionsForApi(permissions),
      });

      toast.success("Role created successfully!");
      router.push("/roles");
    } catch (error: any) {
      toast.error(error.message || "Failed to create role");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) return null;

  return (
    <div className={styles.usersPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/roles")}>
          ROLES & PERMISSIONS
        </span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>CREATE ROLE</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Create Custom Role</h1>
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
              placeholder="Enter custom role name"
            />
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
          <PermissionAllMatrix permissions={permissions} onToggle={togglePermission} />
        </div>
      </div>

      <div className={styles.actionFooter}>
        <button onClick={() => router.push("/roles")} className={styles.cancelBtn}>
          <X size={18} /> Cancel
        </button>
        <button onClick={handleCreate} className={styles.addBtn} disabled={loading}>
          {loading ? "Creating..." : "Create"}
        </button>
      </div>
    </div>
  );
}
