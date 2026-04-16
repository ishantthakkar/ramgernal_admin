"use client";

import styles from "./dashboard.module.css";
import {
  BarChart3,
  Handshake,
  ClipboardList,
  ShieldCheck,
  Workflow,
  Search,
  MoreVertical,
  UserPlus,
  FileText
} from "lucide-react";

export default function DashboardPage() {
  const largeStats = [
    {
      label: "Total Active Leads",
      value: "1,482",
      icon: BarChart3,
      iconColor: "#0076ce",
      iconBg: "#eff6ff"
    },
    {
      label: "Total Customers",
      value: "429",
      icon: Handshake,
      iconColor: "#854d0e",
      iconBg: "#fef3c7"
    },
  ];

  const smallStats = [
    { label: "Submitted Surveys", value: "24", icon: ClipboardList, color: "#ef4444" },
    { label: "Completed Installations", value: "18", icon: ShieldCheck, color: "#0076ce" },
    { label: "Completed Inspections", value: "64", icon: Workflow, color: "#1e293b" },
    { label: "Active Services", value: "12", icon: Search, color: "#1e293b" },
  ];

  const recentActivities = [
    {
      id: 1,
      type: "lead",
      title: "New Lead Created: ",
      subject: "Andrew Hitchcock",
      meta: "BY SARAH JENKINS • 12 MINS AGO",
      icon: UserPlus,
      iconColor: "#0076ce",
      iconBg: "#eff6ff"
    },
    {
      id: 2,
      type: "survey",
      title: "Survey Submitted: ",
      subject: "Metro Rail Grid Phase 2",
      meta: "BY FIELD UNIT #401 • 45 MINS AGO",
      icon: FileText,
      iconColor: "#b45309",
      iconBg: "#fffbeb"
    }
  ];

  return (
    <div className={styles.dashboardContainer}>
      {/* Overview Section */}
      <section>
        <h2 className={styles.welcomeText} style={{ marginBottom: "2rem" }}>Overview</h2>
        <div className={styles.overviewGrid}>
          {largeStats.map((stat, i) => (
            <div key={i} className={styles.largeCard}>
              <div
                className={styles.largeCardIcon}
                style={{ backgroundColor: stat.iconBg, color: stat.iconColor }}
              >
                <stat.icon size={28} />
              </div>
              <div className={styles.largeCardLabel}>{stat.label}</div>
              <div className={styles.largeCardValue}>{stat.value}</div>
            </div>
          ))}

          <div className={styles.smallStatsGrid}>
            {smallStats.map((stat, i) => (
              <div key={i} className={styles.smallCard}>
                <div className={styles.smallCardIcon} style={{ color: stat.color }}>
                  <stat.icon size={18} />
                </div>
                <div className={styles.smallCardLabel}>{stat.label}</div>
                <div className={styles.smallCardValue}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Activities Section */}
      <section>
        <div className={styles.sectionHeader}>
          <h2 className={styles.welcomeText}>Recent Activities</h2>
          <span className={styles.viewAll}>View All Activity</span>
        </div>

        <div className={styles.activitiesContainer}>
          {recentActivities.map((activity) => (
            <div key={activity.id} className={styles.activityRow}>
              <div className={styles.activityInfo}>
                <div
                  className={styles.activityIcon}
                  style={{ backgroundColor: activity.iconBg, color: activity.iconColor }}
                >
                  <activity.icon size={20} />
                </div>
                <div className={styles.activityText}>
                  <div className={styles.activityMain}>
                    {activity.title} <span>{activity.subject}</span>
                  </div>
                  <div className={styles.activityMeta}>{activity.meta}</div>
                </div>
              </div>
              <MoreVertical size={20} color="#94a3b8" cursor="pointer" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
