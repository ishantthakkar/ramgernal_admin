"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "../../../dashboard.module.css";
import { 
  UserPlus, 
  ShieldCheck, 
  X, 
  ChevronDown,
  Loader2,
  Save
} from "lucide-react";
import { adminApi } from "@/lib/api";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [formData, setFormData] = useState({
    fullName: "",
    company: "",
    email: "",
    mobileNumber: "",
    userRole: "sales_person",
    status: "active"
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await adminApi.getUserById(id);
        const user = response.user || response.data || response;
        setFormData({
          fullName: user.fullName || "",
          company: user.company || "",
          email: user.email || "",
          mobileNumber: user.mobileNumber || "",
          userRole: user.userRole || "sales_person",
          status: user.status || "active"
        });
      } catch (err: any) {
        alert(err.message || "Failed to fetch user details.");
        router.push("/dashboard/users");
      } finally {
        setFetching(false);
      }
    };

    if (id) fetchUser();
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Using "id" to match your backend requirement
      await adminApi.updateUser({ ...formData, id: id });
      router.push("/dashboard/users");
    } catch (err: any) {
      alert(err.message || "Failed to update user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className={styles.spinner} color="#0076ce" />
      </div>
    );
  }

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>/</span> 
        TEAM MANAGEMENT <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>/</span> 
        <span style={{ color: "#0076ce" }}>EDIT USER</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Adjust User Profile</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Profile Information Section */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <UserPlus size={22} color="#0076ce" /> Profile Information
          </div>
          <p className={styles.sectionSubtitle}>
            Update the primary identification details for this user account.
          </p>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Full Name</label>
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
              <label>Company</label>
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
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Mobile Number</label>
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
          </div>
        </section>

        {/* Access & Permissions Section */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <ShieldCheck size={22} color="#0076ce" /> Access & Permissions
          </div>
          <p className={styles.sectionSubtitle}>
            Modify the user's role and current system status.
          </p>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>User Role</label>
              <div style={{ position: "relative" }}>
                <select 
                  name="userRole"
                  className={styles.formSelect} 
                  value={formData.userRole}
                  onChange={handleChange}
                >
                  <option value="sales_person">Sales Person</option>
                  <option value="contractor">Contractor</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="administrator">Administrator</option>
                </select>
                <ChevronDown size={18} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Account Status</label>
              <div style={{ position: "relative" }}>
                <select 
                  name="status"
                  className={styles.formSelect} 
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
                <ChevronDown size={18} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }} />
              </div>
            </div>
          </div>
        </section>

        {/* Action Footer */}
        <div className={styles.actionFooter}>
          <button 
            type="button" 
            className={styles.cancelBtn}
            onClick={() => router.push("/dashboard/users")}
            disabled={loading}
          >
            <X size={20} /> Cancel
          </button>
          <button type="submit" className={styles.createBtn} disabled={loading}>
            {loading ? "Updating..." : <><Save size={20} /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
}
