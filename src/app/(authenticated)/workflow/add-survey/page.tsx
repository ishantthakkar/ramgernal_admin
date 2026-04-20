"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../dashboard.module.css";
import { 
  ClipboardCheck, 
  User, 
  Building2, 
  Calendar, 
  ShieldAlert, 
  X, 
  ChevronDown,
  CheckCircle2
} from "lucide-react";
import { toast } from "react-toastify";

export default function AddSurveyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    customerName: "",
    company: "",
    salesperson: "",
    contractor: "",
    status: "Not Started",
    submittedDate: new Date().toISOString().split('T')[0],
    editRequest: "None"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Survey listing created successfully!");
      router.push("/workflow");
    } catch (err: any) {
      toast.error(err.message || "Failed to create survey. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>/</span> 
        WORKFLOW <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>/</span> 
        <span style={{ color: "#0076ce" }}>ADD SURVEY LISTING</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Create New Survey Listing</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Core Information Section */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <ClipboardCheck size={22} color="#0076ce" /> Core Information
          </div>
          <p className={styles.sectionSubtitle}>
            Define the primary identifiers and participants for this survey.
          </p>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label><User size={14} style={{ marginRight: 4 }} /> Customer Name</label>
              <input 
                name="customerName"
                type="text" 
                placeholder="e.g. John Doe" 
                className={styles.formInput} 
                value={formData.customerName}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label><Building2 size={14} style={{ marginRight: 4 }} /> Company</label>
              <input 
                name="company"
                type="text" 
                placeholder="e.g. Sunwell Solar" 
                className={styles.formInput} 
                value={formData.company}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label><Calendar size={14} style={{ marginRight: 4 }} /> Submitted Date</label>
              <input 
                name="submittedDate"
                type="date" 
                className={styles.formInput} 
                value={formData.submittedDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </section>

        {/* Assignment & Status Section */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <ShieldAlert size={22} color="#0076ce" /> Assignment & Status
          </div>
          <p className={styles.sectionSubtitle}>
            Specify the team members involved and the current workflow state.
          </p>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Salesperson</label>
              <input 
                name="salesperson"
                type="text" 
                placeholder="Assign a salesperson" 
                className={styles.formInput} 
                value={formData.salesperson}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Contractor</label>
              <input 
                name="contractor"
                type="text" 
                placeholder="Assign a contractor" 
                className={styles.formInput} 
                value={formData.contractor}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Survey Status</label>
              <div style={{ position: "relative" }}>
                <select 
                  name="status"
                  className={styles.formSelect} 
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Verified">Verified</option>
                  <option value="Reopened">Reopened</option>
                </select>
                <ChevronDown size={18} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Edit Request</label>
              <div style={{ position: "relative" }}>
                <select 
                  name="editRequest"
                  className={styles.formSelect} 
                  value={formData.editRequest}
                  onChange={handleChange}
                >
                  <option value="None">None</option>
                  <option value="Approve">Approve</option>
                  <option value="Reject">Reject</option>
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
            onClick={() => router.push("/workflow")}
            disabled={loading}
          >
            <X size={20} /> Cancel
          </button>
          <button type="submit" className={styles.createBtn} disabled={loading}>
            {loading ? "Processing..." : <><CheckCircle2 size={20} /> Create Survey Listing</>}
          </button>
        </div>
      </form>
    </div>
  );
}
