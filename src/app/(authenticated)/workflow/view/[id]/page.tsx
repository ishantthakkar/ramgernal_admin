"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "../../../dashboard.module.css";
import {
  User,
  ShieldCheck,
  Loader2,
  Edit2,
  X,
  ClipboardCheck,
  Building,
  Phone,
  Mail,
  MapPin,
  Image as ImageIcon,
  ChevronRight
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";

export default function WorkflowViewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await adminApi.getCustomerWorkflowDetails(id);
        setData(result);
      } catch (err: any) {
        toast.error(err.message || "Failed to load workflow details.");
        router.push("/workflow");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, router]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className={styles.spinner} color="#0076ce" />
      </div>
    );
  }

  if (!data?.customer) return null;

  const { customer, surveys } = data;

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/workflow")}>WORKFLOW</span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>VIEW SURVEY</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Workflow Details</h1>
      </div>

      {/* Customer Information */}
      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <User size={22} color="#0076ce" /> Customer Information
        </div>
        <p className={styles.sectionSubtitle}>Primary contact and company details.</p>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Name</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              {customer.name}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Account Number</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#64748b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              #{customer.accountNumber || "N/A"}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Company</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              {customer.company}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Mobile Number</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              {customer.mobileNumber}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Sales Person</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              {customer.salesPerson}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Current Status</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#0076ce", fontWeight: 700, border: "1px solid #e2e8f0", textTransform: "uppercase" }}>
              {customer.status}
            </div>
          </div>
        </div>
      </div>

      {/* Survey Information */}
      {surveys && surveys.length > 0 ? (
        surveys.map((survey: any, index: number) => (
          <div key={survey._id} className={styles.formSection} style={{ marginTop: "2rem" }}>
            <div className={styles.sectionTitle}>
              <ClipboardCheck size={22} color="#10b981" /> Survey Details {surveys.length > 1 ? `#${index + 1}` : ""}
            </div>
            <p className={styles.sectionSubtitle}>Technical specifications and physical survey data.</p>

            <div className={styles.formGrid} style={{ marginTop: "1.5rem" }}>
              <div className={styles.formGroup}>
                <label>Area / Location</label>
                <div className={styles.formInput} style={{ background: "#f0fdf4", color: "#065f46", fontWeight: 600, border: "1px solid #d1fae5" }}>
                  {survey.area}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Height (Inches)</label>
                <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", border: "1px solid #e2e8f0" }}>
                  {survey.heightInInches}"
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Existing Fixture Type</label>
                <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", border: "1px solid #e2e8f0" }}>
                  {survey.existingFixtureType === "Other" ? survey.otherFixtureType : survey.existingFixtureType}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Proposed Fixture</label>
                <div className={styles.formInput} style={{ background: "#eff6ff", color: "#1e40af", fontWeight: 600, border: "1px solid #dbeafe" }}>
                  {survey.proposedFixture}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Current Bulbs / Qty</label>
                <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", border: "1px solid #e2e8f0" }}>
                  {survey.existingBulbs} bulbs / {survey.existingQuantity} fixtures
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Proposed Quantity</label>
                <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", border: "1px solid #e2e8f0" }}>
                  {survey.proposedQuantity} Units
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Price Per Unit</label>
                <div className={styles.formInput} style={{ background: "#f8fafc", color: "#10b981", fontWeight: 700, border: "1px solid #e2e8f0" }}>
                  ${survey.pricePerUnit}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Total Price</label>
                <div className={styles.formInput} style={{ background: "#059669", color: "#ffffff", fontWeight: 700, border: "none" }}>
                  ${survey.totalPrice}
                </div>
              </div>
            </div>

            {/* Note Section */}
            {survey.note && (
              <div className={styles.formGroup} style={{ marginTop: "1.5rem" }}>
                <label>Survey Notes</label>
                <div className={styles.formInput} style={{ minHeight: "80px", background: "#fffbeb", color: "#92400e", border: "1px solid #fef3c7" }}>
                  {survey.note}
                </div>
              </div>
            )}

            {/* Images Section */}
            {survey.images && survey.images.length > 0 && (
              <div style={{ marginTop: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#64748b", marginBottom: "0.75rem" }}>
                  <ImageIcon size={16} /> Attached Images
                </label>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  {survey.images.map((img: string, idx: number) => (
                    <div key={idx} style={{ position: "relative", width: "120px", height: "120px", borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                      <img src={img} alt={`Survey ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className={styles.formSection} style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ color: "#94a3b8", fontWeight: 500 }}>No survey records found for this customer.</p>
        </div>
      )}

      <div className={styles.actionFooter} style={{ background: "#f1f5f9", padding: "2.5rem", borderRadius: "16px", marginTop: "3rem", justifyContent: "flex-end" }}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => router.push("/workflow")}
          style={{ padding: "0.875rem 3rem", background: "#64748b", color: "#ffffff" }}
        >
          <X size={20} /> Close
        </button>
      </div>
    </div>
  );
}
