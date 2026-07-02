"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../dashboard.module.css";
import { adminApi } from "@/lib/api";
import { formatDateTime } from "@/lib/dateUtils";
import {
  BarChart3,
  Handshake,
  ClipboardList,
  ShieldCheck,
  Workflow,
  Search,
  MoreVertical,
  UserPlus,
  FileText,
  Loader2,
  Receipt,
  Wallet,
  Settings,
  User,
} from "lucide-react";
import { toast } from "react-toastify";
import { canViewModule } from "@/lib/permissions";
import { mapDashboardStats, type DashboardStats } from "@/lib/mappers/dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canViewModule("Dashboard")) {
      toast.error("You do not have permission to view the dashboard.");
      router.push("/users");
      return;
    }

    const fetchStats = async () => {
      try {
        const data = await adminApi.getDashboardStats();
        setStats(mapDashboardStats(data));
      } catch (error: any) {
        toast.error(error.message || "Failed to fetch dashboard stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 className="animate-spin" size={48} color="#004d4d" />
      </div>
    );
  }

  const largeStats = [
    {
      label: "Total Active Leads",
      value: stats?.totalActiveLeads?.toLocaleString() || "0",
      icon: BarChart3,
      iconColor: "#1d4ed8",
      iconBg: "#dbeafe"
    },
    {
      label: "Total Customers",
      value: stats?.totalCustomers?.toLocaleString() || "0",
      icon: Handshake,
      iconColor: "#b45309",
      iconBg: "#fef3c7"
    },
  ];

  const smallStats = [
    { label: "Submitted Surveys", value: stats?.submittedSurveys?.toLocaleString() || "0", icon: ClipboardList, color: "#ef4444" },
    { label: "Completed Installations", value: stats?.completedInstallations?.toLocaleString() || "0", icon: ShieldCheck, color: "#0076ce" },
    { label: "Completed Inspections", value: stats?.completedInspections?.toLocaleString() || "0", icon: Workflow, color: "#1e293b" },
    { label: "Active Services", value: stats?.activeServices?.toLocaleString() || "0", icon: Search, color: "#1e293b" },
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
          <span className={styles.viewAll} onClick={() => router.push('/audit')} style={{ cursor: 'pointer' }}>View All Activity</span>
        </div>

        <div className={styles.activitiesContainer}>
          {stats?.activityLog && stats.activityLog.length > 0 ? (
            stats.activityLog.slice(0, 5).map((activity: any, index: number) => {
              // Helper to get icon and color based on recordType
              const getLogDisplay = (type: string) => {
                switch (type?.toLowerCase()) {
                  case 'lead': return { icon: UserPlus, color: "#3b82f6", bg: "#eff6ff" };
                  case 'customer': return { icon: Handshake, color: "#10b981", bg: "#ecfdf5" };
                  case 'survey': return { icon: FileText, color: "#f59e0b", bg: "#fffbeb" };
                  case 'assignment': return { icon: ClipboardList, color: "#8b5cf6", bg: "#f5f3ff" };
                  case 'quotation': return { icon: FileText, color: "#6366f1", bg: "#eef2ff" };
                  case 'invoice': return { icon: Receipt, color: "#0ea5e9", bg: "#f0f9ff" };
                  case 'payables': return { icon: Wallet, color: "#14b8a6", bg: "#ecfdf5" };
                  case 'installation': return { icon: Settings, color: "#f97316", bg: "#fff7ed" };
                  case 'inspection': return { icon: Search, color: "#a855f7", bg: "#faf5ff" };
                  case 'user': return { icon: User, color: "#64748b", bg: "#f1f5f9" };
                  case 'role': return { icon: ShieldCheck, color: "#475569", bg: "#f8fafc" };
                  default: return { icon: FileText, color: "#64748b", bg: "#f1f5f9" };
                }
              };

              const display = getLogDisplay(activity.recordType);
              const Icon = display.icon;

              return (
                <div key={activity._id || activity.id || index} className={styles.activityRow}>
                  <div className={styles.activityInfo}>
                    <div
                      className={styles.activityIcon}
                      style={{ backgroundColor: display.bg, color: display.color }}
                    >
                      <Icon size={20} />
                    </div>
                    <div className={styles.activityText}>
                      <div className={styles.activityMain}>
                        {activity.logName}: <span>{activity.recordName}</span>
                      </div>
                      <div className={styles.activityMeta}>
                        BY {activity.byPersonName?.toUpperCase()} • {formatDateTime(activity.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.noData}>No recent activities found.</div>
          )}
        </div>
      </section>
    </div>
  );
}
