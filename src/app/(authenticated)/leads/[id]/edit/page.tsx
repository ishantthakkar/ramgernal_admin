"use client";

import { useMemo, useRef, useState, useEffect } from "react";
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
  Calendar,
  Clock
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { formatDateTime } from "@/lib/dateUtils";

interface LeadSourceOption {
  code: string;
  name: string;
}

interface LeadAddressInput {
  id?: string;
  title: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface LeadContactInput {
  id?: string;
  position: string;
  department: string;
  name: string;
  phone: string;
  mobile: string;
  email: string;
}

interface LeadActivityInput {
  activityType: string;
  date: string; // datetime-local
  outcome: string;
  notes: string;
  followUpDate: string; // datetime-local
  nextFollowUpDate: string; // datetime-local
}

function resolveUploadsUrl(filename: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  return `${base}/uploads/leads/bills/${filename}`;
}

function toIsoOrEmpty(value: string): string {
  if (!value.trim()) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export default function EditLeadPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [markingLost, setMarkingLost] = useState(false);
  const billInputRef = useRef<HTMLInputElement>(null);

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
  const [leadSources, setLeadSources] = useState<LeadSourceOption[]>([]);
  const [existingBills, setExistingBills] = useState<string[]>([]);
  const [billFiles, setBillFiles] = useState<File[]>([]);
  const [addresses, setAddresses] = useState<LeadAddressInput[]>([
    { title: "Office", street: "", city: "", state: "", zip: "" },
  ]);
  const [contactInfo, setContactInfo] = useState<LeadContactInput[]>([
    { position: "Manager", department: "Ops", name: "", phone: "", mobile: "", email: "" },
  ]);
  const [activity, setActivity] = useState<LeadActivityInput>({
    activityType: "Call",
    date: "",
    outcome: "",
    notes: "",
    followUpDate: "",
    nextFollowUpDate: "",
  });

  const billPreviews = useMemo(() => {
    return billFiles.map((file) => {
      const isImage = file.type.startsWith("image/");
      return {
        file,
        isImage,
        url: isImage ? URL.createObjectURL(file) : null,
      };
    });
  }, [billFiles]);

  useEffect(() => {
    return () => {
      billPreviews.forEach((p) => {
        if (p.url) URL.revokeObjectURL(p.url);
      });
    };
  }, [billPreviews]);

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
    leadSource: "",
    leadName: "",
    dba: "",
    legalName: "",
    accountNumber: "",
    electricCompany: "",
  });

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const [leadRes, sourcesRes] = await Promise.all([
          adminApi.getLeadById(id),
          adminApi.getLeadSources(),
        ]);
        const lead = leadRes.lead || leadRes.data || leadRes;
        setLeadSources(sourcesRes.leadSources || []);
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
          leadSource: lead.leadSource || "",
          leadName: lead.leadName || "",
          dba: lead.dba || "",
          legalName: lead.legalName || "",
          accountNumber: lead.accountNumber || "",
          electricCompany: lead.electricCompany || "",
        });
        setExistingNotes(Array.isArray(lead.notes) ? lead.notes : []);
        setExistingBills(Array.isArray(lead.uploadElectricityBill) ? lead.uploadElectricityBill : []);
        setAddresses(
          Array.isArray(lead.addresses) && lead.addresses.length > 0
            ? lead.addresses.map((a: any) => ({
                id: a._id || a.id,
                title: a.title || "",
                street: a.street || "",
                city: a.city || "",
                state: a.state || "",
                zip: a.zip || "",
              }))
            : [{ title: "Office", street: "", city: "", state: "", zip: "" }]
        );
        setContactInfo(
          Array.isArray(lead.contactInfo) && lead.contactInfo.length > 0
            ? lead.contactInfo.map((c: any) => ({
                id: c._id || c.id,
                position: c.position || "",
                department: c.department || "",
                name: c.name || "",
                phone: c.phone || "",
                mobile: c.mobile || "",
                email: c.email || "",
              }))
            : [{ position: "Manager", department: "Ops", name: "", phone: "", mobile: "", email: "" }]
        );
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
      const data = new FormData();
      data.append("id", id);
      data.append("name", formData.name.trim());
      data.append("company", formData.company.trim());
      data.append("mobileNumber", formData.mobileNumber.trim());
      if (formData.email.trim()) data.append("email", formData.email.trim());

      if (formData.leadSource) data.append("leadSource", formData.leadSource);
      if (formData.leadName.trim()) data.append("leadName", formData.leadName.trim());
      if (formData.dba.trim()) data.append("dba", formData.dba.trim());
      if (formData.legalName.trim()) data.append("legalName", formData.legalName.trim());
      if (formData.accountNumber.trim()) data.append("accountNumber", formData.accountNumber.trim());
      if (formData.electricCompany.trim()) data.append("electricCompany", formData.electricCompany.trim());

      data.append("street", formData.street.trim());
      data.append("city", formData.city.trim());
      data.append("state", formData.state.trim());
      data.append("zip", formData.zip.trim());

      if (formData.status) data.append("status", formData.status);
      data.append("lastActivity", new Date().toISOString());

      const cleanedAddresses = addresses
        .map((a) => ({
          ...(a.id ? { id: a.id } : {}),
          title: a.title.trim(),
          street: a.street.trim(),
          city: a.city.trim(),
          state: a.state.trim(),
          zip: a.zip.trim(),
        }))
        .filter((a) => a.title || a.street || a.city || a.state || a.zip);
      if (cleanedAddresses.length > 0) {
        data.append("addresses", JSON.stringify(cleanedAddresses));
      }

      const cleanedContacts = contactInfo
        .map((c) => ({
          ...(c.id ? { id: c.id } : {}),
          position: c.position.trim(),
          department: c.department.trim(),
          name: c.name.trim(),
          phone: c.phone.trim(),
          mobile: c.mobile.trim(),
          email: c.email.trim(),
        }))
        .filter((c) => c.position || c.department || c.name || c.phone || c.mobile || c.email);
      if (cleanedContacts.length > 0) {
        data.append("contactInfo", JSON.stringify(cleanedContacts));
      }

      if (newNote.trim()) {
        data.append("notes", newNote.trim());
      }

      const cleanedActivity = {
        activityType: activity.activityType.trim(),
        date: toIsoOrEmpty(activity.date) || undefined,
        outcome: activity.outcome.trim(),
        notes: activity.notes.trim(),
        followUpDate: toIsoOrEmpty(activity.followUpDate) || undefined,
        nextFollowUpDate: toIsoOrEmpty(activity.nextFollowUpDate) || undefined,
      };
      const hasActivity =
        cleanedActivity.activityType ||
        cleanedActivity.date ||
        cleanedActivity.outcome ||
        cleanedActivity.notes ||
        cleanedActivity.followUpDate ||
        cleanedActivity.nextFollowUpDate;
      if (hasActivity) {
        data.append("activityLog", JSON.stringify([cleanedActivity]));
      }

      for (const file of billFiles) {
        data.append("upload_electricity_bill", file);
      }

      await adminApi.updateLead(data);
      toast.success("Lead updated successfully!");
      router.push(`/leads/${id}`);
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
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/leads")}>
          LEADS
        </span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push(`/leads/${id}`)}>
          VIEW LEAD
        </span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>EDIT LEAD</span>
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
            <Info size={22} color="var(--admin-primary, #004d4d)" /> Lead Information
          </div>
          <p className={styles.sectionSubtitle}>
            Update the primary identification and profile details for this lead.
          </p>

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
                <select
                  name="leadSource"
                  className={styles.formSelect}
                  value={formData.leadSource}
                  onChange={handleChange}
                >
                  <option value="">Select lead source</option>
                  {leadSources.map((source) => (
                    <option key={source.code} value={source.code}>
                      {source.name} ({source.code})
                    </option>
                  ))}
                </select>
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
            <div className={styles.formGroup}>
              <label>Lead Name</label>
              <input
                name="leadName"
                type="text"
                placeholder="e.g. Acme Lead Updated"
                className={styles.formInput}
                value={formData.leadName}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label>DBA</label>
              <input
                name="dba"
                type="text"
                placeholder="e.g. Acme Solar"
                className={styles.formInput}
                value={formData.dba}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Legal Name</label>
              <input
                name="legalName"
                type="text"
                placeholder="e.g. Acme Solar LLC"
                className={styles.formInput}
                value={formData.legalName}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Account Number</label>
              <input
                name="accountNumber"
                type="text"
                placeholder="e.g. 123456"
                className={styles.formInput}
                value={formData.accountNumber}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Electric Company</label>
              <input
                name="electricCompany"
                type="text"
                placeholder="e.g. PG&E"
                className={styles.formInput}
                value={formData.electricCompany}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label>Electricity Bills (existing)</label>
              {existingBills.length === 0 ? (
                <div className={styles.formInput} style={{ background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }}>
                  No bills uploaded.
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  {existingBills.map((filename) => {
                    const url = resolveUploadsUrl(filename);
                    const isPdf = filename.toLowerCase().endsWith(".pdf");
                    return (
                      <a
                        key={filename}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          width: 160,
                          border: "1px solid #e2e8f0",
                          borderRadius: 10,
                          overflow: "hidden",
                          background: "#ffffff",
                          textDecoration: "none",
                          color: "#1e293b",
                        }}
                      >
                        <div style={{ height: 110, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {isPdf ? (
                            <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>PDF</div>
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={url} alt={filename} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          )}
                        </div>
                        <div style={{ padding: "0.5rem 0.6rem", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {filename}
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label>Upload new bills (images / PDF)</label>
              <input
                ref={billInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                className={styles.formInput}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setBillFiles((prev) => {
                    const next = [...prev];
                    for (const file of files) {
                      const key = `${file.name}:${file.size}:${file.lastModified}`;
                      const has = next.some((f) => `${f.name}:${f.size}:${f.lastModified}` === key);
                      if (!has) next.push(file);
                    }
                    return next;
                  });
                  if (billInputRef.current) billInputRef.current.value = "";
                }}
              />
              {billFiles.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.5rem" }}>
                  {billPreviews.map((p) => (
                    <div
                      key={`${p.file.name}:${p.file.size}:${p.file.lastModified}`}
                      style={{
                        width: 140,
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                        background: "#ffffff",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ height: 96, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {p.isImage && p.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.url} alt={p.file.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>PDF</div>
                        )}
                      </div>
                      <div style={{ padding: "0.5rem 0.6rem" }}>
                        <div
                          title={p.file.name}
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#1e293b",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            marginBottom: 6,
                          }}
                        >
                          {p.file.name}
                        </div>
                        <button
                          type="button"
                          className={styles.assignBtn}
                          onClick={() => {
                            setBillFiles((prev) =>
                              prev.filter(
                                (f) =>
                                  !(
                                    f.name === p.file.name &&
                                    f.size === p.file.size &&
                                    f.lastModified === p.file.lastModified
                                  )
                              )
                            );
                          }}
                          style={{ width: "100%", justifyContent: "center" }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Contact Details Section */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <FileText size={22} color="var(--admin-primary, #004d4d)" /> Contact & Address
          </div>
          <p className={styles.sectionSubtitle}>
            Update the contact methods, phone numbers, and addresses associated with this lead.
          </p>

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
              <div style={{ display: "grid", gap: "1rem" }}>
                {addresses.map((address, idx) => (
                  <div
                    key={address.id || idx}
                    style={{
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      borderRadius: 10,
                      padding: "1rem",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.75rem 1.25rem",
                    }}
                  >
                    <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
                      <label style={{ paddingLeft: 0 }}>Title</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={address.title}
                        onChange={(e) => {
                          const value = e.target.value;
                          setAddresses((prev) =>
                            prev.map((a, i) => (i === idx ? { ...a, title: value } : a))
                          );
                        }}
                      />
                    </div>
                    <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
                      <label style={{ paddingLeft: 0 }}>Street</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={address.street}
                        onChange={(e) => {
                          const value = e.target.value;
                          setAddresses((prev) =>
                            prev.map((a, i) => (i === idx ? { ...a, street: value } : a))
                          );
                        }}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label style={{ paddingLeft: 0 }}>City</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={address.city}
                        onChange={(e) => {
                          const value = e.target.value;
                          setAddresses((prev) =>
                            prev.map((a, i) => (i === idx ? { ...a, city: value } : a))
                          );
                        }}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label style={{ paddingLeft: 0 }}>State</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={address.state}
                        onChange={(e) => {
                          const value = e.target.value;
                          setAddresses((prev) =>
                            prev.map((a, i) => (i === idx ? { ...a, state: value } : a))
                          );
                        }}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label style={{ paddingLeft: 0 }}>Zip</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={address.zip}
                        onChange={(e) => {
                          const value = e.target.value;
                          setAddresses((prev) =>
                            prev.map((a, i) => (i === idx ? { ...a, zip: value } : a))
                          );
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "end" }}>
                      <button
                        type="button"
                        className={styles.assignBtn}
                        onClick={() => setAddresses((prev) => prev.filter((_, i) => i !== idx))}
                        disabled={addresses.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <div>
                  <button
                    type="button"
                    className={styles.assignBtn}
                    onClick={() =>
                      setAddresses((prev) => [
                        ...prev,
                        { title: "", street: "", city: "", state: "", zip: "" },
                      ])
                    }
                  >
                    Add Address
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label>Contact Info</label>
              <div style={{ display: "grid", gap: "1rem" }}>
                {contactInfo.map((contact, idx) => (
                  <div
                    key={contact.id || idx}
                    style={{
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      borderRadius: 10,
                      padding: "1rem",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.75rem 1.25rem",
                    }}
                  >
                    <div className={styles.formGroup}>
                      <label style={{ paddingLeft: 0 }}>Position</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={contact.position}
                        onChange={(e) => {
                          const value = e.target.value;
                          setContactInfo((prev) =>
                            prev.map((c, i) => (i === idx ? { ...c, position: value } : c))
                          );
                        }}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label style={{ paddingLeft: 0 }}>Department</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={contact.department}
                        onChange={(e) => {
                          const value = e.target.value;
                          setContactInfo((prev) =>
                            prev.map((c, i) => (i === idx ? { ...c, department: value } : c))
                          );
                        }}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label style={{ paddingLeft: 0 }}>Name</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={contact.name}
                        onChange={(e) => {
                          const value = e.target.value;
                          setContactInfo((prev) =>
                            prev.map((c, i) => (i === idx ? { ...c, name: value } : c))
                          );
                        }}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label style={{ paddingLeft: 0 }}>Email</label>
                      <input
                        type="email"
                        className={styles.formInput}
                        value={contact.email}
                        onChange={(e) => {
                          const value = e.target.value;
                          setContactInfo((prev) =>
                            prev.map((c, i) => (i === idx ? { ...c, email: value } : c))
                          );
                        }}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label style={{ paddingLeft: 0 }}>Phone</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={contact.phone}
                        onChange={(e) => {
                          const value = e.target.value;
                          setContactInfo((prev) =>
                            prev.map((c, i) => (i === idx ? { ...c, phone: value } : c))
                          );
                        }}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label style={{ paddingLeft: 0 }}>Mobile</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={contact.mobile}
                        onChange={(e) => {
                          const value = e.target.value;
                          setContactInfo((prev) =>
                            prev.map((c, i) => (i === idx ? { ...c, mobile: value } : c))
                          );
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className={styles.assignBtn}
                        onClick={() => setContactInfo((prev) => prev.filter((_, i) => i !== idx))}
                        disabled={contactInfo.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <div>
                  <button
                    type="button"
                    className={styles.assignBtn}
                    onClick={() =>
                      setContactInfo((prev) => [
                        ...prev,
                        { position: "", department: "", name: "", phone: "", mobile: "", email: "" },
                      ])
                    }
                  >
                    Add Contact
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label>Primary Address (legacy fields)</label>
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

        {/* Activity Section */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <Clock size={22} color="var(--admin-primary, #004d4d)" /> Add Activity
          </div>
          <p className={styles.sectionSubtitle}>
            This will append a new activity entry to the lead history.
          </p>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Activity Type</label>
              <input
                className={styles.formInput}
                value={activity.activityType}
                onChange={(e) => setActivity((prev) => ({ ...prev, activityType: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Date</label>
              <input
                type="datetime-local"
                className={styles.formInput}
                value={activity.date}
                onChange={(e) => setActivity((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label>Outcome</label>
              <input
                className={styles.formInput}
                value={activity.outcome}
                onChange={(e) => setActivity((prev) => ({ ...prev, outcome: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label>Notes</label>
              <textarea
                className={styles.formInput}
                style={{ height: 110, resize: "none", paddingTop: "0.875rem" }}
                value={activity.notes}
                onChange={(e) => setActivity((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Follow Up Date</label>
              <input
                type="datetime-local"
                className={styles.formInput}
                value={activity.followUpDate}
                onChange={(e) => setActivity((prev) => ({ ...prev, followUpDate: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Next Follow Up Date</label>
              <input
                type="datetime-local"
                className={styles.formInput}
                value={activity.nextFollowUpDate}
                onChange={(e) => setActivity((prev) => ({ ...prev, nextFollowUpDate: e.target.value }))}
              />
            </div>
          </div>
        </section>

        {/* Notes Section */}
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <FileText size={22} color="var(--admin-primary, #004d4d)" /> Internal Notes & History
          </div>
          <p className={styles.sectionSubtitle}>
            Add notes or read historical updates for this lead.
          </p>

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
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--admin-primary, #004d4d)", marginBottom: "0.5rem", display: "block" }}>ADD NEW NOTE</label>
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
        <div className={styles.actionFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => router.push(`/leads/${id}`)}
            disabled={saving}
          >
            <X size={20} /> Cancel
          </button>
          <button type="submit" className={styles.createBtn} disabled={saving}>
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
