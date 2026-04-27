"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./customer-details.module.css";
import dashboardStyles from "../../dashboard.module.css";
import { 
  Info, 
  FileText, 
  Mail,
  Calendar,
  User,
  Loader2,
  MapPin,
  ClipboardList
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
        <Loader2 size={40} className={dashboardStyles.spinner} style={{ color: "#64748b" }} />
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>
        <h2>Customer not found</h2>
        <button onClick={() => router.push("/customers")} style={{ marginTop: "1rem", color: "#0076ce", cursor: "pointer", background: "none", border: "none", fontWeight: 600 }}>
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className={styles.detailsPage}>
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
      <div className={styles.headerActions}>
        <div className={styles.titleArea}>
          <h1 className={styles.profileTitle}>Customer Profile: {customer.name}</h1>
          <span className={styles.statusBadge}>{customer.status?.toUpperCase() || "PENDING"}</span>
        </div>
      </div>

      {/* Customer Information */}
      <section className={styles.infoSection}>
        <div className={styles.sectionHeading}>
          <div className={styles.iconBox}>
            <Info size={20} />
          </div>
          Customer Information
        </div>

        <div className={styles.grid}>
          <div className={styles.fieldGroup}>
            <div className={styles.label}>Account Number</div>
            <div className={styles.value} style={{ fontWeight: 700, color: "#1e293b" }}>{customer.accountNumber || "N/A"}</div>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.label}>Company</div>
            <div className={styles.value}>{customer.company}</div>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.label}>Converted Date</div>
            <div className={styles.value}>{customer.convertedDate ? new Date(customer.convertedDate).toLocaleDateString() : "N/A"}</div>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.label}>Salesperson</div>
            <div className={styles.salespersonBox}>
              <div className={styles.avatarMini} style={{ 
                background: "#eff6ff", 
                color: "#1d4ed8", 
                width: 32, 
                height: 32, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontWeight: 700, 
                fontSize: "0.75rem",
                borderRadius: "50%"
              }}>
                {customer.salesPerson?.charAt(0) || "S"}
              </div>
              <span className={styles.value}>{customer.salesPerson}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Details */}
      <section className={styles.infoSection}>
        <div className={styles.sectionHeading}>
          <div className={`${styles.iconBox} ${styles.iconBoxGrey}`}>
            <MapPin size={20} />
          </div>
          Contact Details
        </div>

        <div className={styles.grid}>
          <div className={styles.fieldGroup}>
            <div className={styles.label}>Email Address</div>
            <div className={`${styles.value} ${styles.linkValue}`}>{customer.email}</div>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.label}>Mobile Number</div>
            <div className={styles.value}>{customer.mobileNumber}</div>
          </div>
          <div className={styles.fieldGroup} style={{ gridColumn: "span 2" }}>
            <div className={styles.label}>Address</div>
            <div className={styles.value}>
              {customer.address?.street ? `${customer.address.street}, ` : ""}
              {customer.address?.city ? `${customer.address.city}, ` : ""}
              {customer.address?.state ? `${customer.address.state} ` : ""}
              {customer.address?.zip || ""}
            </div>
          </div>
        </div>
      </section>

      {/* Surveys Section */}
      {surveys.length > 0 && (
        <section className={styles.infoSection}>
          <div className={styles.sectionHeading}>
            <div className={`${styles.iconBox} ${styles.iconBoxGrey}`}>
              <ClipboardList size={20} />
            </div>
            Customer Surveys
          </div>

          <table className={styles.activityTable}>
            <thead>
              <tr>
                <th>Area</th>
                <th>Proposed Fixture</th>
                <th>Quantity</th>
                <th>Total Price</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map((survey: any) => (
                <tr key={survey._id}>
                  <td style={{ fontWeight: 600, color: "#1e293b" }}>{survey.area}</td>
                  <td>{survey.proposedFixture}</td>
                  <td>{survey.proposedQuantity}</td>
                  <td style={{ fontWeight: 700 }}>${survey.totalPrice}</td>
                  <td>
                    <span style={{ 
                      padding: "0.25rem 0.75rem", 
                      borderRadius: "20px", 
                      fontSize: "0.75rem", 
                      fontWeight: 700,
                      background: survey.status === "Draft" ? "#f1f5f9" : "#e0f2fe",
                      color: survey.status === "Draft" ? "#64748b" : "#0076ce"
                    }}>
                      {survey.status?.toUpperCase()}
                    </span>
                  </td>
                  <td>{new Date(survey.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
