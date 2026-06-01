"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import styles from "../../../dashboard.module.css";
import addStyles from "../../add/user-add.module.css";
import {
  UserPlus,
  ShieldCheck,
  X,
  ChevronDown,
  Clock,
  Upload,
  User,
  Save,
  Loader2,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import {
  WEEK_DAYS,
  normalizeRoleName,
  parseStoredTime,
  resolveRoleId,
} from "../../user-form-utils";

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

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [supervisorOptions, setSupervisorOptions] = useState<SupervisorOption[]>([]);
  const [reportsToId, setReportsToId] = useState("");
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const preserveSupervisorRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [daysDropdownOpen, setDaysDropdownOpen] = useState(false);
  const [workingFrom, setWorkingFrom] = useState({ time: "10:00", period: "AM" as "AM" | "PM" });
  const [workingTo, setWorkingTo] = useState({ time: "06:00", period: "PM" as "AM" | "PM" });

  const [formData, setFormData] = useState({
    fullName: "",
    company: "",
    email: "",
    mobileNumber: "",
    password: "",
    userRole: "",
    status: "active",
  });

  const selectedRoleObj = roles.find((r) => r._id === formData.userRole);
  const selectedRoleName = selectedRoleObj
    ? selectedRoleObj.roleName?.toLowerCase()
    : "";

  const isPasswordRequired =
    selectedRoleName !== "sales person" && selectedRoleName !== "contractor";

  const needsSalesManager = selectedRoleName === "sales person";
  const needsProjectManager = selectedRoleName === "sales manager";

  const supervisorLabel = needsSalesManager
    ? "Sales Manager"
    : needsProjectManager
      ? "Project Manager"
      : "";

  useEffect(() => {
    return () => {
      if (profilePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(profilePreview);
      }
    };
  }, [profilePreview]);

  useEffect(() => {
    async function loadUser() {
      if (!id) return;
      setFetching(true);
      try {
        const [rolesRes, userRes] = await Promise.all([
          adminApi.getRoles(),
          adminApi.getUserById(id),
        ]);

        const fetchedRoles: RoleOption[] = rolesRes.roles || [];
        setRoles(fetchedRoles);

        const user = userRes.user || userRes.data || userRes;
        const roleId = resolveRoleId(fetchedRoles, user);

        setFormData({
          fullName: user.fullName || "",
          company: user.company || "",
          email: user.email || "",
          mobileNumber: user.mobileNumber || "",
          password: "",
          userRole: roleId,
          status: user.status || "active",
        });

        setWorkingDays(Array.isArray(user.workingDays) ? user.workingDays : []);
        setWorkingFrom(parseStoredTime(user.workingFrom));
        setWorkingTo(parseStoredTime(user.workingTo));

        const existingReportsTo =
          user.reportsTo?._id?.toString?.() || user.reportsTo?.toString?.() || "";
        preserveSupervisorRef.current = true;
        setReportsToId(existingReportsTo);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to fetch user details.";
        toast.error(message);
        router.push("/users");
      } finally {
        setFetching(false);
      }
    }

    loadUser();
  }, [id, router]);

  useEffect(() => {
    if (!needsSalesManager && !needsProjectManager) {
      setSupervisorOptions([]);
      if (!preserveSupervisorRef.current) {
        setReportsToId("");
      }
      return;
    }

    const targetRole = needsSalesManager ? "sales manager" : "project manager";
    const roleLabel = needsSalesManager ? "Sales Manager" : "Project Manager";
    let cancelled = false;

    async function loadSupervisors() {
      setLoadingSupervisors(true);
      if (!preserveSupervisorRef.current) {
        setReportsToId("");
      } else {
        preserveSupervisorRef.current = false;
      }

      try {
        const response = await adminApi.getUserList();
        const allUsers: SupervisorOption[] =
          response.users || response.data || (Array.isArray(response) ? response : []);
        const filtered = allUsers.filter(
          (user) =>
            normalizeRoleName(user.userRole) === targetRole && String(user._id) !== id
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
  }, [needsSalesManager, needsProjectManager, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "userRole") {
      const selectedRole = roles.find((r) => r._id === value);
      const roleName = selectedRole?.roleName?.toLowerCase() || "";
      preserveSupervisorRef.current = false;
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
    if (profilePreview?.startsWith("blob:")) URL.revokeObjectURL(profilePreview);
    setProfilePicture(file);
    setProfilePreview(URL.createObjectURL(file));
  }

  function removeProfilePicture() {
    if (profilePreview?.startsWith("blob:")) URL.revokeObjectURL(profilePreview);
    setProfilePicture(null);
    setProfilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function toggleWorkingDay(day: string) {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function removeWorkingDay(day: string, e: React.MouseEvent) {
    e.stopPropagation();
    setWorkingDays((prev) => prev.filter((d) => d !== day));
  }

  function togglePeriod(field: "from" | "to") {
    if (field === "from") {
      setWorkingFrom((prev) => ({
        ...prev,
        period: prev.period === "AM" ? "PM" : "AM",
      }));
    } else {
      setWorkingTo((prev) => ({
        ...prev,
        period: prev.period === "AM" ? "PM" : "AM",
      }));
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userRole) {
      toast.error("Please select a user role");
      return;
    }

    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address.");
        return;
      }
    }

    if (workingDays.length === 0) {
      toast.error("Please select at least one working day.");
      return;
    }

    if (!workingFrom.time || !workingTo.time) {
      toast.error("Please enter working hours.");
      return;
    }

    if (needsSalesManager && !reportsToId) {
      toast.error("Please select a sales manager.");
      return;
    }

    if (needsProjectManager && !reportsToId) {
      toast.error("Please select a project manager.");
      return;
    }

    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        id,
        fullName: formData.fullName,
        company: formData.company,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        userRole: formData.userRole,
        status: formData.status,
        workingDays,
        workingFrom: `${workingFrom.time} ${workingFrom.period}`,
        workingTo: `${workingTo.time} ${workingTo.period}`,
        hasProfilePicture: !!profilePicture,
      };

      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      if (needsSalesManager || needsProjectManager) {
        payload.reportsToId = reportsToId;
      }

      await adminApi.updateUser(payload);
      toast.success("User profile updated!");
      router.push(`/users/view/${id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update user. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/users")}>
          USERS
        </span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push(`/users/view/${id}`)}>
          VIEW USER
        </span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>EDIT USER</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Edit User Profile</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <ShieldCheck size={22} color="var(--admin-primary, #004d4d)" /> Access & Permissions
          </div>
          <p className={styles.sectionSubtitle}>Modify the user&apos;s role and current system status.</p>

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

            {(needsSalesManager || needsProjectManager) && (
              <div className={`${styles.formGroup} ${addStyles.supervisorField}`}>
                <label>
                  {supervisorLabel} <span style={{ color: "#ef4444" }}>*</span>
                </label>
                {needsSalesManager && (
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
            Update the primary identification details for this user account.
          </p>

          <div className={styles.formGrid}>
            <div className={`${styles.formGroup} ${addStyles.profileUploadGroup}`}>
              <label>Profile Picture</label>
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
                <label>New Password</label>
                <input
                  name="password"
                  type="password"
                  placeholder="Leave blank to keep current password"
                  className={styles.formInput}
                  value={formData.password}
                  onChange={handleChange}
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
          <p className={styles.sectionSubtitle}>Set working days and hours for this user.</p>

          <div className={addStyles.workingHoursGrid}>
            <div className={styles.formGroup}>
              <label>
                Working Days <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div className={addStyles.daysSelectWrap}>
                <div
                  className={`${addStyles.daysSelectTrigger} ${daysDropdownOpen ? addStyles.daysSelectTriggerOpen : ""}`}
                  onClick={() => setDaysDropdownOpen(!daysDropdownOpen)}
                  onBlur={() => setTimeout(() => setDaysDropdownOpen(false), 150)}
                  tabIndex={0}
                  role="button"
                  aria-expanded={daysDropdownOpen}
                >
                  {workingDays.length === 0 ? (
                    <span className={addStyles.daysPlaceholder}>Select days</span>
                  ) : (
                    workingDays.map((day) => (
                      <span key={day} className={addStyles.dayChip}>
                        {day}
                        <button
                          type="button"
                          className={addStyles.dayChipRemove}
                          onClick={(e) => removeWorkingDay(day, e)}
                          aria-label={`Remove ${day}`}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))
                  )}
                  <ChevronDown size={18} className={addStyles.daysChevron} />
                </div>
                {daysDropdownOpen && (
                  <div className={addStyles.daysDropdown}>
                    {WEEK_DAYS.map((day) => (
                      <div
                        key={day}
                        className={`${addStyles.dayOption} ${workingDays.includes(day) ? addStyles.dayOptionSelected : ""}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          toggleWorkingDay(day);
                        }}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>
                From <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div className={addStyles.timeInputWrap}>
                <input
                  type="time"
                  className={addStyles.timeInput}
                  value={workingFrom.time}
                  onChange={(e) => setWorkingFrom((prev) => ({ ...prev, time: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  className={`${addStyles.periodToggle} ${addStyles.periodToggleActive}`}
                  onClick={() => togglePeriod("from")}
                >
                  {workingFrom.period}
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>
                To <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div className={addStyles.timeInputWrap}>
                <input
                  type="time"
                  className={addStyles.timeInput}
                  value={workingTo.time}
                  onChange={(e) => setWorkingTo((prev) => ({ ...prev, time: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  className={`${addStyles.periodToggle} ${addStyles.periodToggleActive}`}
                  onClick={() => togglePeriod("to")}
                >
                  {workingTo.period}
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.actionFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => router.push(`/users/view/${id}`)}
            disabled={loading}
          >
            <X size={20} /> Cancel
          </button>
          <button type="submit" className={styles.createBtn} disabled={loading}>
            {loading ? (
              "Updating..."
            ) : (
              <>
                <Save size={20} /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
