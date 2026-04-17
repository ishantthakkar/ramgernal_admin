"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./customer-details.module.css";
import dashboardStyles from "../../dashboard.module.css";
import { 
  Info, 
  FileText, 
  Mail,
  Calendar,
  User 
} from "lucide-react";

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

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
          <h1 className={styles.profileTitle}>Costumer Profile: Jonathan Vance</h1>
          <span className={styles.statusBadge}>IN PROGRESS</span>
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
            <div className={styles.label}>ID</div>
            <div className={styles.value}>#VC-9281</div>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.label}>Company</div>
            <div className={styles.value}>Nexus Grid System</div>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.label}>Created Date</div>
            <div className={styles.value}>04/07/2026</div>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.label}>Salesperson</div>
            <div className={styles.salespersonBox}>
              <Image 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&h=100&auto=format&fit=crop" 
                alt="Sarah Abrrams" 
                width={32} 
                height={32} 
                className={styles.avatarMini}
              />
              <span className={styles.value}>Sarah Abrrams</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Details */}
      <section className={styles.infoSection}>
        <div className={styles.sectionHeading}>
          <div className={`${styles.iconBox} ${styles.iconBoxGrey}`}>
            <FileText size={20} />
          </div>
          Contact Details
        </div>

        <div className={styles.grid}>
          <div className={styles.fieldGroup}>
            <div className={styles.label}>Email Address</div>
            <div className={`${styles.value} ${styles.linkValue}`}>j.vance@vancepower.com</div>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.label}>Mobile Number</div>
            <div className={styles.value}>+1 (555) 012-9938</div>
          </div>
          <div className={styles.fieldGroup} style={{ gridColumn: "span 2" }}>
            <div className={styles.label}>Address</div>
            <div className={styles.value}>8802 Grid Lane, Sector 7, Chicago, IL 60601</div>
          </div>
        </div>
      </section>

      {/* Activities */}
      <section className={styles.infoSection}>
        <div className={styles.sectionHeading}>
          <div className={`${styles.iconBox} ${styles.iconBoxGrey}`}>
            <FileText size={20} />
          </div>
          Activities
        </div>

        <table className={styles.activityTable}>
          <thead>
            <tr>
              <th>Activity Type</th>
              <th>Date</th>
              <th>Outcome</th>
              <th>Next Follow-up Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Call</td>
              <td>04/07/2026</td>
              <td>Showing Interest</td>
              <td>04/09/2026</td>
            </tr>
            <tr>
              <td>Meeting</td>
              <td>04/10/2026</td>
              <td className={styles.outcomeText}>
                xcxcxcxcxcxxxxxcxcxxcxcxcxcxcxcxcxccxssjsncsjdnsjcnsjcnsjcnscjcncsnccscscs
              </td>
              <td>04/09/2026</td>
            </tr>
            <tr>
              <td>Site Visit</td>
              <td>04/10/2026</td>
              <td>Showing Interest</td>
              <td>04/09/2026</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
