"use client";

import { useState } from "react";
import styles from "../dashboard.module.css";
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search as SearchIcon, 
  Filter, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  Download,
  CheckCircle2,
  Clock,
  User,
  Briefcase
} from "lucide-react";

// Mock data for Commissions
const MOCK_COMMISSIONS = [
  { id: "COM-001", project: "Solar Install - Doe Residence", agent: "Alice Smith", amount: 450.00, status: "Paid", date: "2024-04-15", type: "Sales" },
  { id: "COM-002", project: "Enterprise Grid - Corp X", agent: "Bob Johnson", amount: 1250.00, status: "Pending", date: "2024-04-18", type: "Referral" },
  { id: "COM-003", project: "Roof Retrofit - Smith", agent: "Alice Smith", amount: 320.00, status: "Paid", date: "2024-04-10", type: "Sales" },
  { id: "COM-004", project: "High-Bay Upgrade - Factory Y", agent: "Charlie Brown", amount: 2100.00, status: "Pending", date: "2024-04-20", type: "Sales" },
];

const MONTHLY_STATS = [
  { month: "April 2024", total: "$12,450", trend: "+12%", up: true },
  { month: "March 2024", total: "$10,800", trend: "+5%", up: true },
  { month: "February 2024", total: "$14,200", trend: "-8%", up: false },
];

export default function CommissionsPage() {
  const [activeTab, setActiveTab] = useState("All Projects");
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const stats = [
    { label: "Total Commissions", value: "$45,280", icon: DollarSign, color: "#0076ce", bg: "#e0e7ff" },
    { label: "Paid This Month", value: "$8,450", icon: CheckCircle2, color: "#10b981", bg: "#ecfdf5" },
    { label: "Pending Payouts", value: "$12,320", icon: Clock, color: "#f59e0b", bg: "#fffbeb" },
  ];

  return (
    <div className={styles.usersPage} onClick={() => setOpenActionId(null)}>
      <div className={styles.breadcrumb}>
        ADMIN <span>/</span> COMMISSIONS
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Commissions Overview</h1>
        <button className={styles.addBtn} style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
          <Download size={20} /> Export Report
        </button>
      </div>

      {/* Monthly Trends - Rich Aesthetic Addition */}
      <div className={styles.userStatsGrid} style={{ marginBottom: '2rem' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '2rem' }}>
        {/* Monthly View Sidebar Card */}
        <div className={styles.card} style={{ height: 'fit-content', padding: '1.5rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
          <div style={{ fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="#0076ce" /> Monthly History
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {MONTHLY_STATS.map((m) => (
              <div key={m.month} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #eef2f6' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>{m.month}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>{m.total}</div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    color: m.up ? '#10b981' : '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    {m.up ? <TrendingUp size={12} /> : <TrendingUp size={12} style={{ transform: 'rotate(180deg)' }} />}
                    {m.trend}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commissions Table Card */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div className={styles.tabs}>
              {["All Projects", "Sales Only", "Referrals"].map((tab) => (
                <div 
                  key={tab} 
                  className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div className={styles.searchUsers}>
                <SearchIcon size={16} color="#94a3b8" />
                <input type="text" placeholder="Search projects..." className={styles.searchInputSmall} style={{ width: 150 }} />
              </div>
              <div className={styles.filterBtn}>
                <Filter size={18} />
              </div>
            </div>
          </div>

          <div className={styles.userTableContainer}>
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Project Name</th>
                  <th>Agent / Member</th>
                  <th>Comm. Type</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {MOCK_COMMISSIONS.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: "#94a3b8" }}>#{item.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: '#f1f5f9', padding: '0.5rem', borderRadius: '8px' }}>
                          <Briefcase size={16} color="#64748b" />
                        </div>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{item.project}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={14} color="#94a3b8" />
                        <span style={{ fontWeight: 600, color: '#475569' }}>{item.agent}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        background: item.type === 'Sales' ? '#eff6ff' : '#fef3c7',
                        color: item.type === 'Sales' ? '#1d4ed8' : '#854d0e',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '6px',
                        textTransform: 'uppercase'
                      }}>
                        {item.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#1e293b' }}>${item.amount.toLocaleString()}</td>
                    <td style={{ color: '#64748b' }}>{item.date}</td>
                    <td>
                      <div className={styles.statusCell}>
                        <span 
                          className={styles.statusDotActive} 
                          style={{ backgroundColor: item.status === 'Paid' ? '#10b981' : '#f59e0b' }}
                        ></span>
                        <span style={{ 
                          color: item.status === 'Paid' ? '#10b981' : '#f59e0b',
                          fontWeight: 700
                        }}>
                          {item.status}
                        </span>
                      </div>
                    </td>
                    <td style={{ overflow: "visible", position: "relative" }}>
                      <div onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionId(openActionId === item.id ? null : item.id);
                      }}>
                        <MoreVertical size={18} color="#94a3b8" style={{ cursor: "pointer" }} />
                      </div>
                      
                      {openActionId === item.id && (
                        <div className={styles.actionDropdown}>
                          <div className={styles.dropdownItem}>View Details</div>
                          <div className={styles.dropdownItem}>Process Payout</div>
                          <div className={styles.dropdownDivider}></div>
                          <div className={styles.dropdownItem} style={{ color: '#ef4444' }}>Reject</div>
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
              Showing {MOCK_COMMISSIONS.length} entries
            </div>
            <div className={styles.pagination}>
              <div className={styles.pageBtn}><ChevronLeft size={18} /></div>
              <div className={`${styles.pageBtn} ${styles.pageActive}`}>1</div>
              <div className={styles.pageBtn}><ChevronRight size={18} /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
