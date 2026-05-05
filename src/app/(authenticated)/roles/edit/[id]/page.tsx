"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "../../../dashboard.module.css";
import { 
  X, 
  ChevronDown, 
  LayoutGrid, 
  BarChart2, 
  User, 
  ClipboardCheck, 
  FolderKanban, 
  Zap, 
  Search as SearchIcon, 
  FileEdit, 
  PieChart, 
  History,
  Check,
  Wallet
} from "lucide-react";
import { toast } from "react-toastify";
import { adminApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

const MODULES = [
  { id: "users", name: "User", icon: User, allowed: ["view", "edit", "create"] },
  { id: "dashboard", name: "Dashboard", icon: LayoutGrid, allowed: ["view"] },
  { id: "leads", name: "Leads", icon: BarChart2, allowed: ["view", "edit"] },
  { id: "customers", name: "Customers", icon: User, allowed: ["view", "edit"] },
  { id: "surveys", name: "Surveys", icon: ClipboardCheck, allowed: ["view", "edit"] },
  { id: "installation", name: "Installation", icon: Zap, allowed: ["view", "edit"] },
  { id: "inspection", name: "Inspection", icon: SearchIcon, allowed: ["view", "edit"] },
  { id: "commissions", name: "Commission", icon: Wallet, allowed: ["view", "edit"] },
  { id: "services", name: "Services", icon: ClipboardCheck, allowed: ["view", "create", "edit"] },
  { id: "audit_logs", name: "Audit", icon: History, allowed: ["view"] },
];

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [roleName, setRoleName] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>(
    MODULES.reduce((acc, m) => ({
      ...acc,
      [m.id]: { view: false, create: false, edit: false }
    }), {})
  );

  useEffect(() => {
    if (id) {
      fetchRoleDetails();
    }
  }, [id]);

  const fetchRoleDetails = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getRoleById(id);
      const role = data.role;
      
      setRoleName(role.roleName);
      setNote(role.notes);
      
      const newPermissions: any = {};
      MODULES.forEach(m => {
        const apiPerms = role.permissions?.[m.name] || {};
        newPermissions[m.id] = {
          view: apiPerms.view === 1,
          create: apiPerms.create === 1,
          edit: apiPerms.edit === 1,
        };
      });
      setPermissions(newPermissions);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch role details");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (moduleId: string, action: string) => {
    setPermissions(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [action]: !prev[moduleId][action]
      }
    }));
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      toast.error("Please enter a role name");
      return;
    }

    try {
      setSaving(true);
      
      const formattedPermissions: any = {};
      MODULES.forEach(m => {
        formattedPermissions[m.name] = {
          view: permissions[m.id].view ? 1 : 0,
          create: permissions[m.id].create ? 1 : 0,
          edit: permissions[m.id].edit ? 1 : 0,
        };
      });

      const roleData = {
        id,
        roleName: roleName.trim(),
        notes: note.trim(),
        permissions: formattedPermissions
      };

      await adminApi.updateRole(roleData);
      toast.success("Role updated successfully!");
      router.push("/roles");
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader2 className={styles.spinner} size={48} />
      </div>
    );
  }

  return (
    <div className={styles.usersPage}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb} style={{ color: "#94a3b8", fontWeight: 600 }}>
        <span 
          style={{ cursor: "pointer" }} 
          onClick={() => router.push("/dashboard")}
        >
          DASHBOARD
        </span> 
        <span style={{ margin: "0 0.5rem" }}>&gt;</span>
        <span 
          style={{ cursor: "pointer" }} 
          onClick={() => router.push("/roles")}
        >
          ROLES & PERMISSIONS
        </span> 
        <span style={{ margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>EDIT ROLE</span>
      </div>

      {/* Page Header */}
      <div className={styles.pageHeader} style={{ marginBottom: "2rem" }}>
        <h1 className={styles.welcomeText} style={{ fontSize: "1.875rem" }}>
          Edit Role
        </h1>
      </div>

      {/* Main Content Card */}
      <div className={styles.formSection} style={{ padding: "2.5rem", borderRadius: "20px" }}>
        <h2 className={styles.sectionTitle} style={{ fontSize: "1.25rem", marginBottom: "2rem" }}>
          Role Information
        </h2>

        <div className={styles.formGroup} style={{ maxWidth: "400px", marginBottom: "2.5rem" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: "0.5rem", display: "block" }}>ROLE</label>
          <input 
            type="text"
            className={styles.formInput} 
            style={{ background: "#f1f5f9", border: "none" }}
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="Enter Role Name"
          />
        </div>

        {/* Permissions Grid Container */}
        <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr repeat(3, 1fr)", gap: "1rem", marginBottom: "1rem", padding: "0 1rem" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#94a3b8" }}>MODULE / SCOPE</div>
            {["VIEW", "CREATE", "EDIT"].map(action => (
              <div key={action} style={{ fontSize: "0.65rem", fontWeight: 800, color: "#94a3b8", textAlign: "center" }}>{action}</div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {MODULES.map((module) => (
              <div 
                key={module.id} 
                style={{ 
                  background: "#ffffff", 
                  borderRadius: "12px", 
                  padding: "0.75rem 1rem", 
                  display: "grid", 
                  gridTemplateColumns: "2fr repeat(3, 1fr)", 
                  alignItems: "center",
                  gap: "1rem",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ background: "#f1f5f9", padding: "0.5rem", borderRadius: "8px", color: "#0076ce" }}>
                    <module.icon size={18} />
                  </div>
                  <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.9rem" }}>{module.name}</span>
                </div>
                {["view", "create", "edit"].map((action) => (
                  <div key={action} style={{ display: "flex", justifyContent: "center" }}>
                    {module.allowed.includes(action) ? (
                      <div 
                        onClick={() => togglePermission(module.id, action)}
                        style={{ 
                          width: "20px", 
                          height: "20px", 
                          borderRadius: "4px", 
                          border: permissions[module.id][action] ? "none" : "2px solid #e2e8f0",
                          background: permissions[module.id][action] ? "#0076ce" : "transparent",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s"
                        }}
                      >
                        {permissions[module.id][action] && <Check size={14} color="white" strokeWidth={3} />}
                      </div>
                    ) : (
                      <div style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1", fontWeight: 700 }}>-</div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className={styles.formSection} style={{ padding: "2.5rem", borderRadius: "20px", marginTop: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h2 className={styles.sectionTitle} style={{ fontSize: "1.25rem", marginBottom: 0 }}>
            Notes
          </h2>
          <button 
            style={{ 
              background: "none", 
              border: "1px solid #0076ce", 
              color: "#0076ce", 
              padding: "0.6rem 1.25rem", 
              borderRadius: "8px", 
              fontWeight: 600, 
              fontSize: "0.875rem",
              cursor: "pointer"
            }}
          >
            Add Notes
          </button>
        </div>

        <div className={styles.formGroup}>
          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: "0.5rem", display: "block" }}>NOTE 1</label>
          <input 
            type="text" 
            className={styles.formInput} 
            style={{ background: "#f1f5f9", border: "none" }}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Sales Person"
          />
        </div>
      </div>

      {/* Footer Actions */}
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
            color: "#64748b" 
          }}
        >
          <X size={18} /> Cancel
        </button>
        <button 
          onClick={handleSave}
          className={styles.addBtn}
          style={{ padding: "0.75rem 3.5rem" }}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
