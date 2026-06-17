"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
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
  normalizeRoleName,
  resolveRoleId,
  getSupervisorTargetRole,
  getSupervisorLabel,
  createDefaultSchedule,
  scheduleFromUser,
  scheduleToApiPayload,
  validateWorkingSchedule,
} from "../../user-form-utils";
import type { DayScheduleEntry } from "../../user-form-utils";
import { WorkingScheduleEditor } from "../../components/WorkingScheduleEditor";
import {
  getUserTabFromRole,
  getUsersListPath,
  parseUserTabFromParam,
  withUserTab,
} from "../../user-tabs";

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
  const searchParams = useSearchParams();
  const id = params.id as string;
  const tabFromUrl = parseUserTabFromParam(searchParams.get("tab"));

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
  const [workingSchedule, setWorkingSchedule] = useState<DayScheduleEntry[]>(createDefaultSchedule);

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

  const supervisorTarget = getSupervisorTargetRole(selectedRoleName);
  const supervisorLabel = getSupervisorLabel(supervisorTarget);
  const needsSupervisor = supervisorTarget !== null;

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

        setWorkingSchedule(scheduleFromUser(user));

        const existingReportsTo =
          user.reportsTo?._id?.toString?.() || user.reportsTo?.toString?.() || "";
        preserveSupervisorRef.current = true;
        setReportsToId(existingReportsTo);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to fetch user details.";
        toast.error(message);
        router.push(getUsersListPath(tabFromUrl));
      } finally {
        setFetching(false);
      }
    }

    loadUser();
  }, [id, router, tabFromUrl]);

  useEffect(() => {
    if (!supervisorTarget) {
      setSupervisorOptions([]);
      if (!preserveSupervisorRef.current) {
        setReportsToId("");
      }
      return;
    }

    const roleLabel = supervisorLabel;
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
            normalizeRoleName(user.userRole) === supervisorTarget && String(user._id) !== id
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
  }, [supervisorTarget, supervisorLabel, id]);

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

  const returnTab = searchParams.has("tab")
    ? tabFromUrl
    : getUserTabFromRole(selectedRoleName);
  const usersListPath = getUsersListPath(returnTab);
  const viewUserPath = withUserTab(`/users/view/${id}`, returnTab);

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
      const payload: Record<string, unknown> = {
        id,
        fullName: formData.fullName,
        company: formData.company,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        userRole: formData.userRole,
        status: formData.status,
        ...scheduleToApiPayload(workingSchedule),
        hasProfilePicture: !!profilePicture,
      };

      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      if (needsSupervisor) {
        payload.reportsToId = reportsToId;
      }

      await adminApi.updateUser(payload);
      toast.success("User profile updated!");
      router.push(withUserTab(`/users/view/${id}`, returnTab));
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
        <span style={{ cursor: "pointer" }} onClick={() => router.push(usersListPath)}>
          USERS
        </span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push(viewUserPath)}>
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

            {needsSupervisor && (
              <div className={`${styles.formGroup} ${addStyles.supervisorField}`}>
                <label>
                  {supervisorLabel} <span style={{ color: "#ef4444" }}>*</span>
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
          <p className={styles.sectionSubtitle}>
            Set different working hours for each day. Enable a day and choose its start and end time.
          </p>

          <WorkingScheduleEditor schedule={workingSchedule} onChange={setWorkingSchedule} />
        </section>

        <div className={styles.actionFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => router.push(usersListPath)}
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
