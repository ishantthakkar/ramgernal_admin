"use client";

import { useState, useEffect } from "react";
import styles from "./customers.module.css";
import { 
  UserPlus, 
  Filter, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import dashboardStyles from "../dashboard.module.css";
import { adminApi } from "@/lib/api";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await adminApi.getCustomers();
        const data = response.customers || response.data || response;
        setCustomers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch customers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  // Search Logic
  const filteredCustomers = customers.filter(customer => 
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.mobileNumber?.includes(searchQuery) ||
    customer.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flex: 1, minHeight: "400px", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={40} className={dashboardStyles.spinner} style={{ color: "#64748b" }} />
      </div>
    );
  }

  return (
    <div className={styles.customersPage} onClick={() => setOpenActionId(null)}>
      <div className={dashboardStyles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span> 
        <span style={{ color: "#0076ce" }}>CUSTOMERS</span>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Customers</h1>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        {/* Toolbar */}
        <div className={styles.tableToolbar} style={{ justifyContent: "space-between", display: "flex", alignItems: "center" }}>
          <div className={styles.showingCount}>
            Showing <span>{currentItems.length}</span> of {filteredCustomers.length} customers
          </div>
          <div className={dashboardStyles.searchUsers}>
            <Search size={16} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Search Customers..." 
              className={dashboardStyles.searchInputSmall} 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>sr number</th>
                <th>AC NUMBER</th>
                <th>NAME</th>
                <th>MOBILE NUMBER</th>
                <th>EMAIL</th>
                <th>COMPANY</th>
                <th>STATUS</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                currentItems.map((customer, index) => (
                  <tr key={customer.id || customer._id || index}>
                    <td className={styles.idCell}>{indexOfFirstItem + index + 1}</td>
                    <td style={{ fontWeight: 600 }}>{customer.accountNumber || "N/A"}</td>
                    <td className={styles.nameCell}>{customer.name}</td>
                    <td>{customer.mobileNumber || "N/A"}</td>
                    <td>{customer.email}</td>
                    <td>{customer.company}</td>
                    <td>
                      <div className={styles.statusIndicator}>
                        <div className={customer.status?.toLowerCase() === "active" ? styles.dotActive : styles.dotDeactivated}></div>
                        {customer.status || "N/A"}
                      </div>
                    </td>
                    <td className={styles.actionsCell} style={{ textAlign: "right", position: "relative", overflow: "visible" }}>
                      <div onClick={(e) => {
                        e.stopPropagation();
                        const cid = customer.id || customer._id;
                        setOpenActionId(openActionId === cid ? null : cid);
                      }}>
                        <MoreVertical size={20} style={{ cursor: "pointer" }} />
                      </div>

                      {(openActionId === customer.id || openActionId === customer._id) && (
                        <div className={styles.actionDropdown}>
                          <div 
                            className={styles.dropdownItem}
                            onClick={() => router.push(`/customers/${customer.id || customer._id}/edit`)}
                          >
                            Edit
                          </div>
                          <div className={styles.dropdownDivider}></div>
                          <div 
                            className={styles.dropdownItem}
                            onClick={() => router.push(`/customers/${customer.id || customer._id}`)}
                          >
                            View
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className={styles.tableFooter}>
          <div className={styles.entriesInfo}>
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCustomers.length)} of {filteredCustomers.length} entries
          </div>
          <div className={styles.pagination}>
            <div 
              className={`${styles.pageNav} ${currentPage === 1 ? styles.disabled : ""}`} 
              onClick={() => handlePageChange(currentPage - 1)}
              style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
            >
              <ChevronLeft size={18} />
            </div>
            
            {[...Array(totalPages)].map((_, i) => (
              <div 
                key={i} 
                className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.pageActive : ""}`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </div>
            ))}

            <div 
              className={`${styles.pageNav} ${currentPage === totalPages ? styles.disabled : ""}`}
              onClick={() => handlePageChange(currentPage + 1)}
              style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
            >
              <ChevronRight size={18} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
