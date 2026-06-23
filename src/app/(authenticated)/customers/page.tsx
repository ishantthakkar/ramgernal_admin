"use client";

import { useState, useEffect } from "react";
import styles from "./customers.module.css";
import dashboardStyles from "../dashboard.module.css";
import { ChevronLeft, ChevronRight, Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { mapCustomerRows, type CustomerRow } from "@/lib/mappers/customers";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const canEdit = hasPermission("Customers", "edit");

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const response = await adminApi.getCustomers();
        const raw = response.customers || response.data || response;
        setCustomers(mapCustomerRows(Array.isArray(raw) ? raw : []));
      } catch (err) {
        console.error("Failed to fetch customers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const q = searchQuery.toLowerCase();
    return (
      customer.leadId.toLowerCase().includes(q) ||
      customer.leadName.toLowerCase().includes(q) ||
      customer.email.toLowerCase().includes(q) ||
      customer.mobileNumber.includes(searchQuery) ||
      customer.accountNumber.toLowerCase().includes(q) ||
      customer.dba.toLowerCase().includes(q) ||
      customer.salesPersonName.toLowerCase().includes(q) ||
      customer.statusLabel.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNum: number) => {
    if (pageNum > 0 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  return (
    <div className={styles.customersPage}>
      <div className={dashboardStyles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={dashboardStyles.breadcrumbCurrent}>CUSTOMERS</span>
      </div>

      <div className={dashboardStyles.pageHeader}>
        <h1 className={dashboardStyles.welcomeText}>Customers</h1>
      </div>

      <div className={dashboardStyles.tableCard}>
        <div className={dashboardStyles.tableHeader}>
          <div className={styles.toolbarRight} style={{ marginLeft: "auto" }}>
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
        </div>

        <table className={dashboardStyles.userTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>LEAD NAME</th>
              <th>AC NUMBER</th>
              <th>MOBILE NUMBER</th>
              <th>EMAIL</th>
              <th>DBA</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "4rem" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "1rem",
                      color: "#94a3b8",
                    }}
                  >
                    <Loader2 size={32} className={styles.spinner} />
                    <span style={{ fontWeight: 600 }}>Loading customers...</span>
                  </div>
                </td>
              </tr>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "4rem", color: "#94a3b8", fontWeight: 600 }}>
                  No customers found.
                </td>
              </tr>
            ) : (
              currentItems.map((customer) => (
                  <tr key={customer.id}>
                    <td style={{ fontWeight: 600, color: "#94a3b8" }}>{customer.leadId || "—"}</td>
                    <td
                      style={{
                        cursor: "pointer",
                        fontWeight: 700,
                        color: "var(--admin-primary, #004d4d)",
                        textDecoration: "underline",
                        textDecorationColor: "var(--admin-primary, #004d4d)",
                      }}
                      onClick={() => router.push(`/customers/${customer.id}`)}
                    >
                      {customer.leadName || "—"}
                    </td>
                    <td style={{ fontWeight: 500, color: "#1e293b" }}>{customer.accountNumber}</td>
                    <td style={{ fontWeight: 500, color: "#1e293b" }}>{customer.mobileNumber}</td>
                    <td style={{ color: "#64748b" }}>{customer.email}</td>
                    <td>{customer.dba}</td>
                    <td>
                      {canEdit && (
                        <button
                          type="button"
                          className={dashboardStyles.assignBtn}
                          onClick={() => router.push(`/customers/${customer.id}/edit`)}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>

        <div className={dashboardStyles.tableFooter}>
          <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
            Showing {filteredCustomers.length > 0 ? indexOfFirstItem + 1 : 0} to{" "}
            {Math.min(indexOfLastItem, filteredCustomers.length)} of {filteredCustomers.length} results
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
