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
  const [activeRole, setActiveRole] = useState("Super admin");
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  // More complex roles state
  const [roles, setRoles] = useState([
    { name: "Super admin", isSystem: true },
    { name: "Admin", isSystem: true },
    { name: "Project Manager", isSystem: true },
    { name: "Sales Manager", isSystem: true },
  ]);

  // Permissions state: { [roleName]: { [moduleId]: boolean[] } }
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean[]>>>({
    "Super admin": MODULES.reduce((acc, m) => ({ ...acc, [m.id]: ACTIONS.map(() => true) }), {}),
    "Admin": MODULES.reduce((acc, m) => ({ ...acc, [m.id]: ACTIONS.map((_, i) => i < 5) }), {}),
    "Project Manager": MODULES.reduce((acc, m) => ({ ...acc, [m.id]: ACTIONS.map((_, i) => i === 0 || i === 4) }), {}),
    "Sales Manager": MODULES.reduce((acc, m) => ({ ...acc, [m.id]: ACTIONS.map((_, i) => i === 0) }), {}),
  });

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(`Permissions for ${activeRole} updated successfully!`);
    }, 800);
  };

  const togglePermission = (moduleId: string, actionIdx: number) => {
    if (activeRole === "Super admin") {
      toast.warning("Super admin permissions are system-protected and cannot be modified.");
      return;
    }

    setPermissions(prev => {
      const rolePerms = prev[activeRole] || MODULES.reduce((acc, m) => ({ ...acc, [m.id]: ACTIONS.map(() => false) }), {});
      const modulePerms = [...(rolePerms[moduleId] || ACTIONS.map(() => false))];
      modulePerms[actionIdx] = !modulePerms[actionIdx];
      
      return {
        ...prev,
        [activeRole]: {
          ...rolePerms,
          [moduleId]: modulePerms
        }
      };
    });
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    
    if (roles.some(r => r.name.toLowerCase() === newRoleName.toLowerCase())) {
      toast.error("Role already exists.");
      return;
    }

    const newRole = { name: newRoleName, isSystem: false };
    setRoles([...roles, newRole]);
    setPermissions(prev => ({
      ...prev,
      [newRoleName]: MODULES.reduce((acc, m) => ({ ...acc, [m.id]: ACTIONS.map(() => false) }), {})
    }));
    setActiveRole(newRoleName);
    setNewRoleName("");
    setShowCreateModal(false);
    toast.success(`${newRoleName} role created! You can now configure its permissions.`);
  };

  const handleDeleteRole = (e: React.MouseEvent, roleName: string) => {
    e.stopPropagation();
    if (roles.find(r => r.name === roleName)?.isSystem) {
      toast.error("System roles cannot be deleted.");
      return;
    }

    if (!confirm(`Are you sure you want to delete the "${roleName}" role?`)) return;

    setRoles(prev => prev.filter(r => r.name !== roleName));
    setPermissions(prev => {
      const { [roleName]: removed, ...rest } = prev;
      return rest;
    });

    if (activeRole === roleName) {
      setActiveRole("Super admin");
    }
    toast.success(`${roleName} role deleted successfully.`);
  };

  return (
    <div className={styles.usersPage} onClick={() => setShowCreateModal(false)}>
      <div className={styles.breadcrumb}>
        ADMIN <span>/</span> ROLES & PERMISSIONS
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Access Control Management</h1>
        <button className={styles.addBtn} onClick={(e) => { e.stopPropagation(); setShowCreateModal(true); }}>
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
                key={role.name}
                onClick={() => setActiveRole(role.name)}
                style={{ 
                  padding: '1.25rem 1.5rem',
                  cursor: 'pointer',
                  borderLeft: activeRole === role.name ? '4px solid #0076ce' : '4px solid transparent',
                  background: activeRole === role.name ? '#eff6ff' : 'transparent',
                  color: activeRole === role.name ? '#1d4ed8' : '#64748b',
                  fontWeight: activeRole === role.name ? 700 : 500,
                  transition: 'all 0.2s',
                  fontSize: '0.95rem',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ 
                  color: activeRole === role.name ? '#1d4ed8' : '#64748b',
                  fontWeight: activeRole === role.name ? 700 : 500,
                  fontSize: '0.95rem'
                }}>
                  {role.name}
                </span>
                {role.isSystem ? null : (
                  <Trash2 
                    size={16} 
                    className={styles.deleteIcon} 
                    onClick={(e) => handleDeleteRole(e, role.name)} 
                    style={{ color: '#ef4444', opacity: 0.7, padding: '2px' }}
                  />
                )}
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
                      const isChecked = permissions[activeRole]?.[module.id]?.[idx] || false;

                      return (
                        <td key={action} style={{ textAlign: 'center' }}>
                          <div 
                            onClick={() => togglePermission(module.id, idx)}
                            style={{ display: 'inline-flex', cursor: activeRole === "Super admin" ? 'not-allowed' : 'pointer' }}
                          >
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
             <span><strong>Note:</strong> 
               {activeRole === "Super admin" 
                 ? " Super admin permissions are system-locked for security." 
                 : ` Changes to ${activeRole} permissions affect all users with this role immediately.`
               }
             </span>
          </div>
        </div>
      </div>

      {/* Role Creation Modal */}
      {showCreateModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 
        }}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
          >
            <h3 style={{ marginTop: 0 }}>Create New Role</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Role Name</label>
              <input 
                autoFocus
                type="text" 
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                placeholder="Manager, Supervisor, etc."
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowCreateModal(false)} className={styles.cancelBtn} style={{ flex: 1 }}>Cancel</button>
              <button 
                onClick={handleCreateRole} 
                className={styles.addBtn} 
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={!newRoleName.trim()}
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
