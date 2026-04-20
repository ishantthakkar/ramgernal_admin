"use client";

import { useState } from "react";
import styles from "../dashboard.module.css";
import { 
  FileSearch, 
  User, 
  Activity, 
  ShieldAlert, 
  Search as SearchIcon, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  Clock,
  ExternalLink,
  Monitor
} from "lucide-react";

// Mock data for Audit Logs
const MOCK_AUDIT_LOGS = [
  { 
    id: "LOG-9921", 
    timestamp: "2024-04-20 14:32:15", 
    user: "Admin User", 
    action: "Updated Status", 
    module: "Workflow", 
    details: "Changed Survey SRV-2024-8842 to 'Completed'",
    ip: "192.168.1.45",
    device: "Chrome / Windows"
  },
  { 
    id: "LOG-9920", 
    timestamp: "2024-04-20 14:15:02", 
    user: "Alice Smith", 
    action: "Created Lead", 
    module: "Leads", 
    details: "Added new lead: Marcus Aurelius",
    ip: "102.15.22.101",
    device: "Safari / macOS"
  },
  { 
    id: "LOG-9919", 
    timestamp: "2024-04-20 12:44:30", 
    user: "System", 
    action: "Login Failure", 
    module: "Auth", 
    details: "3 failed attempts for user: contractor_01",
    ip: "45.12.18.22",
    device: "Mobile / iOS"
  },
  { 
    id: "LOG-9918", 
    timestamp: "2024-04-20 11:30:00", 
    user: "Bob Johnson", 
    action: "Assigned Task", 
    module: "Projects", 
    details: "Assigned Project #442 to Mike Miller",
    ip: "192.168.1.12",
    device: "Firefox / Linux"
  },
];

export default function AuditLogsPage() {
  const [activeType, setActiveType] = useState("All Activities");
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const stats = [
    { label: "Activities Today", value: "842", icon: Activity, color: "#0076ce", bg: "#e0e7ff" },
    { label: "Security Alerts", value: "3", icon: ShieldAlert, color: "#ef4444", bg: "#fef2f2" },
    { label: "Active Sessions", value: "12", icon: Monitor, color: "#10b981", bg: "#ecfdf5" },
  ];

  const getActionColor = (action: string) => {
    if (action.includes("Updated") || action.includes("Assigned")) return "#0076ce";
    if (action.includes("Created")) return "#10b981";
    if (action.includes("Failure") || action.includes("Deleted")) return "#ef4444";
    return "#64748b";
  };

  return (
    <div className={styles.usersPage} onClick={() => setOpenActionId(null)}>
      <div className={styles.breadcrumb}>
        ADMIN <span>/</span> AUDIT LOGS
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>System Audit Logs</h1>
        <button className={styles.addBtn} style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
          <Download size={20} /> Export Logs
        </button>
      </div>

      <div className={styles.userStatsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.userStatCard}>
            <div 
              className={styles.userStatIcon} 
              style={{ backgroundColor: stat.bg, color: stat.color }}
            >
              <stat.icon size={22} />
            </div>
            <div className={styles.userStatValue}>{stat.value}</div>
            <div className={styles.userStatLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.tabs}>
            {["All Activities", "Security Events", "Workflows", "User Auth"].map((tab) => (
              <div 
                key={tab} 
                className={`${styles.tab} ${activeType === tab ? styles.tabActive : ""}`}
                onClick={() => setActiveType(tab)}
              >
                {tab}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div className={styles.filterBtn}>
              <Filter size={18} /> Filters
            </div>
            <div className={styles.searchUsers}>
              <SearchIcon size={16} color="#94a3b8" />
              <input type="text" placeholder="Search logs..." className={styles.searchInputSmall} style={{ width: 150 }} />
            </div>
          </div>
        </div>

        <div className={styles.userTableContainer}>
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User / Agent</th>
                <th>Operation</th>
                <th>Module</th>
                <th>Action Details</th>
                <th>IP Address / Device</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {MOCK_AUDIT_LOGS.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                      <Clock size={14} />
                      <span style={{ fontWeight: 600 }}>{log.timestamp}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 24, height: 24, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={12} color="#64748b" />
                      </div>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>{log.user}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      color: getActionColor(log.action),
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span className={styles.idBadge} style={{ background: '#eff6ff', color: '#1d4ed8', border: 'none' }}>
                      {log.module}
                    </span>
                  </td>
                  <td>
                    <div style={{ color: '#475569', fontSize: '0.85rem', maxWidth: '300px', lineHeight: 1.4 }}>
                      {log.details}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.2 }}>
                      <div style={{ fontWeight: 700, color: '#64748b' }}>{log.ip}</div>
                      <div>{log.device}</div>
                    </div>
                  </td>
                  <td style={{ overflow: "visible", position: "relative" }}>
                    <div onClick={(e) => {
                      e.stopPropagation();
                      setOpenActionId(openActionId === log.id ? null : log.id);
                    }}>
                      <MoreVertical size={18} color="#94a3b8" style={{ cursor: "pointer" }} />
                    </div>
                    
                    {openActionId === log.id && (
                      <div className={styles.actionDropdown}>
                        <div className={styles.dropdownItem}><ExternalLink size={14} /> View Extended Info</div>
                        <div className={styles.dropdownItem}>Trace IP Branch</div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.tableFooter}>
          <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
            Showing {MOCK_AUDIT_LOGS.length} results
          </div>
          <div className={styles.pagination}>
            <div className={styles.pageBtn}><ChevronLeft size={18} /></div>
            <div className={`${styles.pageBtn} ${styles.pageActive}`}>1</div>
            <div className={styles.pageBtn}><ChevronRight size={18} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
