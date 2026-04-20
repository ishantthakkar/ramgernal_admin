"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import styles from "./workflow-details.module.css";
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  ClipboardCheck, 
  DollarSign, 
  FileText, 
  MessageSquare,
  Clock,
  Phone,
  Mail,
  Zap,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  Maximize2,
  MoreVertical
} from "lucide-react";

// Mock data based on user requirements
const MOCK_DATA = {
  id: "SRV-2024-8842",
  customer: {
    name: "Johnathan Doe",
    mobile: "+1 (555) 123-4567",
    email: "j.doe@example.com",
    leadSource: "Google Search",
    salesPerson: "Alice Smith",
    createdDate: "2024-03-15",
    convertedDate: "2024-04-01"
  },
  address: {
    company: "Industrial Solar Solutions",
    street: "123 Energy Way, Suite 400",
    city: "Springfield",
    state: "IL",
    zip: "62704"
  },
  survey: {
    status: "Completed",
    surveyDate: "2024-04-10",
    siteDetails: [
      {
        area: "Main Warehouse",
        height: "12m",
        existingFixture: "High Bay Halogen",
        existingBulbs: "400W MH",
        existingQty: 45,
        proposedFixture: "VP-LED-200W",
        proposedQty: 42,
        pricePerUnit: 185.00,
        totalPrice: 7770.00,
        note: "Requires scissor lift for installation",
        media: ["https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=200&h=200&auto=format&fit=crop"]
      },
      {
        area: "Loading Dock",
        height: "6m",
        existingFixture: "Fluorescent Tube",
        existingBulbs: "2x36W T8",
        existingQty: 12,
        proposedFixture: "Dock-LED-WP-40",
        proposedQty: 12,
        pricePerUnit: 120.00,
        totalPrice: 1440.00,
        note: "Replace brackets if rusted",
        media: ["https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?q=80&w=200&h=200&auto=format&fit=crop"]
      }
    ],
    surveyNotes: [
      { timestamp: "2024-04-10 14:30", note: "Initial site assessment completed. Access granted to all areas." },
      { timestamp: "2024-04-11 09:15", note: "Customer requested additional focus on the loading dock area." }
    ],
    generalNotes: "Client is interested in expanding the project to their Phase 2 facility later this year."
  },
  commissions: [
    { date: "2024-04-15", name: "Alice Smith (Sales)", amount: 450.00, paymentDate: "2024-04-20" },
    { date: "2024-04-15", name: "Bob Johnson (Referral)", amount: 150.00, paymentDate: null }
  ]
};

export default function SurveyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState(MOCK_DATA);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed": return { color: "#10b981", bg: "#ecfdf5" };
      case "verified": return { color: "#0076ce", bg: "#eff6ff" };
      case "in progress": return { color: "#f59e0b", bg: "#fffbeb" };
      case "reopened": return { color: "#ef4444", bg: "#fef2f2" };
      default: return { color: "#64748b", bg: "#f8fafc" };
    }
  };

  const statusStyle = getStatusColor(data.survey.status);

  return (
    <div className={styles.container}>
      {/* Breadcrumbs & Navigation */}
      <div className={styles.breadcrumb}>
        <span onClick={() => router.push("/workflow")} style={{ cursor: 'pointer' }}>WORKFLOW</span>
        <span>/</span>
        <span style={{ color: "#0076ce" }}>SURVEY DETAILS</span>
      </div>

      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.title}>
            Survey Details <span className={styles.idBadge}>#{data.id}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>
            <Calendar size={14} />
            <span>Last Updated: April 18, 2024</span>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Left Column - Customer & Address */}
        <div className={styles.infoColumn}>
          <section className={styles.card} style={{ marginBottom: '2rem' }}>
            <div className={styles.cardHeader}>
              <User size={20} color="#0076ce" />
              <h2 className={styles.cardTitle}>Customer Information</h2>
            </div>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Full Name</span>
                <span className={styles.infoValue}>{data.customer.name}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Mobile</span>
                  <span className={styles.infoValue}><Phone size={14} color="#94a3b8" /> {data.customer.mobile}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Email</span>
                  <span className={styles.infoValue}><Mail size={14} color="#94a3b8" /> {data.customer.email}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Lead Source</span>
                <span className={styles.infoValue}>{data.customer.leadSource}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Sales Person</span>
                <span className={styles.infoValue}><Zap size={14} color="#f59e0b" /> {data.customer.salesPerson}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Created Date</span>
                  <span className={styles.infoValue}>{data.customer.createdDate}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Converted Date</span>
                  <span className={styles.infoValue}>{data.customer.convertedDate}</span>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <MapPin size={20} color="#0076ce" />
              <h2 className={styles.cardTitle}>Property Address</h2>
            </div>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Company</span>
                <span className={styles.infoValue}><Building2 size={14} color="#94a3b8" /> {data.address.company}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Street Address</span>
                <span className={styles.infoValue}>{data.address.street}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>City / State</span>
                  <span className={styles.infoValue}>{data.address.city}, {data.address.state}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>ZIP Code</span>
                  <span className={styles.infoValue}>{data.address.zip}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column - Survey Settings & Timeline */}
        <div className={styles.surveyColumn}>
          <section className={styles.card} style={{ marginBottom: '2rem' }}>
            <div className={styles.cardHeader}>
              <ClipboardCheck size={20} color="#0076ce" />
              <h2 className={styles.cardTitle}>Survey Assessment</h2>
            </div>
            <div className={styles.infoList}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Current Status</span>
                  <div>
                    <span 
                      className={styles.statusBadge} 
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusStyle.color }}></span>
                      {data.survey.status}
                    </span>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Survey Date</span>
                  <span className={styles.infoValue}><Calendar size={14} color="#94a3b8" /> {data.survey.surveyDate}</span>
                </div>
              </div>
              
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>General Survey Notes</span>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', color: '#475569', borderLeft: '3px solid #e2e8f0' }}>
                  {data.survey.generalNotes}
                </div>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <MessageSquare size={20} color="#0076ce" />
              <h2 className={styles.cardTitle}>Timestamps & Activity</h2>
            </div>
            <div className={styles.notesTimeline}>
              {data.survey.surveyNotes.map((note, idx) => (
                <div key={idx} className={styles.noteItem}>
                  <div className={styles.noteTime}>{note.timestamp}</div>
                  <div className={styles.noteText}>{note.note}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Site Details Table */}
      <section className={styles.tableSection}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Layers size={22} color="#0076ce" />
          <h2 className={styles.cardTitle} style={{ margin: 0 }}>Site Fixture Details</h2>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Area / Zone</th>
                <th>Height</th>
                <th>Existing (Type / Bulk / Qty)</th>
                <th>Proposed (Type / Qty)</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Media</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.survey.siteDetails.map((site, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{site.area}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>{site.note}</div>
                  </td>
                  <td><span className={styles.idBadge}>{site.height}</span></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{site.existingFixture}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{site.existingBulbs} • Qty: {site.existingQty}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0076ce' }}>{site.proposedFixture}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Qty: {site.proposedQty}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>${site.pricePerUnit.toFixed(2)}</td>
                  <td style={{ fontWeight: 700, color: '#1e293b' }}>${site.totalPrice.toFixed(2)}</td>
                  <td>
                    <div className={styles.imageGrid}>
                      {site.media.map((url, midx) => (
                        <Image key={midx} src={url} alt="Site" width={40} height={40} className={styles.imageThumb} />
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ cursor: 'pointer', color: '#94a3b8' }}><Maximize2 size={18} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Commissions Section */}
      <section className={styles.tableSection} style={{ marginTop: '3rem', marginBottom: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <DollarSign size={22} color="#10b981" />
            <h2 className={styles.cardTitle} style={{ margin: 0 }}>Agent Commissions</h2>
          </div>
          <button className={styles.editBtn} style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
            <CheckCircle2 size={16} /> Add Commission
          </button>
        </div>
        <div className={styles.commissionGrid}>
          {data.commissions.map((comm, idx) => (
            <div key={idx} className={styles.commissionCard}>
              <div className={styles.infoLabel}>Commission Date: {comm.date}</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.25rem' }}>{comm.name}</div>
              <div className={styles.commAmount}>${comm.amount.toFixed(2)}</div>
              <div className={styles.commMeta}>
                <div>
                  <div className={styles.infoLabel}>Status</div>
                  <div style={{ color: comm.paymentDate ? '#10b981' : '#f59e0b', fontWeight: 700, fontSize: '0.75rem' }}>
                    {comm.paymentDate ? 'PAID' : 'PENDING'}
                  </div>
                </div>
                {comm.paymentDate && (
                  <div>
                    <div className={styles.infoLabel}>Payment Date</div>
                    <div style={{ fontWeight: 600 }}>{comm.paymentDate}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
