"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "../dashboard.module.css";
import { 
  Plus, 
  Users, 
  Handshake, 
  Workflow, 
  Filter, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";

export default function UsersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All Users");
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const summaryStats = [
    { label: "Total Sales Persons", value: "1,284", icon: Users, color: "#0076ce", bg: "#e0e7ff" },
    { label: "Total Contractors", value: "832", icon: Handshake, color: "#475569", bg: "#f1f5f9" },
    { label: "Total Project Managers", value: "20", icon: Workflow, color: "#854d0e", bg: "#fef3c7" },
  ];

  const users = [
    {
      id: "#VC-92410",
      name: "Robert Millhouse",
      role: "SALESPERSON",
      mobile: "+1 235 1254 2214",
      status: "Active",
      email: "r.mill@gridtech.com",
      avatar: "RM",
      badgeClass: styles.badgeBlue,
    },
    {
      id: "#VC-92411",
      name: "Sarah Chen",
      role: "SALESPERSON",
      mobile: "+1 235 1254 2214",
      status: "Active",
      email: "s.chen@voltcore.io",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&h=100&auto=format&fit=crop",
      badgeClass: styles.badgeOrange,
    },
    {
      id: "#VC-92415",
      name: "David Abrahams",
      role: "CONTRACTOR",
      mobile: "+1 235 1254 2214",
      status: "Deactivated",
      email: "david.a@independent.net",
      avatar: "DA",
      badgeClass: styles.badgeSlate,
    },
    {
      id: "#VC-92420",
      name: "Marcus Aurelius",
      role: "PROJECT MANAGER",
      mobile: "+1 235 1254 2214",
      status: "Active",
      email: "m.aurelius@gridtech.com",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&h=100&auto=format&fit=crop",
      badgeClass: styles.badgeBlue,
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
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div className={styles.filterBtn}>
              <Filter size={18} /> Filters
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
                <th>User ID</th>
                <th>User Details</th>
                <th>Role</th>
                <th>Mobile Number</th>
                <th>Status</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600, color: "#94a3b8" }}>{user.id}</td>
                  <td>
                    <div className={styles.userDetails}>
                      <div className={styles.avatar} style={{ width: 36, height: 36, border: 'none', boxShadow: 'none' }}>
                        {user.avatar.startsWith("http") ? (
                          <Image 
                            src={user.avatar} 
                            alt={user.name} 
                            width={36} 
                            height={36} 
                            className={styles.avatarImg}
                          />
                        ) : (
                          <div style={{ 
                            background: "#eff6ff", 
                            color: "#1d4ed8", 
                            width: "100%", 
                            height: "100%", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            fontWeight: 700, 
                            fontSize: "0.8rem" 
                          }}>
                            {user.avatar}
                          </div>
                        )}
                      </div>
                      <span className={styles.userNameTable}>{user.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.roleBadge} ${user.badgeClass}`}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{user.mobile}</td>
                  <td>
                    <div className={styles.statusCell}>
                      <span className={user.status === "Active" ? styles.statusDotActive : styles.statusDotInactive}></span>
                      {user.status}
                    </div>
                  </td>
                  <td style={{ color: "#64748b" }}>{user.email}</td>
                  <td style={{ overflow: "visible" }}>
                    <div onClick={(e) => {
                      e.stopPropagation();
                      setOpenActionId(openActionId === user.id ? null : user.id);
                    }}>
                      <MoreVertical size={18} color="#94a3b8" cursor="pointer" />
                    </div>
                    
                    {openActionId === user.id && (
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
