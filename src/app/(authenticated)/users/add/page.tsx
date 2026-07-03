"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../../dashboard.module.css";
import addStyles from "./user-add.module.css";
import {
  UserPlus,
  ShieldCheck,
  X,
  ChevronDown,
  Clock,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import { canViewModule, canEditUserByRole, hasPermission, isSalesManagerUser, getCurrentUserId } from "@/lib/permissions";
import { getUserScopeFromRole } from "@/lib/role-modules";
import { normalizeRoleName, getSupervisorTargetRole, getSupervisorLabel, createDefaultSchedule, scheduleToApiPayload, validateWorkingSchedule } from "../user-form-utils";
import type { DayScheduleEntry } from "../user-form-utils";
import { WorkingScheduleEditor } from "../components/WorkingScheduleEditor";
import { ProfilePictureUpload } from "@/components/users/profile-picture-upload";
import { formatUsPhone } from "@/lib/format-us-phone";

interface RoleOption {
  _id: string;
  roleName?: string;
}

interface SupervisorOption {
  _id: string;
  fullName?: string;
  company?: string;
  userRole?: string;
}

export default function AddUserPage() {
  const router = useRouter();
  const canCreateUsers = hasPermission("User", "create");
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [supervisorOptions, setSupervisorOptions] = useState<SupervisorOption[]>([]);
  const [reportsToId, setReportsToId] = useState("");
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);

  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [workingSchedule, setWorkingSchedule] = useState<DayScheduleEntry[]>(createDefaultSchedule);

  const [formData, setFormData] = useState({
    fullName: "",
    company: "",
    email: "",
    mobileNumber: "",
    password: "",
    userRole: "Sales Person",
    status: "active",
  });

  const selectedRoleObj = roles.find((r) => r._id === formData.userRole);
  const selectedRoleName = selectedRoleObj
    ? selectedRoleObj.roleName?.toLowerCase()
    : formData.userRole?.toLowerCase();

  const isPasswordRequired = selectedRoleName !== "contractor";
  const isEmailRequired = selectedRoleName === "sales person";

  const supervisorTarget = getSupervisorTargetRole(selectedRoleName);
  const supervisorLabel = getSupervisorLabel(supervisorTarget);
  const needsSupervisor = supervisorTarget !== null;

  useEffect(() => {
    if (!canViewModule("User") || !canCreateUsers) {
      toast.error("You do not have permission to create users.");
      router.push("/users");
      return;
    }
    fetchRoles();
  }, [canCreateUsers, router]);

  useEffect(() => {
    if (!supervisorTarget) {
      setSupervisorOptions([]);
      setReportsToId("");
      return;
    }

    const roleLabel = supervisorLabel;
    let cancelled = false;

    async function loadSupervisors() {
      setLoadingSupervisors(true);
      setReportsToId("");
      try {
        const response = await adminApi.getUserList();
        const allUsers: SupervisorOption[] =
          response.users || response.data || (Array.isArray(response) ? response : []);
        const managerId = getCurrentUserId();
        const filtered = allUsers.filter((user) => {
          if (normalizeRoleName(user.userRole) !== supervisorTarget) return false;
          if (isSalesManagerUser() && managerId) {
            return String(user._id) === managerId;
          }
          return true;
        });
        if (!cancelled) {
          setSupervisorOptions(filtered);
          if (isSalesManagerUser() && managerId) {
            setReportsToId(managerId);
          }
        }
      } catch {
        if (!cancelled) {
          toast.error(`Failed to load ${roleLabel} list`);
          setSupervisorOptions([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingSupervisors(false);
        }
      }
    }

    loadSupervisors();
    return () => {
      cancelled = true;
    };
  }, [supervisorTarget, supervisorLabel]);

  useEffect(() => {
    return () => {
      if (profilePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(profilePreview);
      }
    };
  }, [profilePreview]);

  function handleProfilePictureChange(file: File | null, previewUrl: string | null) {
    setProfilePicture(file);
    setProfilePreview(previewUrl);
  }

  const fetchRoles = async () => {
    try {
      const data = await adminApi.getRoles();
      const fetchedRoles = (data.roles || []).filter((role: RoleOption) => {
        const scope = getUserScopeFromRole(role.roleName);
        if (!scope) return hasPermission("User", "edit");
        return canEditUserByRole(role.roleName);
      });
      setRoles(fetchedRoles);

      const salesPersonRole = fetchedRoles.find(
        (r: { roleName?: string }) => r.roleName?.toLowerCase() === "sales person"
      );
      if (salesPersonRole) {
        setFormData((prev) => ({ ...prev, userRole: salesPersonRole._id }));
      } else if (fetchedRoles.length > 0) {
        setFormData((prev) => ({ ...prev, userRole: fetchedRoles[0]._id }));
      }
    } catch {
      toast.error("Failed to fetch roles");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "userRole") {
      const selectedRole = roles.find((r) => r._id === value);
      const roleName = selectedRole?.roleName?.toLowerCase() || "";
      setReportsToId("");
      if (roleName === "contractor") {
        setFormData((prev) => ({ ...prev, [name]: value, password: "" }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else if (name === "mobileNumber") {
      setFormData((prev) => ({ ...prev, mobileNumber: formatUsPhone(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userRole) {
      toast.error("Please select a user role");
      return;
    }

    const scheduleError = validateWorkingSchedule(workingSchedule);
    if (scheduleError) {
      toast.error(scheduleError);
      return;
    }

    if (needsSupervisor && !reportsToId) {
      toast.error(`Please select an ${supervisorLabel.toLowerCase()}.`);
      return;
    }

    if (isEmailRequired && !formData.email.trim()) {
      toast.error("Email is required for sales person admin panel login.");
      return;
    }

    if (isPasswordRequired && !formData.password.trim()) {
      toast.error("Please enter a password.");
      return;
    }

    setLoading(true);

    try {
      const created = await adminApi.createUser({
        ...formData,
        ...scheduleToApiPayload(workingSchedule),
        ...(needsSupervisor ? { reportsToId } : {}),
      });
      const createdUserId = String(created?.user?._id || created?.user?.id || "");
      if (profilePicture && createdUserId) {
        await adminApi.uploadUserProfileImage(createdUserId, profilePicture);
      }
      toast.success("User created successfully!");
      router.push("/users");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create user. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/users")}>
          USERS
        </span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>ADD USER</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Register New User</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <ShieldCheck size={22} color="var(--admin-primary, #004d4d)" /> Access & Permissions
          </div>
          <p className={styles.sectionSubtitle}>
            Define the user&apos;s role and initial system status.
          </p>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>
                User Role <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <select
                  name="userRole"
                  className={styles.formSelect}
                  value={formData.userRole}
                  onChange={handleChange}
                  required
                >
                  {roles.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.roleName}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "#64748b",
                  }}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>
                Status <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <select
                  name="status"
                  className={styles.formSelect}
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <ChevronDown
                  size={18}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "#64748b",
                  }}
                />
              </div>
            </div>

            {needsSupervisor && (
              <div className={`${styles.formGroup} ${addStyles.supervisorField}`}>
                <label>
                  {supervisorLabel}{" "}
                  <span style={{ color: "#ef4444" }}>*</span>
                </label>
                {supervisorTarget === "sales manager" && (
                  <p className={addStyles.supervisorHint}>
                    Sales persons report to a sales manager.
                  </p>
                )}
                <div style={{ position: "relative" }}>
                  <select
                    name="reportsToId"
                    className={styles.formSelect}
                    value={reportsToId}
                    onChange={(e) => setReportsToId(e.target.value)}
                    required
                    disabled={loadingSupervisors}
                  >
                    <option value="">
                      {loadingSupervisors
                        ? `Loading ${supervisorLabel.toLowerCase()}s...`
                        : `Select ${supervisorLabel.toLowerCase()}`}
                    </option>
                    {supervisorOptions.map((manager) => (
                      <option key={manager._id} value={manager._id}>
                        {manager.fullName || "Unnamed"}
                        {manager.company ? ` — ${manager.company}` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={18}
                    style={{
                      position: "absolute",
                      right: "1rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      color: "#64748b",
                    }}
                  />
                </div>
                {!loadingSupervisors && supervisorOptions.length === 0 && (
                  <span className={addStyles.supervisorEmpty}>
                    No {supervisorLabel.toLowerCase()}s found. Create one first or try again later.
                  </span>
                )}
              </div>
            )}
          </div>
        </section>

        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <UserPlus size={22} color="var(--admin-primary, #004d4d)" /> Profile Information
          </div>
          <p className={styles.sectionSubtitle}>
            Enter the primary identification details for the new user account.
          </p>

          <div className={styles.formGrid}>
            <ProfilePictureUpload
              previewUrl={profilePreview}
              onChange={handleProfilePictureChange}
            />

            <div className={styles.formGroup}>
              <label>
                Full Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                name="fullName"
                type="text"
                placeholder="e.g. Marcus Aurelius"
                className={styles.formInput}
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>
                Company <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                name="company"
                type="text"
                placeholder="Industrial Corp Ltd."
                className={styles.formInput}
                value={formData.company}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>
                Email Address
                {isEmailRequired && <span style={{ color: "#ef4444" }}> *</span>}
              </label>
              <input
                name="email"
                type="email"
                placeholder="m.aurelius@voltcore.com"
                className={styles.formInput}
                value={formData.email}
                onChange={handleChange}
                required={isEmailRequired}
              />
            </div>
            <div className={styles.formGroup}>
              <label>
                Mobile Number <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                name="mobileNumber"
                type="tel"
                placeholder="(555) 555-1234"
                className={styles.formInput}
                value={formData.mobileNumber}
                onChange={handleChange}
                inputMode="numeric"
                maxLength={14}
                required
              />
            </div>
            {isPasswordRequired && (
              <div className={styles.formGroup}>
                <label>
                  Password <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className={styles.formInput}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            )}
          </div>
        </section>

        <section className={styles.formSection}>
          <div className={addStyles.sectionTitleAccent}>
            <div className={addStyles.iconCircleOrange}>
              <Clock size={20} />
            </div>
            Working Hours
          </div>
          <p className={styles.sectionSubtitle}>
            Set different working hours for each day. Enable a day and choose its start and end time.
          </p>

          <WorkingScheduleEditor schedule={workingSchedule} onChange={setWorkingSchedule} />
        </section>

        <div className={styles.actionFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => router.push("/users")}
            disabled={loading}
          >
            <X size={20} /> Cancel
          </button>
          <button type="submit" className={styles.createBtn} disabled={loading}>
            {loading ? "Creating..." : (
              <>
                <UserPlus size={20} /> Create User
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
