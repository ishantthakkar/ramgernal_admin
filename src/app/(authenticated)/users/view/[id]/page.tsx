"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import styles from "../../../dashboard.module.css";
import viewStyles from "../user-view.module.css";
import {
  UserPlus,
  ShieldCheck,
  X,
  Loader2,
  Phone,
  Mail,
  Building,
  User,
  Shield,
  Activity,
  Users,
  Clock,
  Edit2,
  Briefcase,
  Workflow,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { canViewModule, hasPermission } from "@/lib/permissions";
import { getSupervisorFieldLabel } from "../../user-form-utils";
import { WorkingScheduleView } from "../../components/WorkingScheduleView";
import { WorkingHoursCell } from "../../components/WorkingHoursCell";
import {
  getUserTabFromRole,
  getUsersListPath,
  parseUserTabFromParam,
  withUserTab,
} from "../../user-tabs";
import { toast } from "react-toastify";

interface ReportsToUser {
  _id: string;
  fullName?: string;
  userRole?: string;
  company?: string;
  email?: string;
  mobileNumber?: string;
}

interface DirectReport {
  _id: string;
  fullName?: string;
  company?: string;
  email?: string;
  mobileNumber?: string;
  userRole?: string;
  status?: string;
  workingDays?: string[];
  workingFrom?: string;
  workingTo?: string;
  workingSchedule?: { day: string; from: string; to: string }[];
}

interface UserProfile {
  _id: string;
  fullName?: string;
  mobileNumber?: string;
  email?: string;
  company?: string;
  userRole?: string;
  status?: string;
  reportsTo?: ReportsToUser | null;
  workingDays?: string[];
  workingFrom?: string;
  workingTo?: string;
  workingSchedule?: { day: string; from: string; to: string }[];
  assignedProjects?: number;
  completedInstallations?: number;
  pendingInstallations?: number;
  activeLeads?: number;
  customers?: number;
  closedLeads?: number;
  pendingInspections?: number;
  completedInspections?: number;
}

function normalizeRole(role?: string): string {
  return (role || "").toLowerCase().trim().replace(/_/g, " ");
}

export default function ViewUserPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const canEditUsers = hasPermission("User", "edit");
  const canViewUsers = canViewModule("User");
  const tabFromUrl = parseUserTabFromParam(searchParams.get("tab"));

  const [user, setUser] = useState<UserProfile | null>(null);
  const [directReports, setDirectReports] = useState<DirectReport[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!canViewUsers) {
      toast.error("You do not have permission to view users.");
      router.push(getUsersListPath(tabFromUrl));
      return;
    }

    async function fetchUser() {
      try {
        const response = await adminApi.getUserById(id);
        const userData: UserProfile = response.user || response.data || response;
        setUser(userData);
        setDirectReports(
          Array.isArray(response.directReports) ? response.directReports : []
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to fetch user details.";
        toast.error(message);
        router.push(getUsersListPath(tabFromUrl));
      } finally {
        setFetching(false);
      }
    }

    if (id) fetchUser();
  }, [id, router, tabFromUrl, canViewUsers]);

  if (fetching) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className={styles.spinner} />
      </div>
    );
  }

  if (!user) return null;

  const role = normalizeRole(user.userRole);
  const returnTab = searchParams.has("tab")
    ? tabFromUrl
    : getUserTabFromRole(user.userRole);
  const usersListPath = getUsersListPath(returnTab);
  const isSalesManager = role === "sales manager";
  const isAdmin = role === "admin";
  const isContractor = role === "contractor";
  const isProjectManager = role === "project manager";
  const isSalesPerson = role === "sales person";
  const supervisorFieldLabel = getSupervisorFieldLabel(user.userRole);
  const showDirectReports = isSalesManager || isAdmin;
  const directReportsTitle = isSalesManager
    ? "Sales Persons"
    : isAdmin
      ? "Sales Managers & Project Managers"
      : "Team Members";

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push(usersListPath)}>
          USERS
        </span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>VIEW USER</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>View User Profile</h1>
        {canEditUsers && (
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => router.push(withUserTab(`/users/edit/${id}`, returnTab))}
          >
            <Edit2 size={20} /> Edit
          </button>
        )}
      </div>

      <div className={styles.formSection}>
        <div className={`${styles.sectionTitle} ${viewStyles.viewSectionTitle}`}>
          <UserPlus size={22} color="var(--admin-primary, #004d4d)" /> Profile Information
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Name</label>
            <div
              className={styles.formInput}
              style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <User size={16} color="#64748b" />
                {user.fullName || "N/A"}
              </div>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Mobile Number</label>
            <div
              className={styles.formInput}
              style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Phone size={16} color="#64748b" />
                {user.mobileNumber || "N/A"}
              </div>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Email Address</label>
            <div
              className={styles.formInput}
              style={{
                background: "#f8fafc",
                color: "#0076ce",
                fontWeight: 600,
                border: "1px solid #e2e8f0",
                textDecoration: user.email ? "underline" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Mail size={16} color="#64748b" />
                {user.email || "N/A"}
              </div>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Company</label>
            <div
              className={styles.formInput}
              style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Building size={16} color="#64748b" />
                {user.company || "N/A"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <div className={`${styles.sectionTitle} ${viewStyles.viewSectionTitle}`}>
          <Clock size={22} color="var(--admin-primary, #004d4d)" /> Working Hours
        </div>
        <WorkingScheduleView user={user} />
      </div>

      <div className={styles.formSection}>
        <div className={`${styles.sectionTitle} ${viewStyles.viewSectionTitle}`}>
          <ShieldCheck size={22} color="var(--admin-primary, #004d4d)" /> Access & Permissions
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>User Role</label>
            <div
              className={styles.formInput}
              style={{
                background: "#f8fafc",
                color: "#1e293b",
                fontWeight: 600,
                border: "1px solid #e2e8f0",
                textTransform: "capitalize",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Shield size={16} color="#64748b" />
                {user.userRole?.replace(/_/g, " ") || "N/A"}
              </div>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Status</label>
            <div
              className={styles.formInput}
              style={{
                background: "#f8fafc",
                color: user.status === "active" ? "#059669" : "#dc2626",
                fontWeight: 700,
                border: "1px solid #e2e8f0",
                textTransform: "capitalize",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Activity size={16} color={user.status === "active" ? "#059669" : "#dc2626"} />
                {user.status || "Inactive"}
              </div>
            </div>
          </div>
          {supervisorFieldLabel && (
            <div className={styles.formGroup}>
              <label>{supervisorFieldLabel}</label>
              <div
                className={styles.formInput}
                style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}
              >
                {user.reportsTo ? (
                  <span
                    className={viewStyles.subordinatesName}
                    onClick={() => router.push(`/users/view/${user.reportsTo?._id}`)}
                  >
                    {user.reportsTo.fullName}
                    {user.reportsTo.company ? ` — ${user.reportsTo.company}` : ""}
                  </span>
                ) : (
                  "—"
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isContractor && (
        <div className={styles.formSection}>
          <div className={`${styles.sectionTitle} ${viewStyles.viewSectionTitle}`}>
            <Briefcase size={22} color="var(--admin-primary, #004d4d)" /> Project Summary
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Assigned Projects</label>
              <div
                className={styles.formInput}
                style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 700, border: "1px solid #e2e8f0" }}
              >
                {user.assignedProjects ?? 0}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Submitted Inst. (Completed)</label>
              <div
                className={styles.formInput}
                style={{ background: "#f8fafc", color: "#059669", fontWeight: 700, border: "1px solid #e2e8f0" }}
              >
                {user.completedInstallations ?? 0}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>In Progress Inst. (Pending)</label>
              <div
                className={styles.formInput}
                style={{ background: "#f8fafc", color: "#d97706", fontWeight: 700, border: "1px solid #e2e8f0" }}
              >
                {user.pendingInstallations ?? 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {isProjectManager && (
        <div className={styles.formSection}>
          <div className={`${styles.sectionTitle} ${viewStyles.viewSectionTitle}`}>
            <Workflow size={22} color="var(--admin-primary, #004d4d)" /> Inspection Summary
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Pending Inspections</label>
              <div
                className={styles.formInput}
                style={{ background: "#f8fafc", color: "#d97706", fontWeight: 700, border: "1px solid #e2e8f0" }}
              >
                {user.pendingInspections ?? 0}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Completed Inspections</label>
              <div
                className={styles.formInput}
                style={{ background: "#f8fafc", color: "#059669", fontWeight: 700, border: "1px solid #e2e8f0" }}
              >
                {user.completedInspections ?? 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {isSalesPerson && (
        <div className={styles.formSection}>
          <div className={`${styles.sectionTitle} ${viewStyles.viewSectionTitle}`}>
            <Users size={22} color="var(--admin-primary, #004d4d)" /> Leads & Customers Summary
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Active Leads</label>
              <div
                className={styles.formInput}
                style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 700, border: "1px solid #e2e8f0" }}
              >
                {user.activeLeads ?? 0}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Customers</label>
              <div
                className={styles.formInput}
                style={{ background: "#f8fafc", color: "#059669", fontWeight: 700, border: "1px solid #e2e8f0" }}
              >
                {user.customers ?? 0}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Lost Leads</label>
              <div
                className={styles.formInput}
                style={{ background: "#f8fafc", color: "#dc2626", fontWeight: 700, border: "1px solid #e2e8f0" }}
              >
                {user.closedLeads ?? 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {showDirectReports && (
        <div className={`${styles.formSection} ${viewStyles.subordinatesSection}`}>
          <div className={`${viewStyles.subordinatesTitle} ${viewStyles.subordinatesTitleSpaced}`}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={22} color="var(--admin-primary, #004d4d)" />
              {directReportsTitle} ({directReports.length})
            </div>
          </div>

          {directReports.length === 0 ? (
            <div className={viewStyles.subordinatesEmpty}>No team members assigned yet.</div>
          ) : (
            <div className={styles.userTableContainer}>
              <table className={viewStyles.subordinatesTable}>
                <thead>
                  <tr>
                    <th>Name</th>
                    {isAdmin && <th>Role</th>}
                    <th>Mobile</th>
                    <th>Email</th>
                    <th>Working Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {directReports.map((member) => (
                    <tr key={member._id}>
                      <td>
                        <span
                          className={viewStyles.subordinatesName}
                          onClick={() => router.push(`/users/view/${member._id}`)}
                        >
                          {member.fullName || "—"}
                        </span>
                      </td>
                      {isAdmin && (
                        <td style={{ textTransform: "capitalize" }}>
                          {member.userRole?.replace(/_/g, " ") || "—"}
                        </td>
                      )}
                      <td>{member.mobileNumber || "—"}</td>
                      <td>{member.email || "—"}</td>
                      <WorkingHoursCell user={member as unknown as Record<string, unknown>} />
                      <td style={{ textTransform: "capitalize" }}>{member.status || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div
        className={styles.actionFooter}
        style={{ background: "#f1f5f9", padding: "2.5rem", borderRadius: "16px", marginTop: "3rem", justifyContent: "flex-end" }}
      >
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => router.push(usersListPath)}
          style={{ padding: "0.875rem 3rem", background: "#64748b", color: "#ffffff" }}
        >
          <X size={20} /> Close
        </button>
      </div>
    </div>
  );
}
