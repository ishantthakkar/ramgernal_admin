"use client";

import { useState } from "react";
import styles from "../dashboard.module.css";
import {
  DollarSign,
  TrendingUp,
  Search as SearchIcon,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle2,
  Clock,
  User,
  Briefcase,
  X
} from "lucide-react";
import modalStyles from "./commissions-modal.module.css";

interface CommissionDetail {
  date: string;
  name: string;
  amount: string;
  paymentDate: string;
}

interface CommissionRecord {
  id: string;
  customerName: string;
  companyName: string;
  surveyComm: string;
  installationComm: string;
  otherComm: string;
  details: {
    survey: CommissionDetail[];
    installation: CommissionDetail[];
    other: CommissionDetail[];
  };
}

// Mock data for Commissions
const MOCK_COMMISSIONS: CommissionRecord[] = [
  {
    id: "1",
    customerName: "John Doe",
    companyName: "Sunwell Solar",
    surveyComm: "$450.00",
    installationComm: "$1,200.00",
    otherComm: "$50.00",
    details: {
      survey: [
        { date: "2024-04-10", name: "Initial Survey", amount: "$450.00", paymentDate: "2024-04-15" }
      ],
      installation: [
        { date: "2024-04-20", name: "Main Install", amount: "$1,200.00", paymentDate: "2024-04-25" }
      ],
      other: [
        { date: "2024-04-12", name: "Travel Reimbursement", amount: "$50.00", paymentDate: "2024-04-15" }
      ]
    }
  },
  {
    id: "2",
    customerName: "Jane Roe",
    companyName: "Green Energy Co",
    surveyComm: "$320.00",
    installationComm: "$0.00",
    otherComm: "$120.00",
    details: {
      survey: [{ date: "2024-03-25", name: "Roof Survey", amount: "$320.00", paymentDate: "2024-04-01" }],
      installation: [],
      other: [
        { date: "2024-04-01", name: "Referral Bonus", amount: "$100.00", paymentDate: "2024-04-05" },
        { date: "2024-04-05", name: "Site Visit", amount: "$20.00", paymentDate: "2024-04-10" }
      ]
    }
  },
  {
    id: "3",
    customerName: "Marcus Aurelius",
    companyName: "Rome Renewables",
    surveyComm: "$500.00",
    installationComm: "$1,500.00",
    otherComm: "$0.00",
    details: {
      survey: [{ date: "2024-04-01", name: "Tech Survey", amount: "$500.00", paymentDate: "2024-04-10" }],
      installation: [{ date: "2024-04-15", name: "System Install", amount: "$1,500.00", paymentDate: "2024-04-20" }],
      other: []
    }
  },
  {
    id: "4",
    customerName: "Andrew Scoff",
    companyName: "Xelectronics",
    surveyComm: "$280.00",
    installationComm: "$800.00",
    otherComm: "$75.00",
    details: {
      survey: [{ date: "2024-03-15", name: "Survey A", amount: "$280.00", paymentDate: "2024-03-25" }],
      installation: [{ date: "2024-04-05", name: "Install Phase 1", amount: "$800.00", paymentDate: "2024-04-15" }],
      other: [{ date: "2024-03-20", name: "Equipment Handling", amount: "$75.00", paymentDate: "2024-03-25" }]
    }
  },
];


export default function CommissionsPage() {
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<{ type: string, customer: string, data: CommissionDetail[] } | null>(null);

  const stats = [
    { label: "Total Commissions", value: "$45,280", icon: DollarSign, color: "#0076ce", bg: "#e0e7ff" },
    { label: "Paid This Month", value: "$8,450", icon: CheckCircle2, color: "#10b981", bg: "#ecfdf5" },
    { label: "Pending Payouts", value: "$12,320", icon: Clock, color: "#f59e0b", bg: "#fffbeb" },
  ];

  return (
    <div className={styles.usersPage} onClick={() => setOpenActionId(null)}>
      <div className={styles.breadcrumb}>
        ADMIN <span>/</span> COMMISSIONS
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Commissions Overview</h1>
      </div>

      <div className={styles.userStatsGrid} style={{ marginBottom: '2rem' }}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.userStatCard}>
            <div
              className={styles.userStatIcon}
              style={{ backgroundColor: stat.bg, color: stat.color }}
            >
              <stat.icon size={22} />
            </div>
            <div className={styles.userStatValue}>{stat.value}</div>
            <div className={styles.userStatLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Commissions Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
            All Commission records
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div className={styles.searchUsers}>
              <SearchIcon size={16} color="#94a3b8" />
              <input type="text" placeholder="Search projects..." className={styles.searchInputSmall} style={{ width: 300 }} />
            </div>
            <div className={styles.filterBtn}>
              <Filter size={18} />
            </div>
          </div>
        </div>

        <div className={styles.userTableContainer}>
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>Sr number</th>
                <th>Customer Name</th>
                <th>Company Name</th>
                <th>Survey Commission</th>
                <th>Installation Commission</th>
                <th>Other Commissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_COMMISSIONS.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: "#94a3b8" }}>{item.id}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{item.customerName}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#475569' }}>{item.companyName}</span>
                  </td>
                  <td
                    style={{ fontWeight: 700, color: '#10b981', cursor: 'pointer' }}
                    onClick={() => setSelectedDetail({ type: 'Survey Commission', customer: item.customerName, data: item.details.survey })}
                  >
                    {item.surveyComm}
                  </td>
                  <td
                    style={{ fontWeight: 700, color: '#0076ce', cursor: 'pointer' }}
                    onClick={() => setSelectedDetail({ type: 'Installation Commission', customer: item.customerName, data: item.details.installation })}
                  >
                    {item.installationComm}
                  </td>
                  <td
                    style={{ color: '#64748b', cursor: 'pointer' }}
                    onClick={() => setSelectedDetail({ type: 'Other Commissions', customer: item.customerName, data: item.details.other })}
                  >
                    {item.otherComm}
                  </td>
                  <td style={{ overflow: "visible", position: "relative" }}>
                    <div onClick={(e) => {
                      e.stopPropagation();
                      setOpenActionId(openActionId === item.id ? null : item.id);
                    }}>
                      <MoreVertical size={18} color="#94a3b8" style={{ cursor: "pointer" }} />
                    </div>

                    {openActionId === item.id && (
                      <div className={styles.actionDropdown}>
                        <div className={styles.dropdownItem}>View</div>
                        <div className={styles.dropdownDivider}></div>
                        <div className={styles.dropdownItem}>Edit</div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.tableFooter}>
          <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
            Showing {MOCK_COMMISSIONS.length} entries
          </div>
          <div className={styles.pagination}>
            <div className={styles.pageBtn}><ChevronLeft size={18} /></div>
            <div className={`${styles.pageBtn} ${styles.pageActive}`}>1</div>
            <div className={styles.pageBtn}><ChevronRight size={18} /></div>
          </div>
        </div>
      </div>

      {/* Commission Detail Modal */}
      {selectedDetail && (
        <div className={modalStyles.modalOverlay} onClick={() => setSelectedDetail(null)}>
          <div className={modalStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={modalStyles.modalHeader}>
              <div>
                <h3>{selectedDetail.type}</h3>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Customer: <span style={{ fontWeight: 600, color: '#1e293b' }}>{selectedDetail.customer}</span>
                </div>
              </div>
              <button className={modalStyles.closeBtn} onClick={() => setSelectedDetail(null)}>
                <X size={24} />
              </button>
            </div>

            <div className={modalStyles.modalBody}>
              {selectedDetail.data.length === 0 ? (
                <div className={modalStyles.emptyState}>
                  No transaction history found for this category.
                </div>
              ) : (
                <table className={modalStyles.detailTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Reference Name</th>
                      <th>Amount</th>
                      <th>Payment Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDetail.data.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.date}</td>
                        <td style={{ fontWeight: 600 }}>{row.name}</td>
                        <td className={modalStyles.amount}>{row.amount}</td>
                        <td>
                          <span className={`${modalStyles.badge} ${modalStyles.badgeBlue}`}>
                            {row.paymentDate}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
