"use client";

import { useCallback, useState, useEffect } from "react";
import styles from "./customers.module.css";
import dashboardStyles from "../dashboard.module.css";
import modalStyles from "../workflow/assign-modal.module.css";
import { ChevronLeft, ChevronRight, Search, Loader2, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { mapCustomerRows, type CustomerRow } from "@/lib/mappers/customers";
import { toast } from "react-toastify";

interface SalesManagerOption {
  _id: string;
  fullName?: string;
  userRole?: string;
}

function hasAssignedSalesManager(name: string): boolean {
  const value = name.trim();
  return Boolean(value && value !== "—");
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [targetCustomer, setTargetCustomer] = useState<CustomerRow | null>(null);
  const [availableManagers, setAvailableManagers] = useState<SalesManagerOption[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const canEdit = hasPermission("Customers", "edit");

  const fetchCustomers = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

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
      customer.salesManagerName.toLowerCase().includes(q) ||
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

  const openAssignSalesManagerModal = async (customer: CustomerRow) => {
    setTargetCustomer(customer);
    setShowAssignModal(true);
    setModalLoading(true);
    setAvailableManagers([]);

    try {
      const response = await adminApi.getUserList("Sales Manager");
      const managers = response.users || response.data || response;
      setAvailableManagers(Array.isArray(managers) ? managers : []);
    } catch (err) {
      console.error("Failed to fetch sales managers:", err);
      toast.error("Could not load sales managers.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleAssignSalesManager = async (manager: SalesManagerOption) => {
    if (!targetCustomer) return;

    try {
      setModalLoading(true);
      const response = await adminApi.assignSalesManagerToCustomer(
        targetCustomer.id,
        manager._id
      );

      const managerName = String(response.salesManagerName || manager.fullName || "").trim();
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === targetCustomer.id
            ? { ...customer, salesManagerName: managerName || customer.salesManagerName }
            : customer
        )
      );

      toast.success(response.message || "Sales manager assigned successfully.");
      setShowAssignModal(false);
      setTargetCustomer(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to assign sales manager.";
      toast.error(message);
    } finally {
      setModalLoading(false);
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
              <th>SALES MANAGER</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "4rem" }}>
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
                <td colSpan={8} style={{ textAlign: "center", padding: "4rem", color: "#94a3b8", fontWeight: 600 }}>
                  No customers found.
                </td>
              </tr>
            ) : (
              currentItems.map((customer) => {
                const managerAssigned = hasAssignedSalesManager(customer.salesManagerName);

                return (
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
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                        {managerAssigned ? (
                          <span style={{ fontWeight: 600, color: "#1e293b" }}>
                            {customer.salesManagerName}
                          </span>
                        ) : canEdit ? (
                          <button
                            type="button"
                            className={dashboardStyles.assignBtn}
                            onClick={() => openAssignSalesManagerModal(customer)}
                          >
                            <UserPlus size={14} strokeWidth={2.25} aria-hidden="true" />
                            <span>Assign</span>
                          </button>
                        ) : null}
                      </div>
                    </td>
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
                );
              })
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

      {showAssignModal && (
        <div className={modalStyles.modalOverlay} onClick={() => setShowAssignModal(false)}>
          <div className={modalStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={modalStyles.modalHeader}>
              <h3>Assign Sales Manager</h3>
              <button className={modalStyles.closeBtn} onClick={() => setShowAssignModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className={modalStyles.modalBody}>
              {targetCustomer ? (
                <p style={{ margin: "0 0 1rem", color: "#64748b", fontSize: "0.9rem" }}>
                  Customer: <strong style={{ color: "#1e293b" }}>{targetCustomer.leadName}</strong>
                </p>
              ) : null}

              {modalLoading ? (
                <div className={modalStyles.modalLoading}>
                  <Loader2 size={40} className={modalStyles.spinner} />
                  <p>Fetching available sales managers...</p>
                </div>
              ) : availableManagers.length === 0 ? (
                <div className={modalStyles.emptyState}>
                  <p>No sales managers found in the system.</p>
                </div>
              ) : (
                <div className={modalStyles.staffList}>
                  {availableManagers.map((manager) => (
                    <div key={manager._id} className={modalStyles.staffItem}>
                      <div className={modalStyles.staffLeft}>
                        <div className={modalStyles.staffAvatar}>
                          {manager.fullName?.charAt(0) || "S"}
                        </div>
                        <div className={modalStyles.staffInfo}>
                          <span className={modalStyles.staffName}>{manager.fullName}</span>
                          <span className={modalStyles.staffRole}>
                            {manager.userRole || "Sales Manager"}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={modalStyles.modalAssignBtn}
                        onClick={() => handleAssignSalesManager(manager)}
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
