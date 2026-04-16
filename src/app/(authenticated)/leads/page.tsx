"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./leads.module.css";
import dashboardStyles from "../dashboard.module.css";
import { 
  Filter, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  MoreVertical
} from "lucide-react";

export default function LeadsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Active Leads");
  const [openActionId, setOpenActionId] = useState<number | null>(null);

  const stats = [
    { label: "Total", value: "1,284" },
    { label: "New", value: "42" },
    { label: "In Progress", value: "156" },
    { label: "Converted", value: "200" },
    { label: "Closed", value: "156" },
  ];

  const leads = [
    { id: "#VC-9281", name: "Robert Millhouse", mobile: "+1 235 1254 2214", company: "Nexus Grid Systems", status: "Active", salesPerson: "Jay Desai", lastActivity: "2h ago" },
    { id: "#VC-9282", name: "Sarah Chen", mobile: "+1 235 1254 2214", company: "Nexus Grid Systems", status: "Active", salesPerson: "Jay Desai", lastActivity: "2h ago" },
    { id: "#VC-9283", name: "David Abrahams", mobile: "+1 235 1254 2214", company: "Nexus Grid Systems", status: "Deactivated", salesPerson: "Jay Desai", lastActivity: "2h ago" },
    { id: "#VC-9284", name: "Marcus Aurelius", mobile: "+1 235 1254 2214", company: "Nexus Grid Systems", status: "Active", salesPerson: "Jay Desai", lastActivity: "2h ago" },
  ];

  return (
    <div className={styles.leadsPage} onClick={() => setOpenActionId(null)}>
      <div className={dashboardStyles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span> 
        <span style={{ color: "#0076ce" }}>LEADS</span>
      </div>

      <h1 className={styles.directoryTitle}>Leads Directory</h1>

      {/* Stats Grid */}
      <div className={styles.leadsStatsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.leadsStatCard}>
            <div className={styles.leadsStatLabel}>{stat.label}</div>
            <div className={styles.leadsStatValue}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className={styles.leadsTableContainer}>
        <div className={styles.tableToolbar}>
          <div className={styles.toolbarLeft}>
            <div className={dashboardStyles.tabs}>
              {["Active Leads", "Closed"].map((tab) => (
                <div 
                  key={tab} 
                  className={`${dashboardStyles.tab} ${activeTab === tab ? dashboardStyles.tabActive : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </div>
              ))}
            </div>
            <div className={dashboardStyles.filterBtn}>
              <Filter size={18} /> Filters
            </div>
          </div>
          
          <div className={styles.toolbarRight}>
            <div className={styles.dateRangePicker}>
              <Calendar size={18} /> Last 30 Days <ChevronLeft size={16} style={{ transform: "rotate(-90deg)" }} />
            </div>
          </div>
        </div>

        <table className={styles.leadsTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>NAME</th>
              <th>MOBILE NUMBER</th>
              <th>COMPANY</th>
              <th>STATUS</th>
              <th>SALES PERSON</th>
              <th>LAST ACTIVITY</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, idx) => (
              <tr key={idx}>
                <td className={styles.idCell}>{lead.id}</td>
                <td className={styles.nameCell}>{lead.name}</td>
                <td>{lead.mobile}</td>
                <td>{lead.company}</td>
                <td>
                  <div className={styles.statusIndicator}>
                    <div className={lead.status === "Active" ? styles.dotActive : styles.dotDeactivated}></div>
                    {lead.status}
                  </div>
                </td>
                <td>{lead.salesPerson}</td>
                <td>{lead.lastActivity}</td>
                <td style={{ overflow: "visible", position: "relative" }}>
                  <div onClick={(e) => {
                    e.stopPropagation();
                    setOpenActionId(openActionId === idx ? null : idx);
                  }}>
                    <MoreVertical size={18} color="#94a3b8" cursor="pointer" />
                  </div>
                  
                  {openActionId === idx && (
                    <div className={styles.leadsActionDropdown}>
                      <div 
                        className={styles.leadsDropdownItem}
                        onClick={() => router.push(`/leads/${lead.id.replace('#', '')}/edit`)}
                      >
                        Edit
                      </div>
                      <div className={styles.leadsDropdownDivider}></div>
                      <div 
                        className={styles.leadsDropdownItem}
                        onClick={() => router.push(`/leads/${lead.id.replace('#', '')}`)}
                      >
                        View
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className={styles.paginationWrapper}>
          <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
            Showing 1 to 4 of 1,284 entries
          </div>
          <div className={dashboardStyles.pagination}>
            <div className={dashboardStyles.pageBtn}><ChevronLeft size={18} /></div>
            <div className={`${dashboardStyles.pageBtn} ${dashboardStyles.pageActive}`}>1</div>
            <div className={dashboardStyles.pageBtn}>2</div>
            <div className={dashboardStyles.pageBtn}>3</div>
            <div className={dashboardStyles.pageBtn}>...</div>
            <div className={dashboardStyles.pageBtn}>128</div>
            <div className={dashboardStyles.pageBtn}><ChevronRight size={18} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
