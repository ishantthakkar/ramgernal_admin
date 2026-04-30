"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../../dashboard.module.css";
import {
  UserPlus,
  ShieldCheck,
  X,
  ChevronDown
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";

export default function AddUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    fullName: "",
    company: "",
    email: "",
    mobileNumber: "",
    password: "",
    userRole: "Sales Person",
    status: "active"
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const data = await adminApi.getRoles();
      setRoles(data.roles || []);
    } catch (err: any) {
      toast.error("Failed to fetch roles");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "userRole" && (value === "Sales Person" || value === "Contractor")) {
      setFormData(prev => ({ ...prev, [name]: value, password: "" }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userRole) {
      toast.error("Please select a user role");
      return;
    }
    setLoading(true);

    try {
      await adminApi.createUser(formData);
      toast.success("User created successfully!");
      router.push("/users");
    } catch (err: any) {
      toast.error(err.message || "Failed to create user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>/</span>
        TEAM MANAGEMENT <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>/</span>
        <span style={{ color: "#0076ce" }}>ADD USER</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Register New User</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Access & Permissions Section */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <ShieldCheck size={22} color="#0076ce" /> Access & Permissions
          </div>
          <p className={styles.sectionSubtitle}>
            Define the user's role and initial system status.
          </p>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>User Role <span style={{ color: "#ef4444" }}>*</span></label>
              <div style={{ position: "relative" }}>
                <select
                  name="userRole"
                  className={styles.formSelect}
                  value={formData.userRole}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select a Role</option>
                  <option value="Sales Person">Sales Person</option>
                  <option value="Contractor">Contractor</option>
                  {roles.map((role) => {
                    if (role.roleName === "Sales Person" || role.roleName === "Contractor") return null;
                    return (
                      <option key={role._id} value={role._id}>
                        {role.roleName}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown size={18} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Status <span style={{ color: "#ef4444" }}>*</span></label>
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
                <ChevronDown size={18} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }} />
              </div>
            </div>
          </div>
        </section>

        {/* Profile Information Section */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <UserPlus size={22} color="#0076ce" /> Profile Information
          </div>
          <p className={styles.sectionSubtitle}>
            Enter the primary identification details for the new user account.
          </p>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Full Name <span style={{ color: "#ef4444" }}>*</span></label>
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
              <label>Company <span style={{ color: "#ef4444" }}>*</span></label>
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
              <label>Email Address {formData.userRole !== "Sales Person" && formData.userRole !== "Contractor" && <span style={{ color: "#ef4444" }}>*</span>}</label>
              <input
                name="email"
                type="email"
                placeholder="m.aurelius@voltcore.com"
                className={styles.formInput}
                value={formData.email}
                onChange={handleChange}
                required={formData.userRole !== "Sales Person" && formData.userRole !== "Contractor"}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Mobile Number <span style={{ color: "#ef4444" }}>*</span></label>
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
            {formData.userRole !== "Sales Person" && formData.userRole !== "Contractor" && (
              <div className={styles.formGroup}>
                <label>Password <span style={{ color: "#ef4444" }}>*</span></label>
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

        {/* Action Footer */}
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
            {loading ? "Creating..." : <><UserPlus size={20} /> Create User</>}
          </button>
        </div>
      </form>
    </div>
  );
}
