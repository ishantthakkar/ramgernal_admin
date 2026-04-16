"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./lead-details.module.css";
import dashboardStyles from "../../dashboard.module.css";
import { 
  Info, 
  FileText, 
  RefreshCw, 
  Mail,
  Calendar,
  Layers
} from "lucide-react";

export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  return (
    <div className={styles.detailsPage}>
      <div className={dashboardStyles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span> 
        <span 
          style={{ cursor: "pointer" }} 
          onClick={() => router.push("/leads")}
        >LEADS</span> <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span> 
        <span style={{ color: "#0076ce" }}>LEAD DETAILS</span>
      </div>

      <div className={styles.headerActions}>
        <div className={styles.titleArea}>
          <h1 className={styles.profileTitle}>Lead Profile: Jonathan Vance</h1>
          <span className={styles.statusBadge}>IN PROGRESS</span>
        </div>
        <button className={styles.convertBtn}>
          <RefreshCw size={18} /> Convert to Customer
        </button>
      </div>

      {/* Lead Information */}
      <section className={styles.infoSection}>
        <div className={styles.sectionHeading}>
          <div className={styles.iconBox}>
            <Info size={20} />
          </div>
          Lead Information
        </div>

        <div className={styles.grid}>
          <div className={styles.fieldGroup}>
            <div className={styles.label}>Lead ID</div>
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
            <div className={styles.label}>Lead Source</div>
            <div className={styles.value} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Layers size={18} color="#3b82f6" /> Industry Trade Expo 2024
            </div>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.label}>Salesperson</div>
            <div className={styles.salespersonBox}>
              <Image 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&h=100&auto=format&fit=crop" 
                alt="Sarah" 
                width={28} 
                height={28} 
                className={styles.avatarMini}
              />
              <span className={styles.value} style={{ fontSize: "1rem" }}>Sarah Abrrams</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Details */}
      <section className={styles.infoSection}>
        <div className={styles.sectionHeading}>
          <div className={styles.iconBox}>
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
          <div className={styles.iconBox}>
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
