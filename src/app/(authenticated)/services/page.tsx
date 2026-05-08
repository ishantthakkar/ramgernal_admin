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

const MOCK_SERVICES = [
  {
    _id: "SRV-2024-001",
    customerName: "Andrew Scoff",
    company: "Xelectronics",
    contractor: "Methew Zynd",
    logistics: "Delivered",
    status: "In Progress",
    date: "2024-05-01"
  },
  {
    _id: "SRV-2024-002",
    customerName: "Cliff Booth",
    company: "Starlight Industries",
    contractor: "Sarah Connor",
    logistics: "Pending",
    status: "Assigned",
    date: "2024-04-28"
  },
  {
    _id: "SRV-2024-003",
    customerName: "Halisen Margot",
    company: "Margot & Sons",
    contractor: "Methew Zynd",
    logistics: "Delivered",
    status: "Completed",
    date: "2024-04-25"
  }
];

const MOCK_PREFILL_DATA = {
  customer: {
    name: "Andrew Scoff",
    mobileNumber: "0412 345 678",
    email: "andrew@xelectronics.com",
    leadSource: "Google Search",
    salesPerson: "Jack Hclison",
    createdAt: "2024-01-15T10:00:00Z",
    convertedDate: "2024-02-10T14:30:00Z",
    company: "Xelectronics",
    address: "123 Technology Drive",
    city: "Sydney",
    state: "NSW",
    zipCode: "2000"
  },
  surveys: [
    {
      _id: "srv_1",
      area: "Main Office",
      proposedFixture: "LED Panel 60x60",
      proposedQuantity: 24,
      images: ["https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=200&h=200&auto=format&fit=crop"]
    },
    {
      _id: "srv_2",
      area: "Warehouse",
      proposedFixture: "LED High Bay 150W",
      proposedQuantity: 12,
      images: ["https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=200&h=200&auto=format&fit=crop"]
    }
  ]
};

const MOCK_CONTRACTORS = [
  { _id: "c1", fullName: "Methew Zynd" },
  { _id: "c2", fullName: "Sarah Connor" },
  { _id: "c3", fullName: "Dave Wilson" }
];

export default function ServicesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
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
        setServices(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch services");
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(item =>
    item.ticketId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.customerId?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.assignedTo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredServices.slice(indexOfFirstItem, indexOfLastItem);

  const stats = [
    { label: "Total Services", value: services.length, icon: ClipboardCheck, color: "#0076ce", bg: "#e0e7ff" },
    { label: "In Progress", value: services.filter(s => s.status === "In Progress").length, icon: Settings, color: "#475569", bg: "#f1f5f9" },
    { label: "Completed", value: services.filter(s => s.status === "Completed").length, icon: ShieldCheck, color: "#15803d", bg: "#dcfce7" },
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
                <th>Material</th>
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
                currentItems.map((item, index) => (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 700, color: "#0076ce" }}>{item.ticketId || item._id}</td>
                    <td>
                      <div className={styles.userDetails}>
                        <span
                          className={styles.userNameTable}
                          style={{ color: "#0076ce", fontWeight: 700, cursor: "pointer", textDecoration: "underline", textDecorationColor: "#0076ce" }}
                          onClick={() => router.push(`/services/view/${item._id}`)}
                        >
                          {item.customerId?.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: "#1e293b" }}>{item.customerId?.company}</td>
                    <td style={{ fontWeight: 600, color: "#475569" }}>
                      {item.assignedTo?.fullName || item.customerId?.assignToContractor?.fullName || "Unassigned"}
                    </td>
                    <td>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background: item.materialDelivered ? "#dcfce7" : "#fef3c7",
                        color: item.materialDelivered ? "#15803d" : "#92400e"
                      }}>
                        {item.materialDelivered ? "Delivered" : "Pending"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.statusCell}>
                        <span className={item.status === "Completed" ? styles.statusDotActive : styles.statusDotInactive}
                          style={{ backgroundColor: item.status === "Completed" ? "#10b981" : item.status === "In Progress" ? "#3b82f6" : "#94a3b8" }}></span>
                        {item.status}
                      </div>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "0.85rem" }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className={styles.assignBtn}
                        onClick={() => router.push(`/services/edit/${item._id}`)}
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
