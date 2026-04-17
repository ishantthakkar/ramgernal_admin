"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./leads.module.css";
import dashboardStyles from "../dashboard.module.css";
import { 
  Filter, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  MoreVertical,
  Plus,
  Loader2
} from "lucide-react";
import { adminApi } from "@/lib/api";

export default function LeadsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Active Leads");
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getLeads();
      setLeads(response.leads || []);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const stats = [
    { label: "Total", value: leads.length.toString() },
    { label: "New", value: leads.filter(l => l.status === "New").length.toString() },
    { label: "Active", value: leads.filter(l => l.status === "Active" || l.status === "New").length.toString() },
    { label: "In Progress", value: leads.filter(l => l.status === "In Progress").length.toString() },
    { label: "Closed", value: leads.filter(l => l.status === "Closed").length.toString() },
  ];

  // Pagination Logic
  const totalPages = Math.ceil(leads.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeads = leads.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNum: number) => {
    if (pageNum > 0 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  return (
    <div className={styles.leadsPage} onClick={() => setOpenActionId(null)}>
      <div className={dashboardStyles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span> 
        <span style={{ color: "#0076ce" }}>LEADS</span>
      </div>

      <div className={styles.leadsHeader}>
        <h1 className={styles.directoryTitle}>Leads Directory</h1>
        <button className={styles.addBtn} onClick={() => router.push("/leads/add")}>
          <Plus size={20} /> Add Lead
        </button>
      </div>

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
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "4rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", color: "#94a3b8" }}>
                    <Loader2 size={32} className={styles.spinner} />
                    <span style={{ fontWeight: 600 }}>Loading active leads...</span>
                  </div>
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "4rem", color: "#94a3b8", fontWeight: 600 }}>
                  No leads found.
                </td>
              </tr>
            ) : (
              currentLeads.map((lead, idx) => {
                const globalIndex = indexOfFirstItem + idx;
                return (
                  <tr key={lead.id || idx}>
                    <td className={styles.idCell}>#{globalIndex + 1}</td>
                    <td className={styles.nameCell}>{lead.name}</td>
                    <td>{lead.mobileNumber || "N/A"}</td>
                    <td>{lead.company}</td>
                    <td>
                      <div className={styles.statusIndicator}>
                        <div className={lead.status === "Active" || lead.status === "New" ? styles.dotActive : styles.dotDeactivated}></div>
                        {lead.status}
                      </div>
                    </td>
                    <td>{lead.salesPerson}</td>
                    <td>{lead.lastActivity ? new Date(lead.lastActivity).toLocaleDateString() : "N/A"}</td>
                    <td style={{ overflow: "visible", position: "relative" }}>
                      <div onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionId(openActionId === lead.id ? null : lead.id);
                      }}>
                        <MoreVertical size={18} color="#94a3b8" cursor="pointer" />
                      </div>
                      
                      {openActionId === lead.id && (
                        <div className={styles.leadsActionDropdown}>
                          <div 
                            className={styles.leadsDropdownItem}
                            onClick={() => router.push(`/leads/${lead.id}/edit`)}
                          >
                            Edit
                          </div>
                          <div className={styles.leadsDropdownDivider}></div>
                          <div 
                            className={styles.leadsDropdownItem}
                            onClick={() => router.push(`/leads/${lead.id}`)}
                          >
                            View
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className={styles.paginationWrapper}>
          <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, leads.length)} of {leads.length} entries
          </div>
          <div className={dashboardStyles.pagination}>
            <div 
              className={`${dashboardStyles.pageBtn} ${currentPage === 1 ? dashboardStyles.disabled : ""}`}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft size={18} />
            </div>
            
            {[...Array(totalPages)].map((_, i) => (
              <div 
                key={i} 
                className={`${dashboardStyles.pageBtn} ${currentPage === i + 1 ? dashboardStyles.pageActive : ""}`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </div>
            ))}
            
            <div 
              className={`${dashboardStyles.pageBtn} ${currentPage === totalPages ? dashboardStyles.disabled : ""}`}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <ChevronRight size={18} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
