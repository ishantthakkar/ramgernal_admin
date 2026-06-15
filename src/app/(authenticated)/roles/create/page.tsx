"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../dashboard.module.css";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { adminApi } from "@/lib/api";
import { PermissionMatrix } from "@/components/roles/permission-matrix";
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

  const togglePermission = (moduleId: string, action: PermissionAction) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [action]: !prev[moduleId][action],
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
      <div className={styles.breadcrumb} style={{ color: "#94a3b8", fontWeight: 600 }}>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/dashboard")}>
          DASHBOARD
        </span>
        <span style={{ margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/roles")}>
          ROLES & PERMISSIONS
        </span>
        <span style={{ margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>CREATE ROLE</span>
      </div>

      <div className={styles.pageHeader} style={{ marginBottom: "2rem" }}>
        <h1 className={styles.welcomeText} style={{ fontSize: "1.875rem" }}>
          Create Custom Role
        </h1>
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
            placeholder="Enter custom role name"
          />
        </div>

        <PermissionMatrix permissions={permissions} onToggle={togglePermission} />
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
        <button onClick={handleCreate} className={styles.addBtn} style={{ padding: "0.75rem 3.5rem" }} disabled={loading}>
          {loading ? "Creating..." : "Create"}
        </button>
      </div>
    </div>
  );
}
