"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "../../../dashboard.module.css";
import {
  User,
  MapPin,
  ClipboardCheck,
  ShieldCheck,
  Loader2,
  X,
  Calendar,
  Building,
  Phone,
  Mail,
  ArrowLeft,
  Settings,
  Clock,
  Package
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import { canViewModule } from "@/lib/permissions";

export default function ViewServicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<any>(null);

  useEffect(() => {
    if (!canViewModule("Services")) {
      toast.error("You do not have permission to access this module.");
      router.push("/dashboard");
      return;
    }
    fetchServiceDetails();
  }, [id, router]);

  const fetchServiceDetails = async () => {
    try {
      const response = await adminApi.getServiceById(id);
      if (response.success) {
        setService(response.data);
      } else {
        toast.error("Failed to load service details");
        router.push("/services");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load service details");
      router.push("/services");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className="animate-spin" color="#0076ce" />
      </div>
    );
  }

  if (!service) return null;

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/services")}>SERVICES</span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>VIEW SERVICE</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Service Ticket Details</h1>
      </div>

      <div className={styles.formGrid}>
        {/* Customer Information */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <User size={22} color="#0076ce" /> Customer Information
          </div>
          <p className={styles.sectionSubtitle}>Primary identification details for this service ticket.</p>
          
          <div className={styles.formGrid} style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className={styles.formGroup}>
              <label>Name</label>
              <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <User size={16} color="#64748b" />
                  {service.customerId?.name}
                </div>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Mobile Number</label>
              <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Phone size={16} color="#64748b" />
                  {service.customerId?.mobileNumber}
                </div>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Email Address</label>
              <div className={styles.formInput} style={{ background: "#f8fafc", color: "#0076ce", fontWeight: 600, border: "1px solid #e2e8f0", textDecoration: "underline" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Mail size={16} color="#64748b" />
                  {service.customerId?.email || "N/A"}
                </div>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Company</label>
              <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Building size={16} color="#64748b" />
                  {service.customerId?.company}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Address Details */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <MapPin size={22} color="#0076ce" /> Address Details
          </div>
          <p className={styles.sectionSubtitle}>Installation location and site address.</p>

          <div className={styles.formGrid} style={{ gridTemplateColumns: "1fr" }}>
            <div className={styles.formGroup}>
              <label>Full Address</label>
              <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <MapPin size={16} color="#64748b" />
                  {service.customerId?.address?.street || "N/A"}, {service.customerId?.address?.city}, {service.customerId?.address?.state} {service.customerId?.address?.zip}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <ClipboardCheck size={22} color="#0076ce" /> Service Items (Survey Reference)
        </div>
        <p className={styles.sectionSubtitle}>Specific items from the original survey identified for rectification.</p>
        
        <div className={styles.userTableContainer} style={{ marginTop: "1rem" }}>
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>Area</th>
                <th>Type of Fixture</th>
                <th>Original Qty</th>
                <th>To Fix</th>
                <th>Issue Note</th>
              </tr>
            </thead>
            <tbody>
              {service.toFixItems?.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: "#1e293b" }}>{item.area}</td>
                  <td style={{ color: "#0076ce", fontWeight: 500 }}>{item.fixtureType}</td>
                  <td style={{ textAlign: "center", fontWeight: 700, color: "#1e293b" }}>{item.proposedQty}</td>
                  <td style={{ textAlign: "center", fontWeight: 700, color: "#ef4444" }}>{item.toFix}</td>
                  <td style={{ color: "#475569" }}>{item.issueNote || "No notes"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <ShieldCheck size={22} color="#0076ce" /> Assignment & Logistics
        </div>
        <p className={styles.sectionSubtitle}>Assigned contractor and scheduling details.</p>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Assigned Contractor</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <User size={16} color="#64748b" />
                {service.assignedTo?.fullName || "Not Assigned"}
              </div>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Service Date</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Calendar size={16} color="#64748b" />
                {service.serviceDateTime ? new Date(service.serviceDateTime).toLocaleDateString() : "Not Scheduled"}
              </div>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Material Status</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: service.materialDelivered ? "#059669" : "#dc2626", fontWeight: 700, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Package size={16} color={service.materialDelivered ? "#059669" : "#dc2626"} />
                {service.materialDelivered ? "Delivered to Site" : "Pending Delivery"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <Package size={22} color="#0076ce" /> Required Materials
        </div>
        <p className={styles.sectionSubtitle}>List of additional materials required for the service.</p>

        <div className={styles.userTableContainer} style={{ marginTop: "1.5rem" }}>
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>Material Name</th>
                <th style={{ width: "200px", textAlign: "center" }}>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {(!service.materials || service.materials.length === 0) ? (
                <tr>
                  <td colSpan={2} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontStyle: "italic" }}>
                    No specific materials listed.
                  </td>
                </tr>
              ) : (
                service.materials.map((mat: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{mat.name}</td>
                    <td style={{ textAlign: "center", fontWeight: 700, color: "#0076ce" }}>{mat.quantity}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <Clock size={22} color="#0076ce" /> Status & Notes
        </div>
        <p className={styles.sectionSubtitle}>Current progress and additional documentation.</p>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Ticket Status</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: service.status === "Completed" ? "#059669" : "#3b82f6", fontWeight: 700, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Settings size={16} color={service.status === "Completed" ? "#059669" : "#3b82f6"} />
                {service.status}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.formGroup} style={{ marginTop: "1.5rem" }}>
          <label>Service Notes</label>
          <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", minHeight: "100px", whiteSpace: "pre-wrap", border: "1px solid #e2e8f0", padding: "1rem" }}>
            {service.notes || "No additional notes provided."}
          </div>
        </div>
      </section>

      <div className={styles.actionFooter} style={{ background: "#f1f5f9", padding: "2.5rem", borderRadius: "16px", marginTop: "3rem", justifyContent: "flex-end" }}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => router.push("/services")}
          style={{ padding: "0.875rem 3rem", background: "#64748b", color: "#ffffff" }}
        >
          <X size={20} /> Close
        </button>
      </div>
    </div>
  );
}
