"use client";

import { useState, useEffect } from "react";
import styles from "./customers.module.css";
import { 
  UserPlus, 
  Filter, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import dashboardStyles from "../dashboard.module.css";
import { adminApi } from "@/lib/api";

export default function CustomersPage() {
  const router = useRouter();
  const [activePage, setActivePage] = useState(1);
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        <div className={styles.tableToolbar}>
          <div className={styles.filterBtn}>
            <Filter size={18} />
            Filters
          </div>
          <div className={styles.showingCount}>
            Showing <span>{customers.length}</span> customers
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>sr number</th>
                <th>NAME</th>
                <th>MOBILE NUMBER</th>
                <th>EMAIL</th>
                <th>COMPANY</th>
                <th>STATUS</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer, index) => (
                  <tr key={customer._id || index}>
                    <td className={styles.idCell}>{index + 1}</td>
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
                        setOpenActionId(openActionId === index ? null : index);
                      }}>
                        <MoreVertical size={20} style={{ cursor: "pointer" }} />
                      </div>

                      {openActionId === index && (
                        <div className={styles.actionDropdown}>
                          <div 
                            className={styles.dropdownItem}
                            onClick={() => router.push(`/customers/${customer._id}/edit`)}
                          >
                            Edit
                          </div>
                          <div className={styles.dropdownDivider}></div>
                          <div 
                            className={styles.dropdownItem}
                            onClick={() => router.push(`/customers/${customer._id}`)}
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
            Showing {customers.length} entries
          </div>
          <div className={styles.pagination}>
            <div 
              className={styles.pageNav} 
              style={{ opacity: activePage === 1 ? 0.5 : 1, cursor: activePage === 1 ? "not-allowed" : "pointer" }}
              onClick={() => activePage > 1 && setActivePage(activePage - 1)}
            >
              <ChevronLeft size={18} />
            </div>
            
            <div className={`${styles.pageBtn} ${styles.pageActive}`}>
              {activePage}
            </div>

            <div 
              className={styles.pageNav}
              style={{ opacity: 1, cursor: "pointer" }}
              onClick={() => setActivePage(activePage + 1)}
            >
              <ChevronRight size={18} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
