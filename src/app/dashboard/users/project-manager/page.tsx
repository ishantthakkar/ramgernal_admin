"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "../../dashboard.module.css";
import { 
  Plus, 
  Users, 
  Handshake, 
  Workflow, 
  Filter, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  Search
} from "lucide-react";

export default function ProjectManagerPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Project Manager");
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const summaryStats = [
    { label: "Total Sales Persons", value: "1,284", icon: Users, color: "#0076ce", bg: "#e0e7ff" },
    { label: "Total Contractors", value: "832", icon: Handshake, color: "#475569", bg: "#f1f5f9" },
    { label: "Total Project Managers", value: "20", icon: Workflow, color: "#854d0e", bg: "#fef3c7" },
  ];

  const projectManagers = [
    {
      id: "#VC-92410",
      name: "Andrew Scoff",
      mobile: "+1 235 1254 2214",
      email: "r.mill@gridtech.com",
      company: "Xelectronics",
      pendingInspections: "15",
      completedInspections: "14",
      status: "Active",
      avatar: "AS",
    },
    {
      id: "#VC-92410",
      name: "Cliff Booth",
      mobile: "+1 235 1254 2214",
      email: "s.chen@voltcore.io",
      company: "Xelectronics",
      pendingInspections: "20",
      completedInspections: "19",
      status: "Active",
      avatar: "CB",
    },
    {
      id: "#VC-92410",
      name: "Mark Zyden",
      mobile: "+1 235 1254 2214",
      email: "s.chen@voltcore.io",
      company: "Xelectronics",
      pendingInspections: "24",
      completedInspections: "20",
      status: "Inactive",
      avatar: "MZ",
    },
    {
      id: "#VC-92410",
      name: "Halisen Morgot",
      mobile: "+1 235 1254 2214",
      email: "s.chen@voltcore.io",
      company: "Xelectronics",
      pendingInspections: "22",
      completedInspections: "19",
      status: "Active",
      avatar: "HM",
    },
  ];

  return (
    <div className={styles.usersPage} onClick={() => setOpenActionId(null)}>
      <div className={styles.breadcrumb}>
        ADMIN <span>/</span> USERS
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Users</h1>
        <button className={styles.addBtn} onClick={() => router.push("/dashboard/users/add")}>
          <Plus size={20} /> Add User
        </button>
      </div>

      <div className={styles.userStatsGrid}>
        {summaryStats.map((stat) => (
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
            {["All Users", "Sales Person", "Contractors", "Project Manager"].map((tab) => (
              <div 
                key={tab} 
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === "All Users") router.push("/dashboard/users");
                  if (tab === "Sales Person") router.push("/dashboard/users/sales-person");
                  if (tab === "Contractors") router.push("/dashboard/users/contractors");
                  if (tab === "Project Manager") router.push("/dashboard/users/project-manager");
                }}
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
              <Search size={16} color="#94a3b8" />
              <input type="text" placeholder="Search Users" className={styles.searchInputSmall} />
            </div>
            <div style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: 500 }}>
              Showing 1-10 of 1,284 users
            </div>
          </div>
        </div>

        <div className={styles.userTableContainer}>
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>USER ID</th>
                <th>NAME</th>
                <th>MOBILE NUMBER</th>
                <th>EMAIL</th>
                <th>COMPANY</th>
                <th>PENDING INSPECTIONS</th>
                <th>COMPLETED INSPECTIONS</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {projectManagers.map((manager, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 600, color: "#94a3b8" }}>{manager.id}</td>
                  <td>
                    <div className={styles.userDetails}>
                      <div className={styles.avatar} style={{ width: 36, height: 36, border: 'none', boxShadow: 'none' }}>
                        <div style={{ 
                          background: "#eff6ff", 
                          color: "#1d4ed8", 
                          width: "100%", 
                          height: "100%", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          fontWeight: 700, 
                          fontSize: "0.8rem",
                          borderRadius: "50%"
                        }}>
                          {manager.avatar}
                        </div>
                      </div>
                      <span className={styles.userNameTable} style={{ color: "#1e293b", fontWeight: 600 }}>{manager.name}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 500, color: "#1e293b" }}>{manager.mobile}</td>
                  <td style={{ color: "#64748b" }}>{manager.email}</td>
                  <td style={{ fontWeight: 500, color: "#1e293b" }}>{manager.company}</td>
                  <td style={{ fontWeight: 600, color: "#1e293b" }}>{manager.pendingInspections}</td>
                  <td style={{ fontWeight: 600, color: "#1e293b" }}>{manager.completedInspections}</td>
                  <td>
                    <div className={styles.statusCell}>
                      <span className={manager.status === "Active" ? styles.statusDotActive : styles.statusDotInactive}></span>
                      {manager.status}
                    </div>
                  </td>
                  <td style={{ overflow: "visible" }}>
                    <div onClick={(e) => {
                      e.stopPropagation();
                      setOpenActionId(openActionId === manager.id + index ? null : manager.id + index);
                    }}>
                      <MoreVertical size={18} color="#94a3b8" cursor="pointer" />
                    </div>
                    
                    {openActionId === manager.id + index && (
                      <div className={styles.actionDropdown}>
                        <div className={styles.dropdownItem}>Edit</div>
                        <div className={styles.dropdownDivider}></div>
                        <div className={styles.dropdownItem}>View</div>
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
            Showing 1 to 4 of 1,284 entries
          </div>
          <div className={styles.pagination}>
            <div className={styles.pageBtn}><ChevronLeft size={18} /></div>
            <div className={`${styles.pageBtn} ${styles.pageActive}`}>1</div>
            <div className={styles.pageBtn}>2</div>
            <div className={styles.pageBtn}>3</div>
            <div className={styles.pageBtn}>...</div>
            <div className={styles.pageBtn}>128</div>
            <div className={styles.pageBtn}><ChevronRight size={18} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
