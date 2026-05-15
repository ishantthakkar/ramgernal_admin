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
        <h1 className={styles.welcomeText}>Service Details</h1>
      </div>

      <div className={styles.formGrid}>
        {/* Customer Information */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <User size={22} color="#0076ce" /> Customer Information
          </div>

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
            <MapPin size={22} color="#0076ce" /> Site Address
          </div>

          <div className={styles.formGrid} style={{ gridTemplateColumns: "1fr" }}>
            <div className={styles.formGroup}>
              <label>Address</label>
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
          <ClipboardCheck size={22} color="#0076ce" /> Service Items
        </div>

        <div className={styles.userTableContainer} style={{ marginTop: "1rem" }}>
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>Area</th>
                <th>Fixture</th>
                <th>Qty</th>
                <th>To Fix</th>
                <th>Note</th>
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
          <ShieldCheck size={22} color="#0076ce" /> Contractor
        </div>

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
          {/* <div className={styles.formGroup}>
            <label>Service Date</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Calendar size={16} color="#64748b" />
                {service.serviceDateTime ? new Date(service.serviceDateTime).toLocaleDateString() : "Not Scheduled"}
              </div>
            </div>
          </div> */}
          <div className={styles.formGroup}>
            <label>Material Status</label>
            <div className={styles.formInput} style={{
              background: "#f8fafc",
              color: service.materialDelivered ? "#059669" : "#d97706",
              fontWeight: 600,
              border: "1px solid #e2e8f0",
              letterSpacing: "0.05em",
              fontSize: "0.85rem"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Package size={16} />
                {service.materialDelivered ? "DELIVERED TO SITE" : "PENDING DELIVERY"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <Package size={22} color="#0076ce" /> Required Materials
        </div>

        <div className={styles.userTableContainer} style={{ marginTop: "1.5rem" }}>
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th style={{ width: "60px" }}>No.</th>
                <th>Material Name</th>
                <th style={{ width: "150px", textAlign: "center" }}>Quantity</th>
                <th style={{ width: "200px" }}>Images</th>
              </tr>
            </thead>
            <tbody>
              {(!service.material || service.material.length === 0) ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontStyle: "italic" }}>
                    No specific materials listed.
                  </td>
                </tr>
              ) : (
                service.material.map((mat: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: "#64748b" }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: "#0f172a" }}>{mat.item_name}</td>
                    <td style={{ textAlign: "center", fontWeight: 700, color: "#0076ce" }}>{mat.issued_qty}</td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        {(mat.images || []).map((img: string, i: number) => (
                          <div key={i} style={{ width: "40px", height: "40px", borderRadius: "4px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                            <img src={img} alt="Material" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        ))}
                        {(!mat.images || mat.images.length === 0) && (
                          <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>No images</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <Clock size={22} color="#0076ce" /> Service Notes
        </div>

        <div className={styles.formGroup} style={{ marginTop: "1rem" }}>
          <div className={styles.formInput} style={{ background: "#f8fafc", color: "#0f172a", minHeight: "120px", whiteSpace: "pre-wrap", border: "1px solid #e2e8f0", padding: "1.25rem", fontSize: "1rem", fontWeight: 500, lineHeight: "1.6" }}>
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
