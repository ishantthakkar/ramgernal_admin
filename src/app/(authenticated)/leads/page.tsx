"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./leads.module.css";
import dashboardStyles from "../dashboard.module.css";
import {
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Loader2
} from "lucide-react";
import { adminApi } from "@/lib/api";

export default function LeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const validTabs = ["Active Leads", "Lost Lead"];
  const initialTab = validTabs.includes(tabParam || "") ? tabParam! : "Active Leads";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<number | null>(30); // 30 days by default
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

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, dateRange]);

  const filteredLeads = leads.filter(lead => {
    // Search Filter
    const matchesSearch =
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.mobileNumber?.includes(searchQuery) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Date Filter
    if (dateRange) {
      const createdDate = new Date(lead.createdDate || lead.createdAt);
      const diffTime = Math.abs(new Date().getTime() - createdDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > dateRange) return false;
    }

    // Exclude Converted/Closed Leads from both tabs
    if (lead.status === "Converted To Customer" || lead.status === "Closed") return false;

    // Tab Filter
    if (activeTab === "Active Leads") {
      return lead.status !== "Lost Leads";
    }
    return lead.status === "Lost Leads";
  });

  const stats = [
    { label: "Total", value: leads.filter(l => l.status !== "Closed" && l.status !== "Converted To Customer").length.toString() },
    { label: "Active", value: leads.filter(l => l.status === "Active" || l.status === "New").length.toString() },
    { label: "Lost Lead", value: leads.filter(l => l.status === "Lost Leads").length.toString() },
  ];

  // Pagination Logic
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeads = filteredLeads.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNum: number) => {
    if (pageNum > 0 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  return (
    <div className={styles.leadsPage}>
      <div className={dashboardStyles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>LEADS</span>
      </div>

      <div className={styles.leadsHeader}>
        <h1 className={styles.directoryTitle}>Leads Directory</h1>
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
              {["Active Leads", "Lost Lead"].map((tab) => (
                <div
                  key={tab}
                  className={`${dashboardStyles.tab} ${activeTab === tab ? dashboardStyles.tabActive : ""}`}
                  onClick={() => {
                    setActiveTab(tab);
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("tab", tab);
                    router.replace(`/leads?${params.toString()}`, { scroll: false });
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.toolbarRight}>
            <div className={dashboardStyles.searchUsers}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search Leads..."
                className={dashboardStyles.searchInputSmall}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div
              className={styles.dateRangePicker}
              onClick={() => setDateRange(dateRange === 30 ? null : 30)}
              style={{
                cursor: "pointer",
                backgroundColor: dateRange === 30 ? "#e0f2fe" : "white",
                borderColor: dateRange === 30 ? "#0076ce" : "#e2e8f0",
                color: dateRange === 30 ? "#0076ce" : "#64748b"
              }}
            >
              <Calendar size={18} /> {dateRange === 30 ? "Last 30 Days" : "All Time"} <ChevronLeft size={16} style={{ transform: "rotate(-90deg)" }} />
            </div>
          </div>
        </div>

        <table className={styles.leadsTable}>
          <thead>
            <tr>
              <th>S.No</th>
              <th>NAME</th>
              <th>MOBILE NUMBER</th>
              <th>COMPANY</th>
              <th>SALES PERSON</th>
              <th>STATUS</th>
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
            ) : filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "4rem", color: "#94a3b8", fontWeight: 600 }}>
                  No {activeTab.toLowerCase()} found.
                </td>
              </tr>
            ) : (
              currentLeads.map((lead, idx) => {
                const globalIndex = indexOfFirstItem + idx;
                return (
                  <tr key={lead.id || idx}>
                    <td className={styles.idCell}>{globalIndex + 1}</td>
                    <td
                      className={styles.nameCell}
                      style={{ cursor: "pointer", fontWeight: 600, color: "#1e293b", textDecoration: "underline", textDecorationColor: "#94a3b8" }}
                      onClick={() => router.push(`/leads/${lead.id}`)}
                    >
                      {lead.name}
                    </td>
                    <td>{lead.mobileNumber || "N/A"}</td>
                    <td>{lead.company}</td>
                    <td>{lead.salesPerson}</td>
                    <td>
                      <div className={styles.statusIndicator}>
                        <div className={lead.status === "Active" || lead.status === "New" ? styles.dotActive : styles.dotDeactivated}></div>
                        {lead.status}
                      </div>
                    </td>
                    <td>{lead.lastActivity ? new Date(lead.lastActivity).toLocaleDateString() : "N/A"}</td>
                    <td>
                      <button
                        className={dashboardStyles.assignBtn}
                        onClick={() => router.push(`/leads/${lead.id}/edit`)}
                      >
                        Edit
                      </button>
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
            Showing {filteredLeads.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, filteredLeads.length)} of {filteredLeads.length} entries
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
