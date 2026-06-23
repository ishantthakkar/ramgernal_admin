"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../dashboard.module.css";
import {
  Settings,
  Plus,
  Search,
  User,
  MapPin,
  ClipboardCheck,
  Hammer,
  ShieldCheck,
  X,
  ChevronDown,
  Loader2,
  Calendar,
  Building,
  Phone,
  Mail,
  ExternalLink,
  ArrowRight,
  Save as SaveIcon,
  ImageIcon,
  Edit2
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import { canViewModule, hasPermission } from "@/lib/permissions";
import { formatDate } from "@/lib/dateUtils";
import {
  mapServiceRows,
  computeServiceStats,
  type ServiceRow,
} from "@/lib/mappers/services";

export default function ServicesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!canViewModule("Services")) {
      toast.error("You do not have permission to view services.");
      router.push("/dashboard");
      return;
    }
    fetchServices();
  }, [router]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getServices();
      if (response.success) {
        setServices(mapServiceRows(response.data || []));
      } else {
        setServices([]);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch services");
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((item) =>
    item.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.contractorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.statusLabel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredServices.slice(indexOfFirstItem, indexOfLastItem);

  const serviceStats = computeServiceStats(services);
  const stats = [
    { label: "Total Services", value: serviceStats.total, icon: ClipboardCheck, color: "#0076ce", bg: "#e0e7ff" },
    { label: "Assigned", value: serviceStats.assigned, icon: Settings, color: "#64748b", bg: "#f1f5f9" },
    { label: "In Progress", value: serviceStats.inProgress, icon: Settings, color: "#475569", bg: "#f1f5f9" },
    { label: "Completed", value: serviceStats.completed, icon: ShieldCheck, color: "#15803d", bg: "#dcfce7" },
  ];

  return (
    <div className={styles.usersPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>SERVICES</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Services</h1>
        {hasPermission("Services", "create") && (
          <button className={styles.addBtn} onClick={() => router.push("/services/add")}>
            <Plus size={20} /> Add Service
          </button>
        )}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div className={styles.searchUsers}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search tickets..."
                className={styles.searchInputSmall}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: 500 }}>
              Showing {currentItems.length} of {filteredServices.length} tickets
            </div>
          </div>
        </div>

        <div className={styles.userTableContainer}>
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Company</th>
                <th>Contractor</th>
                {/* <th>Material</th> */}
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "4rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", color: "#94a3b8" }}>
                      <Loader2 size={32} className={styles.spinner} />
                      <span style={{ fontWeight: 600 }}>Fetching service tickets...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "4rem", color: "#94a3b8", fontWeight: 600 }}>
                    No service tickets found.
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 700, color: "#0076ce" }}>{item.ticketId}</td>
                    <td>
                      <div className={styles.userDetails}>
                        <span
                          className={styles.userNameTable}
                          style={{ color: "#0076ce", fontWeight: 700, cursor: "pointer", textDecoration: "underline", textDecorationColor: "#0076ce" }}
                          onClick={() => router.push(`/services/view/${item.id}`)}
                        >
                          {item.customerName}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: "#1e293b" }}>{item.company}</td>
                    <td style={{ fontWeight: 600, color: "#475569" }}>
                      {item.contractorName}
                    </td>
                    <td>
                      <div className={styles.statusCell}>
                        <span className={item.status === "Completed" ? styles.statusDotActive : styles.statusDotInactive}
                          style={{ backgroundColor: item.status === "Completed" ? "#10b981" : item.status === "In Progress" ? "#3b82f6" : "#94a3b8" }}></span>
                        {item.statusLabel}
                      </div>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "0.85rem" }}>
                      {formatDate(item.createdAt)}
                    </td>
                    <td>
                      <button
                        className={styles.assignBtn}
                        onClick={() => router.push(`/services/edit/${item.id}`)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.tableFooter}>
          <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredServices.length)} of {filteredServices.length} results
          </div>
          <div className={styles.pagination}>
            <div
              className={`${styles.pageBtn} ${currentPage === 1 ? styles.disabled : ""}`}
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
            >
              <ChevronDown size={18} style={{ transform: "rotate(90deg)" }} />
            </div>

            {[...Array(totalPages)].map((_, i) => (
              <div
                key={i}
                className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.pageActive : ""}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </div>
            ))}

            <div
              className={`${styles.pageBtn} ${currentPage === totalPages ? styles.disabled : ""}`}
              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
            >
              <ChevronDown size={18} style={{ transform: "rotate(-90deg)" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
