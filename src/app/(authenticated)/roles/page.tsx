"use client";

import { useState } from "react";
import styles from "../dashboard.module.css";
import { 
  ShieldCheck, 
  Plus, 
  Save, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  LayoutDashboard, 
  Search, 
  Handshake, 
  ClipboardCheck, 
  Hammer, 
  Search as SearchIcon, 
  BarChart3, 
  FileText,
  Wallet,
  Settings
} from "lucide-react";
import { toast } from "react-toastify";

// Define the modules for access control
const MODULES = [
  { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
  { id: "leads", name: "Leads", icon: Search },
  { id: "customers", name: "Customers", icon: Handshake },
  { id: "surveys", name: "Surveys", icon: ClipboardCheck },
  { id: "projects", name: "Projects", icon: Settings },
  { id: "installation", name: "Installation", icon: Hammer },
  { id: "inspection", name: "Inspection", icon: SearchIcon },
  { id: "commissions", name: "Commissions", icon: Wallet },
  { id: "reports", name: "Reports", icon: BarChart3 },
  { id: "audit", name: "Audit Logs", icon: FileText },
];

// Define the actions for granular control
const ACTIONS = ["View", "Create", "Edit", "Approve/Reject", "Assign", "Start", "Submit"];

export default function RolesPermissionsPage() {
  const [activeRole, setActiveRole] = useState("Sales Manager");
  const [loading, setLoading] = useState(false);

  // Mock roles list
  const roles = ["Administrator", "Sales Manager", "Sales Person", "Contractor", "Project Manager"];

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(`Permissions for ${activeRole} updated successfully!`);
    }, 800);
  };

  return (
    <div className={styles.usersPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span>/</span> ROLES & PERMISSIONS
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Access Control Management</h1>
        <button className={styles.addBtn}>
          <Plus size={20} /> Create New Role
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2.5rem', alignItems: 'start' }}>
        {/* Roles Sidebar */}
        <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0076ce' }}>
            <ShieldCheck size={18} /> System Roles
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {roles.map((role) => (
              <div 
                key={role}
                onClick={() => setActiveRole(role)}
                style={{ 
                  padding: '1.25rem 1.5rem',
                  cursor: 'pointer',
                  borderLeft: activeRole === role ? '4px solid #0076ce' : '4px solid transparent',
                  background: activeRole === role ? '#eff6ff' : 'transparent',
                  color: activeRole === role ? '#1d4ed8' : '#64748b',
                  fontWeight: activeRole === role ? 700 : 500,
                  transition: 'all 0.2s',
                  fontSize: '0.95rem'
                }}
              >
                {role}
              </div>
            ))}
          </div>
        </div>

        {/* Permission Grid */}
        <div className={styles.tableCard} style={{ padding: 0 }}>
          <div style={{ 
            padding: '1.5rem 2rem', 
            borderBottom: '1px solid #f1f5f9', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: '#f8fafc' 
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Configuring Permissions For
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>{activeRole}</div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
               <button 
                className={styles.addBtn} 
                style={{ background: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0' }}
                onClick={() => toast.info("Resetting to defaults...")}
              >
                Reset
              </button>
              <button className={styles.addBtn} onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : <><Save size={18} /> Save Changes</>}
              </button>
            </div>
          </div>

          <div className={styles.userTableContainer}>
            <table className={styles.userTable} style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ background: 'transparent' }}>Module Name</th>
                  {ACTIONS.map(action => (
                    <th key={action} style={{ background: 'transparent', textAlign: 'center' }}>{action}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES.map((module) => (
                  <tr key={module.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: '#f1f5f9', padding: '0.6rem', borderRadius: '10px' }}>
                          <module.icon size={18} color="#0076ce" />
                        </div>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{module.name}</span>
                      </div>
                    </td>
                    {ACTIONS.map((action, idx) => {
                      // Some logic to show checked/unchecked for demo
                      const isChecked = activeRole === "Administrator" || 
                        (activeRole === "Sales Manager" && (module.id !== "audit" || action === "View")) ||
                        (activeRole === "Contractor" && (module.id === "installation" || module.id === "projects") && (action === "View" || action === "Submit" || action === "Start"));

                      return (
                        <td key={action} style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', cursor: 'pointer' }}>
                            {isChecked ? (
                              <CheckCircle2 size={22} color="#10b981" />
                            ) : (
                              <Circle size={22} color="#e2e8f0" />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ padding: '1.5rem', background: '#fffef3', borderTop: '1px solid #fef3c7', fontSize: '0.85rem', color: '#854d0e', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
             <ShieldCheck size={18} />
             <span><strong>Note:</strong> Changes to system roles affect all users assigned to that role immediately. Use caution when modifying Administrator permissions.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
