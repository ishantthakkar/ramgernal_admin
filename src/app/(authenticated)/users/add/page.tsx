"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "../../dashboard.module.css";
import addStyles from "./user-add.module.css";
import {
  UserPlus,
  ShieldCheck,
  X,
  ChevronDown,
  Clock,
  Upload,
  User,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import { normalizeRoleName, getSupervisorTargetRole, getSupervisorLabel, createDefaultSchedule, scheduleToApiPayload, validateWorkingSchedule } from "../user-form-utils";
import type { DayScheduleEntry } from "../user-form-utils";
import { WorkingScheduleEditor } from "../components/WorkingScheduleEditor";

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
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [supervisorOptions, setSupervisorOptions] = useState<SupervisorOption[]>([]);
  const [reportsToId, setReportsToId] = useState("");
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const isPasswordRequired =
    selectedRoleName !== "sales person" && selectedRoleName !== "contractor";

  const supervisorTarget = getSupervisorTargetRole(selectedRoleName);
  const supervisorLabel = getSupervisorLabel(supervisorTarget);
  const needsSupervisor = supervisorTarget !== null;

  useEffect(() => {
    fetchRoles();
  }, []);

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
        const filtered = allUsers.filter(
          (user) => normalizeRoleName(user.userRole) === supervisorTarget
        );
        if (!cancelled) {
          setSupervisorOptions(filtered);
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
      if (profilePreview) URL.revokeObjectURL(profilePreview);
    };
  }, [profilePreview]);

  const fetchRoles = async () => {
    try {
      const data = await adminApi.getRoles();
      const fetchedRoles = data.roles || [];
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
      if (roleName === "sales person" || roleName === "contractor") {
        setFormData((prev) => ({ ...prev, [name]: value, password: "" }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  function handleProfilePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.");
      return;
    }
    if (profilePreview) URL.revokeObjectURL(profilePreview);
    setProfilePicture(file);
    setProfilePreview(URL.createObjectURL(file));
  }

  function removeProfilePicture() {
    if (profilePreview) URL.revokeObjectURL(profilePreview);
    setProfilePicture(null);
    setProfilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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

    setLoading(true);

    try {
      await adminApi.createUser({
        ...formData,
        ...scheduleToApiPayload(workingSchedule),
        hasProfilePicture: !!profilePicture,
        ...(needsSupervisor ? { reportsToId } : {}),
      });
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
            <div className={`${styles.formGroup} ${addStyles.profileUploadGroup}`}>
              <label>Upload Profile Picture</label>
              <div className={addStyles.profileUploadArea}>
                <div className={addStyles.profilePreview}>
                  {profilePreview ? (
                    <Image
                      src={profilePreview}
                      alt="Profile preview"
                      width={88}
                      height={88}
                      className={addStyles.profilePreviewImg}
                      unoptimized
                    />
                  ) : (
                    <User size={36} color="#64748b" />
                  )}
                </div>
                <div className={addStyles.profileUploadControls}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className={addStyles.hiddenFileInput}
                    onChange={handleProfilePictureChange}
                  />
                  <button
                    type="button"
                    className={addStyles.uploadBtn}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={18} /> Choose Image
                  </button>
                  {profilePreview && (
                    <button
                      type="button"
                      onClick={removeProfilePicture}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      Remove photo
                    </button>
                  )}
                  <span className={addStyles.uploadHint}>JPG, PNG or WEBP. Max 5MB.</span>
                </div>
              </div>
            </div>

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
              <label>Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="m.aurelius@voltcore.com"
                className={styles.formInput}
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label>
                Mobile Number <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                name="mobileNumber"
                type="text"
                placeholder="+1 (555) 000-0000"
                className={styles.formInput}
                value={formData.mobileNumber}
                onChange={handleChange}
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
