"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dashboardStyles from "../../dashboard.module.css";
import { 
  Info, 
  Loader2,
  MapPin,
  ClipboardList,
  X
} from "lucide-react";
import { adminApi } from "@/lib/api";

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await adminApi.getCustomerWorkflowDetails(id);
        setCustomer(response.customer || null);
        setSurveys(response.surveys || []);
      } catch (err) {
        console.error("Failed to fetch customer details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: "flex", flex: 1, height: "100%", minHeight: "400px", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={48} className={dashboardStyles.spinner} color="#0076ce" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>
        <h2 className={dashboardStyles.welcomeText}>Customer not found</h2>
        <button onClick={() => router.push("/customers")} style={{ marginTop: "1rem", color: "#0076ce", cursor: "pointer", background: "none", border: "none", fontWeight: 600 }}>
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className={dashboardStyles.addUserPage}>
      {/* Breadcrumb */}
      <div className={dashboardStyles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span
          style={{ cursor: "pointer" }}
          onClick={() => router.push("/customers")}
        >CUSTOMERS</span> <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>CUSTOMER DETAILS</span>
      </div>

      {/* Header */}
      <div className={dashboardStyles.pageHeader}>
        <h1 className={dashboardStyles.welcomeText}>Customer Profile: {customer.name}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            fontSize: "0.75rem",
            fontWeight: 700,
            background: customer.status?.toLowerCase() === "verified" ? "#ecfdf5" : "#eff6ff",
            color: customer.status?.toLowerCase() === "verified" ? "#059669" : "#3b82f6",
            border: `1px solid ${customer.status?.toLowerCase() === "verified" ? "#bbf7d0" : "#bfdbfe"}`,
            textTransform: "uppercase"
          }}>
            {customer.status || "PENDING"}
          </span>
        </div>
      </div>

      {/* Customer Information */}
      <div className={dashboardStyles.formSection}>
        <div className={dashboardStyles.sectionTitle}>
          <Info size={22} color="#0076ce" /> Customer Information
        </div>


        <div className={dashboardStyles.formGrid}>
          <div className={dashboardStyles.formGroup}>
            <label>Account Number</label>
            <div className={dashboardStyles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 700, border: "1px solid #e2e8f0" }}>
              {customer.accountNumber || "N/A"}
            </div>
          </div>
          <div className={dashboardStyles.formGroup}>
            <label>Company Name</label>
            <div className={dashboardStyles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              {customer.company || "N/A"}
            </div>
          </div>
          <div className={dashboardStyles.formGroup}>
            <label>Converted Date</label>
            <div className={dashboardStyles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              {customer.convertedDate ? new Date(customer.convertedDate).toLocaleDateString() : "N/A"}
            </div>
          </div>
          <div className={dashboardStyles.formGroup}>
            <label>Salesperson</label>
            <div className={dashboardStyles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{
                background: "#eff6ff",
                color: "#1d4ed8",
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.65rem",
                borderRadius: "50%"
              }}>
                {customer.salesPerson?.charAt(0) || "S"}
              </div>
              {customer.salesPerson || "Unassigned"}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Details */}
      <div className={dashboardStyles.formSection}>
        <div className={dashboardStyles.sectionTitle}>
          <MapPin size={22} color="#0076ce" /> Contact & Address Details
        </div>


        <div className={dashboardStyles.formGrid}>
          <div className={dashboardStyles.formGroup}>
            <label>Email Address</label>
            <div className={dashboardStyles.formInput} style={{ background: "#f8fafc", color: "#0076ce", fontWeight: 600, border: "1px solid #e2e8f0", textDecoration: "underline" }}>
              {customer.email || "N/A"}
            </div>
          </div>
          <div className={dashboardStyles.formGroup}>
            <label>Mobile Number</label>
            <div className={dashboardStyles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              {customer.mobileNumber || "N/A"}
            </div>
          </div>
          <div className={dashboardStyles.formGroup} style={{ gridColumn: "span 2" }}>
            <label>Full Site Address</label>
            <div className={dashboardStyles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0", minHeight: "auto" }}>
              {customer.address?.street ? `${customer.address.street}, ` : ""}
              {customer.address?.city ? `${customer.address.city}, ` : ""}
              {customer.address?.state ? `${customer.address.state} ` : ""}
              {customer.address?.zip || ""}
            </div>
          </div>
        </div>
      </div>

      {/* Surveys Section */}
      {surveys.length > 0 && (
        <div className={dashboardStyles.formSection}>
          <div className={dashboardStyles.sectionTitle}>
            <ClipboardList size={22} color="#0076ce" /> Customer Surveys
          </div>


          <div className={dashboardStyles.userTableContainer} style={{ border: "1px solid #f1f5f9", borderRadius: "12px", overflow: "hidden" }}>
            <table className={dashboardStyles.userTable}>
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Proposed Fixture</th>
                  <th>Quantity</th>
                  <th>Total Price</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {surveys.map((survey: any) => (
                  <tr key={survey._id}>
                    <td style={{ fontWeight: 600, color: "#1e293b" }}>{survey.area}</td>
                    <td style={{ color: "#1e293b" }}>{survey.proposedFixture}</td>
                    <td style={{ fontWeight: 600, color: "#1e293b" }}>{survey.proposedQuantity}</td>
                    <td style={{ fontWeight: 700, color: "#1e293b" }}>${survey.totalPrice}</td>

                    <td style={{ color: "#64748b", fontSize: "0.85rem" }}>
                      {new Date(survey.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className={dashboardStyles.actionFooter} style={{ background: "#f1f5f9", padding: "2.5rem", borderRadius: "16px", marginTop: "3rem", justifyContent: "flex-end", display: "flex" }}>
        <button
          type="button"
          className={dashboardStyles.cancelBtn}
          onClick={() => router.push("/customers")}
          style={{ padding: "0.875rem 3rem", background: "#64748b", color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
        >
          <X size={20} /> Close
        </button>
      </div>
    </div>
  );
}
