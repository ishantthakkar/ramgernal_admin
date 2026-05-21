"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "../../../dashboard.module.css";
import {
  X,
  Save,
  FileText,
  Info,
  RefreshCw,
  Loader2,
  ChevronDown,
  XCircle,
  Building,
  User,
  Phone,
  Mail,
  Layers,
  MapPin,
  Calendar
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { formatDateTime } from "@/lib/dateUtils";

export default function EditLeadPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [markingLost, setMarkingLost] = useState(false);

  // Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: "convert" as "convert" | "lost",
    title: "",
    message: "",
    confirmText: "",
    btnType: "info" as "danger" | "success" | "warning" | "info"
  });

  const [existingNotes, setExistingNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    mobileNumber: "",
    salesPerson: "",
    status: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    leadSource: ""
  });

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const response = await adminApi.getLeadById(id);
        const lead = response.lead || response.data || response;
        setFormData({
          name: lead.name || "",
          company: lead.company || "",
          email: lead.email || "",
          mobileNumber: lead.mobileNumber || "",
          salesPerson: lead.user_id?.fullName || lead.salesPerson || "",
          status: lead.status || "",
          street: lead.street || "",
          city: lead.city || "",
          state: lead.state || "",
          zip: lead.zip || "",
          leadSource: lead.leadSource || ""
        });
        setExistingNotes(Array.isArray(lead.notes) ? lead.notes : []);
      } catch (err) {
        console.error("Failed to fetch lead:", err);
        toast.error("Failed to load lead details.");
      } finally {
        setFetching(false);
      }
    };
    if (id) fetchLead();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateLead({
        id,
        ...formData,
        notes: newNote.trim() || undefined
      });
      toast.success("Lead updated successfully!");
      router.push("/leads");
    } catch (err: any) {
      toast.error(err.message || "Failed to update lead.");
    } finally {
      setSaving(false);
    }
  };

  const handleConvertClick = () => {
    setModalConfig({
      type: "convert",
      title: "Convert to Customer",
      message: "Are you sure you want to convert this lead to a customer? This will create a new customer record and workflow.",
      confirmText: "Yes, Convert",
      btnType: "success"
    });
    setShowConfirmModal(true);
  };

  const handleLostClick = () => {
    setModalConfig({
      type: "lost",
      title: "Mark as Lost",
      message: "Are you sure you want to mark this lead as lost? This action can be reversed by changing the status later.",
      confirmText: "Yes, Mark Lost",
      btnType: "danger"
    });
    setShowConfirmModal(true);
  };

  const handleModalConfirm = async () => {
    setShowConfirmModal(false);
    if (modalConfig.type === "convert") {
      await handleConvert();
    } else {
      await handleLost();
    }
  };

  const handleConvert = async () => {
    setConverting(true);
    try {
      await adminApi.convertLead(id);
      toast.success("Lead converted to customer successfully!");
      router.push("/customers");
    } catch (err: any) {
      toast.error(err.message || "Failed to convert lead.");
    } finally {
      setConverting(false);
    }
  };

  const handleLost = async () => {
    setMarkingLost(true);
    try {
      await adminApi.updateLeadStatus(id, "Lost Leads");
      toast.success("Lead marked as lost successfully!");
      router.push("/leads");
    } catch (err: any) {
      toast.error(err.message || "Failed to update lead status.");
    } finally {
      setMarkingLost(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className={styles.spinner} />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New": return "#3b82f6";
      case "In Progress": return "#f59e0b";
      case "Converted To Customer": return "#10b981";
      case "Lost Leads": return "#ef4444";
      default: return "#64748b";
    }
  };

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/leads")}>LEADS</span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>EDIT LEAD</span>
      </div>

      <div className={styles.pageHeader} style={{ marginBottom: "2.5rem" }}>
        <div>
          <h1 className={styles.welcomeText}>Edit Lead Profile</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
            <span style={{
              backgroundColor: `${getStatusColor(formData.status)}15`,
              color: getStatusColor(formData.status),
              padding: "0.25rem 0.75rem",
              borderRadius: "99px",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase"
            }}>
              {formData.status || "New"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            type="button"
            className={styles.createBtn}
            onClick={handleConvertClick}
            disabled={converting || markingLost || formData.status === "Converted To Customer" || formData.status === "Lost Leads"}
            style={{ background: "#10b981" }}
          >
            {converting ? <Loader2 size={18} className={styles.spinner} /> : <RefreshCw size={18} />}
            {converting ? "Converting..." : formData.status === "Converted To Customer" ? "Converted" : "Convert to Customer"}
          </button>
          <button
            type="button"
            className={styles.createBtn}
            onClick={handleLostClick}
            disabled={converting || markingLost || formData.status === "Converted To Customer" || formData.status === "Lost Leads"}
            style={{ background: "#ef4444" }}
          >
            {markingLost ? <Loader2 size={18} className={styles.spinner} /> : <XCircle size={18} />}
            {markingLost ? "Updating..." : formData.status === "Lost Leads" ? "Lead Lost" : "Mark Lost"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* Lead Information Section */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <Info size={22} color="#0076ce" /> Lead Information
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Full Name <span style={{ color: "#ef4444" }}>*</span></label>
              <div style={{ position: "relative" }}>
                <input
                  name="name"
                  type="text"
                  placeholder="e.g. Marcus Aurelius"
                  className={styles.formInput}
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <User size={16} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Company <span style={{ color: "#ef4444" }}>*</span></label>
              <div style={{ position: "relative" }}>
                <input
                  name="company"
                  type="text"
                  placeholder="Industrial Corp Ltd."
                  className={styles.formInput}
                  value={formData.company}
                  onChange={handleChange}
                  required
                />
                <Building size={16} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Lead Source</label>
              <div style={{ position: "relative" }}>
                <input
                  name="leadSource"
                  type="text"
                  placeholder="e.g. Google Search"
                  className={styles.formInput}
                  value={formData.leadSource}
                  onChange={handleChange}
                />
                <Layers size={16} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Sales Person <span style={{ color: "#ef4444" }}>*</span></label>
              <div style={{ position: "relative" }}>
                <input
                  name="salesPerson"
                  type="text"
                  placeholder="Assign Salesperson"
                  className={styles.formInput}
                  value={formData.salesPerson}
                  onChange={handleChange}
                  required
                  readOnly
                  style={{ background: "#f1f5f9", cursor: "not-allowed", color: "#64748b" }}
                />
                <User size={16} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              </div>
            </div>
          </div>
        </section>

        {/* Contact Details Section */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <FileText size={22} color="#0076ce" /> Contact & Address
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Email Address</label>
              <div style={{ position: "relative" }}>
                <input
                  name="email"
                  type="email"
                  placeholder="m.aurelius@voltcore.com"
                  className={styles.formInput}
                  value={formData.email}
                  onChange={handleChange}
                />
                <Mail size={16} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Mobile Number <span style={{ color: "#ef4444" }}>*</span></label>
              <div style={{ position: "relative" }}>
                <input
                  name="mobileNumber"
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  className={styles.formInput}
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  required
                />
                <Phone size={16} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              </div>
            </div>
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label>Address</label>
              <div style={{ position: "relative" }}>
                <input
                  name="street"
                  type="text"
                  placeholder="e.g. 123 Industrial Way"
                  className={styles.formInput}
                  value={formData.street}
                  onChange={handleChange}
                />
                <MapPin size={16} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>City</label>
              <input
                name="city"
                type="text"
                placeholder="Newport"
                className={styles.formInput}
                value={formData.city}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label>State</label>
              <input
                name="state"
                type="text"
                placeholder="California"
                className={styles.formInput}
                value={formData.state}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Zip Code</label>
              <input
                name="zip"
                type="text"
                placeholder="92660"
                className={styles.formInput}
                value={formData.zip}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        {/* Notes Section */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <FileText size={22} color="#0076ce" /> Internal Notes & History
          </div>

          {/* Historical Notes */}
          {existingNotes.length > 0 && (
            <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: "0.75rem", display: "block" }}>PAST NOTES</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {existingNotes.map((n, index) => (
                  <div key={n._id || index} style={{ paddingBottom: index !== existingNotes.length - 1 ? "0.75rem" : "0", borderBottom: index !== existingNotes.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", marginBottom: "0.25rem", display: "flex", justifyContent: "space-between" }}>
                      <span>Note {index + 1}</span>
                      <span>{n.createdAt ? formatDateTime(n.createdAt) : ""}</span>
                    </div>
                    <div style={{ color: "#475569", fontSize: "0.85rem", fontWeight: 500 }}>{n.note}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.formGroup} style={{ marginTop: "1rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0076ce", marginBottom: "0.5rem", display: "block" }}>ADD NEW NOTE</label>
            <textarea
              className={styles.formInput}
              style={{ height: "100px", resize: "none", paddingTop: "0.875rem" }}
              placeholder="Type a new note here to add to the history..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
          </div>
        </section>

        {/* Action Footer */}
        <div className={styles.actionFooter} style={{ background: "#f1f5f9", padding: "2.5rem", borderRadius: "16px", marginTop: "3rem" }}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => router.push("/leads")}
            disabled={saving}
            style={{ padding: "0.875rem 2.5rem" }}
          >
            <X size={20} /> Cancel
          </button>
          <button type="submit" className={styles.createBtn} disabled={saving} style={{ padding: "0.875rem 3rem" }}>
            {saving ? "Saving..." : <><Save size={20} /> Save Changes</>}
          </button>
        </div>
      </form>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleModalConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        type={modalConfig.btnType}
        isLoading={converting || markingLost}
      />
    </div>
  );
}
