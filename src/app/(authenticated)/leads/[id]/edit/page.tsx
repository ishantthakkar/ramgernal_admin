"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "../../../dashboard.module.css";
import addStyles from "../../add/leads-add.module.css";
import {
  X,
  FileText,
  Info,
  Loader2,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Users,
  Calendar,
  Save,
  RefreshCw,
  XCircle,
} from "lucide-react";

const ELECTRIC_COMPANIES = [
  "PSE&G",
  "JCP&L",
  "ATLANTIC CITY ENERGY",
] as const;

function formatUsPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function toIsoOrEmpty(value: string): string {
  if (!value.trim()) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}
import { adminApi } from "@/lib/api";
import { formatNoteAuthorLabel, withNoteAuthor } from "@/lib/leadNotes";
import { toast } from "react-toastify";
import { UsaAddressFields } from "@/components/address/usa-address-fields";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import modalStyles from "@/components/modals/ConfirmationModal.module.css";
import { formatDateTime } from "@/lib/dateUtils";

interface LeadSourceOption {
  code: string;
  name: string;
}

interface SalesPersonOption {
  id: string;
  fullName?: string;
  email?: string;
}

function resolveUploadsUrl(filename: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  return `${base}/uploads/leads/bills/${filename}`;
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

interface ExistingActivity {
  activityType?: string;
  date?: string;
  outcome?: string;
  notes?: string;
  createdAt?: string;
}

interface ExistingNote {
  title?: string;
  note?: string;
  createdAt?: string;
  writtenByName?: string;
  writtenByEmail?: string;
  writtenByRole?: string;
  _id?: string;
}

interface LeadNoteInput {
  title: string;
  note: string;
  writtenByName?: string;
  writtenByEmail?: string;
  writtenByRole?: string;
}

interface LeadActivityInput {
  activityType: string;
  date: string;
  outcome: string;
  notes: string;
  followUpDate: string;
  nextFollowUpDate: string;
}

export default function EditLeadPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [converting, setConverting] = useState(false);
  const [markingLost, setMarkingLost] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [status, setStatus] = useState("");
  const [initialSalesPersonId, setInitialSalesPersonId] = useState("");
  const [existingBills, setExistingBills] = useState<string[]>([]);
  const [existingNotes, setExistingNotes] = useState<ExistingNote[]>([]);
  const [existingActivityLog, setExistingActivityLog] = useState<ExistingActivity[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [modalConfig, setModalConfig] = useState({
    type: "convert" as "convert" | "lost",
    title: "",
    message: "",
    confirmText: "",
    btnType: "info" as "danger" | "success" | "warning" | "info",
  });
  const [leadSources, setLeadSources] = useState<LeadSourceOption[]>([]);
  const [salesPersons, setSalesPersons] = useState<SalesPersonOption[]>([]);
  const billInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    email: "",
    mobileNumber: "",
    leadName: "",
    dba: "",
    legalName: "",
    accountNumber: "",
    electricCompany: "",
    leadSource: "",
    salesPersonId: "",
  });
  const [billFiles, setBillFiles] = useState<File[]>([]);
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

  const [addresses, setAddresses] = useState<LeadAddressInput[]>([]);
  const [contactInfo, setContactInfo] = useState<LeadContactInput[]>([]);
  const [activities, setActivities] = useState<LeadActivityInput[]>([]);
  const [notes, setNotes] = useState<LeadNoteInput[]>([]);

  // Modal control states
  const [activeModal, setActiveModal] = useState<
    "address" | "contact" | "activity" | "note" | null
  >(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Temporary modal input states
  const [tempAddress, setTempAddress] = useState<LeadAddressInput>({
    title: "", street: "", city: "", state: "", zip: ""
  });
  const [tempContact, setTempContact] = useState<LeadContactInput>({
    position: "", department: "", name: "", phone: "", mobile: "", email: ""
  });
  const [tempNote, setTempNote] = useState<LeadNoteInput>({
    title: "", note: ""
  });
  const [tempActivity, setTempActivity] = useState<LeadActivityInput>({
    activityType: "Call",
    date: "",
    outcome: "",
    notes: "",
    followUpDate: "",
    nextFollowUpDate: "",
  });

  // Modal actions
  const openAddressModal = (index?: number) => {
    if (index !== undefined) {
      setTempAddress(addresses[index]);
      setEditingIndex(index);
    } else {
      setTempAddress({ title: "Office", street: "", city: "", state: "", zip: "" });
      setEditingIndex(null);
    }
    setActiveModal("address");
  };

  const saveAddress = () => {
    if (!tempAddress.title.trim()) {
      toast.error("Please enter an address title.");
      return;
    }
    if (!tempAddress.street.trim() && !tempAddress.city.trim()) {
      toast.error("Please provide at least a street or city.");
      return;
    }
    if (editingIndex !== null) {
      setAddresses((prev) =>
        prev.map((item, i) =>
          i === editingIndex ? { ...item, ...tempAddress } : item
        )
      );
    } else {
      setAddresses((prev) => [...prev, tempAddress]);
    }
    setActiveModal(null);
    setEditingIndex(null);
  };

  const deleteAddress = (index: number) => {
    setAddresses(prev => prev.filter((_, i) => i !== index));
  };

  const openContactModal = (index?: number) => {
    if (index !== undefined) {
      setTempContact(contactInfo[index]);
      setEditingIndex(index);
    } else {
      setTempContact({ position: "Manager", department: "Ops", name: "", phone: "", mobile: "", email: "" });
      setEditingIndex(null);
    }
    setActiveModal("contact");
  };

  const saveContact = () => {
    if (!tempContact.name.trim()) {
      toast.error("Please enter a contact name.");
      return;
    }
    if (editingIndex !== null) {
      setContactInfo((prev) =>
        prev.map((item, i) =>
          i === editingIndex ? { ...item, ...tempContact } : item
        )
      );
    } else {
      setContactInfo((prev) => [...prev, tempContact]);
    }
    setActiveModal(null);
    setEditingIndex(null);
  };

  const deleteContact = (index: number) => {
    setContactInfo(prev => prev.filter((_, i) => i !== index));
  };

  const openNoteModal = (index?: number) => {
    if (index !== undefined) {
      setTempNote(notes[index]);
      setEditingIndex(index);
    } else {
      setTempNote({ title: "", note: "" });
      setEditingIndex(null);
    }
    setActiveModal("note");
  };

  const saveNote = () => {
    if (!tempNote.note.trim()) {
      toast.error("Please enter the note content.");
      return;
    }
    const noteToSave =
      editingIndex !== null
        ? {
            ...tempNote,
            writtenByName: notes[editingIndex].writtenByName,
            writtenByEmail: notes[editingIndex].writtenByEmail,
            writtenByRole: notes[editingIndex].writtenByRole,
          }
        : withNoteAuthor(tempNote);
    if (editingIndex !== null) {
      setNotes((prev) => prev.map((item, i) => (i === editingIndex ? noteToSave : item)));
    } else {
      setNotes((prev) => [...prev, noteToSave]);
    }
    setActiveModal(null);
    setEditingIndex(null);
  };

  const deleteNote = (index: number) => {
    setNotes(prev => prev.filter((_, i) => i !== index));
  };

  const openActivityModal = (index?: number) => {
    if (index !== undefined) {
      setTempActivity(activities[index]);
      setEditingIndex(index);
    } else {
      setTempActivity({
        activityType: "Call",
        date: "",
        outcome: "",
        notes: "",
        followUpDate: "",
        nextFollowUpDate: "",
      });
      setEditingIndex(null);
    }
    setActiveModal("activity");
  };

  const saveActivity = () => {
    if (!tempActivity.activityType.trim()) {
      toast.error("Please select an activity type.");
      return;
    }
    if (editingIndex !== null) {
      setActivities((prev) =>
        prev.map((item, i) => (i === editingIndex ? tempActivity : item))
      );
    } else {
      setActivities((prev) => [...prev, tempActivity]);
    }
    setActiveModal(null);
    setEditingIndex(null);
  };

  const deleteActivity = (index: number) => {
    setActivities((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoadingOptions(true);
      setFetching(true);
      try {
        const [leadRes, sourcesRes, salesRes] = await Promise.all([
          adminApi.getLeadById(id),
          adminApi.getLeadSources(),
          adminApi.getLeadSalesPersons(),
        ]);
        const lead = leadRes.lead || leadRes.data || leadRes;
        setLeadSources(sourcesRes.leadSources || []);
        setSalesPersons(salesRes.salesPersons || []);
        setStatus(lead.status || "");
        const salesId = lead.user_id?._id || lead.user_id || "";
        setInitialSalesPersonId(salesId ? String(salesId) : "");
        setFormData({
          email: lead.email || "",
          mobileNumber: lead.mobileNumber ? formatUsPhone(lead.mobileNumber) : "",
          leadName: lead.leadName || lead.name || "",
          dba: lead.dba || "",
          legalName: lead.legalName || "",
          accountNumber: lead.accountNumber || "",
          electricCompany: lead.electricCompany || "",
          leadSource: lead.leadSource || "",
          salesPersonId: salesId ? String(salesId) : "",
        });
        setExistingBills(
          Array.isArray(lead.uploadElectricityBill) ? lead.uploadElectricityBill : []
        );
        setExistingNotes(Array.isArray(lead.notes) ? lead.notes : []);
        setExistingActivityLog(Array.isArray(lead.activityLog) ? lead.activityLog : []);
        setAddresses(
          Array.isArray(lead.addresses) && lead.addresses.length > 0
            ? lead.addresses.map((a: LeadAddressInput & { _id?: string }) => ({
                id: a._id || a.id,
                title: a.title || "",
                street: a.street || "",
                city: a.city || "",
                state: a.state || "",
                zip: a.zip || "",
              }))
            : []
        );
        setContactInfo(
          Array.isArray(lead.contactInfo) && lead.contactInfo.length > 0
            ? lead.contactInfo.map((c: LeadContactInput & { _id?: string }) => ({
                id: c._id || c.id,
                position: c.position || "",
                department: c.department || "",
                name: c.name || "",
                phone: c.phone || "",
                mobile: c.mobile || "",
                email: c.email || "",
              }))
            : []
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load lead details";
        toast.error(message);
      } finally {
        setLoadingOptions(false);
        setFetching(false);
      }
    }
    loadData();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "mobileNumber") {
      setFormData((prev) => ({ ...prev, mobileNumber: formatUsPhone(value) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.leadSource) {
      toast.error("Please select a lead source.");
      return;
    }
    if (!formData.leadName.trim()) {
      toast.error("Please enter a lead name.");
      return;
    }

    setSaving(true);

    try {
      const data = new FormData();
      const leadName = formData.leadName.trim();
      data.append("id", id);
      data.append("leadSource", formData.leadSource);
      data.append("leadName", leadName);
      data.append("name", leadName);
      if (formData.mobileNumber.trim()) {
        data.append("mobileNumber", formData.mobileNumber.trim());
      }
      if (formData.email.trim()) data.append("email", formData.email.trim());
      if (formData.dba.trim()) data.append("dba", formData.dba.trim());
      if (formData.legalName.trim()) data.append("legalName", formData.legalName.trim());
      if (formData.accountNumber.trim()) data.append("accountNumber", formData.accountNumber.trim());
      if (formData.electricCompany.trim()) data.append("electricCompany", formData.electricCompany.trim());

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
      data.append("addresses", JSON.stringify(cleanedAddresses));

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
      data.append("contactInfo", JSON.stringify(cleanedContacts));

      const cleanedNotes = notes
        .map((n) => ({
          title: n.title.trim(),
          note: n.note.trim(),
          writtenByName: n.writtenByName?.trim() || "",
          writtenByEmail: n.writtenByEmail?.trim() || "",
          writtenByRole: n.writtenByRole?.trim() || "",
        }))
        .filter((n) => n.title || n.note);
      if (cleanedNotes.length > 0) {
        data.append("notes", JSON.stringify(cleanedNotes));
      }

      const cleanedActivities = activities
        .map((a) => ({
          activityType: a.activityType.trim(),
          date: toIsoOrEmpty(a.date) || new Date().toISOString(),
          outcome: a.outcome.trim(),
          notes: a.notes.trim(),
          followUpDate: toIsoOrEmpty(a.followUpDate) || undefined,
          nextFollowUpDate: toIsoOrEmpty(a.nextFollowUpDate) || undefined,
        }))
        .filter((a) => a.activityType);
      if (cleanedActivities.length > 0) {
        data.append("activityLog", JSON.stringify(cleanedActivities));
      }

      for (const file of billFiles) {
        data.append("upload_electricity_bill", file);
      }

      await adminApi.updateLead(data);

      if (
        formData.salesPersonId &&
        formData.salesPersonId !== initialSalesPersonId
      ) {
        await adminApi.assignLeadToSalesPerson(id, formData.salesPersonId);
      }

      toast.success("Lead updated successfully!");
      router.push(`/leads/${id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update lead.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleConvertClick = () => {
    setModalConfig({
      type: "convert",
      title: "Convert to Customer",
      message:
        "Are you sure you want to convert this lead to a customer? This will create a new customer record and workflow.",
      confirmText: "Yes, Convert",
      btnType: "success",
    });
    setShowConfirmModal(true);
  };

  const handleLostClick = () => {
    setLostReason("");
    setModalConfig({
      type: "lost",
      title: "Mark as Lost",
      message:
        "Are you sure you want to mark this lead as lost? This action can be reversed by changing the status later.",
      confirmText: "Yes, Mark Lost",
      btnType: "danger",
    });
    setShowConfirmModal(true);
  };

  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
    setLostReason("");
  };

  const handleModalConfirm = async () => {
    setShowConfirmModal(false);
    if (modalConfig.type === "convert") {
      setLostReason("");
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to convert lead.";
      toast.error(message);
    } finally {
      setConverting(false);
    }
  };

  const handleLost = async () => {
    const reason = lostReason.trim();
    if (!reason) {
      toast.error("Please enter a lost reason.");
      return;
    }

    setMarkingLost(true);
    try {
      await adminApi.markLeadAsLost(id, reason);
      toast.success("Lead marked as lost successfully!");
      router.push("/leads");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update lead status.";
      toast.error(message);
    } finally {
      setMarkingLost(false);
    }
  };

  const getStatusColor = (leadStatus: string) => {
    switch (leadStatus) {
      case "New":
        return "#3b82f6";
      case "In Progress":
        return "#f59e0b";
      case "Converted To Customer":
        return "#10b981";
      case "Lost Leads":
        return "#ef4444";
      default:
        return "#64748b";
    }
  };

  if (fetching || loadingOptions) {
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
          <h1 className={styles.welcomeText}>Edit Lead</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
            <span
              style={{
                backgroundColor: `${getStatusColor(status)}15`,
                color: getStatusColor(status),
                padding: "0.25rem 0.75rem",
                borderRadius: "99px",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {status || "New"}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            type="button"
            className={styles.createBtn}
            onClick={handleConvertClick}
            disabled={
              converting ||
              markingLost ||
              status === "Converted To Customer" ||
              status === "Lost Leads"
            }
            style={{ background: "#10b981" }}
          >
            {converting ? (
              <Loader2 size={18} className={styles.spinner} />
            ) : (
              <RefreshCw size={18} />
            )}
            {converting
              ? "Converting..."
              : status === "Converted To Customer"
                ? "Converted"
                : "Convert to Customer"}
          </button>
          <button
            type="button"
            className={styles.createBtn}
            onClick={handleLostClick}
            disabled={
              converting ||
              markingLost ||
              status === "Converted To Customer" ||
              status === "Lost Leads"
            }
            style={{ background: "#ef4444" }}
          >
            {markingLost ? (
              <Loader2 size={18} className={styles.spinner} />
            ) : (
              <XCircle size={18} />
            )}
            {markingLost ? "Updating..." : status === "Lost Leads" ? "Lead Lost" : "Mark as Lost"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <Info size={22} color="var(--admin-primary, #004d4d)" /> Lead Information
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>
                Lead Source <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <select
                  name="leadSource"
                  className={styles.formSelect}
                  value={formData.leadSource}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select lead source</option>
                  {leadSources.map((source) => (
                    <option key={source.code} value={source.code}>
                      {source.name} ({source.code})
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
                Lead Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                name="leadName"
                type="text"
                placeholder="e.g. Acme Solar"
                className={styles.formInput}
                value={formData.leadName}
                onChange={handleChange}
                required
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
              <label>Utility / Electric Company</label>
              <div style={{ position: "relative" }}>
                <select
                  name="electricCompany"
                  className={styles.formSelect}
                  value={formData.electricCompany}
                  onChange={handleChange}
                >
                  <option value="">Select electric company</option>
                  {ELECTRIC_COMPANIES.map((company) => (
                    <option key={company} value={company}>
                      {company}
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
            {existingBills.length > 0 && (
              <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
                <label>Existing Electricity Bills</label>
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
                        <div
                          style={{
                            height: 110,
                            background: "#f8fafc",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {isPdf ? (
                            <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
                              PDF
                            </div>
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={url}
                              alt={filename}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          )}
                        </div>
                        <div
                          style={{
                            padding: "0.5rem 0.6rem",
                            fontSize: 12,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {filename}
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label>Upload Electricity Bill</label>
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
                      const has = next.some(
                        (f) => `${f.name}:${f.size}:${f.lastModified}` === key
                      );
                      if (!has) next.push(file);
                    }
                    return next;
                  });
                  if (billInputRef.current) billInputRef.current.value = "";
                }}
              />
              {billFiles.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gap: "0.75rem",
                    marginTop: "0.25rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                    }}
                  >
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
                        <div
                          style={{
                            height: 96,
                            background: "#f8fafc",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {p.isImage && p.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.url}
                              alt={p.file.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                              PDF
                            </div>
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
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className={styles.assignBtn}
                      onClick={() => {
                        setBillFiles([]);
                        if (billInputRef.current) billInputRef.current.value = "";
                      }}
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              )}
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
              <label>Mobile</label>
              <input
                name="mobileNumber"
                type="tel"
                placeholder="(555) 555-1234"
                className={styles.formInput}
                value={formData.mobileNumber}
                onChange={handleChange}
                inputMode="numeric"
                maxLength={14}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Email</label>
              <input
                name="email"
                type="email"
                placeholder="contact@example.com"
                className={styles.formInput}
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Assign to Sales Person</label>
              <div style={{ position: "relative" }}>
                <select
                  name="salesPersonId"
                  className={styles.formSelect}
                  value={formData.salesPersonId}
                  onChange={handleChange}
                >
                  <option value="">Unassigned (admin-owned)</option>
                  {salesPersons.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.fullName || "Unnamed"}
                      {person.email ? ` — ${person.email}` : ""}
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
          </div>
        </section>

        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <MapPin size={22} color="var(--admin-primary, #004d4d)" /> Address Information
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label style={{ margin: 0 }}>Addresses</label>
                <button
                  type="button"
                  className={addStyles.modalSaveBtn}
                  onClick={() => openAddressModal()}
                  style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                >
                  <Plus size={16} /> Add Address
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className={addStyles.emptyState}>
                  No addresses added yet. Click "Add Address" to insert one.
                </div>
              ) : (
                <div className={addStyles.itemGrid}>
                  {addresses.map((address, idx) => (
                    <div key={idx} className={addStyles.itemCard}>
                      <div>
                        <div className={addStyles.itemHeader}>
                          <span className={addStyles.itemTitle}>{address.title || "Address"}</span>
                        </div>
                        <div className={addStyles.itemContent}>
                          {address.street && <div>{address.street}</div>}
                          {(address.city || address.state || address.zip) && (
                            <div>
                              {[address.city, address.state, address.zip].filter(Boolean).join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={addStyles.itemActions}>
                        <button
                          type="button"
                          className={`${addStyles.itemActionBtn} ${addStyles.editActionBtn}`}
                          onClick={() => openAddressModal(idx)}
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          className={`${addStyles.itemActionBtn} ${addStyles.deleteActionBtn}`}
                          onClick={() => deleteAddress(idx)}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <Users size={22} color="var(--admin-primary, #004d4d)" /> Contact Information
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label style={{ margin: 0 }}>Contacts</label>
                <button
                  type="button"
                  className={addStyles.modalSaveBtn}
                  onClick={() => openContactModal()}
                  style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                >
                  <Plus size={16} /> Add Contact
                </button>
              </div>

              {contactInfo.length === 0 ? (
                <div className={addStyles.emptyState}>
                  No contact info added yet. Click "Add Contact" to insert one.
                </div>
              ) : (
                <div className={addStyles.itemGrid}>
                  {contactInfo.map((contact, idx) => (
                    <div key={idx} className={addStyles.itemCard}>
                      <div>
                        <div className={addStyles.itemHeader}>
                          <span className={addStyles.itemTitle}>
                            {contact.name || "Contact"} {contact.position ? `(${contact.position})` : ""}
                          </span>
                        </div>
                        <div className={addStyles.itemContent}>
                          {contact.department && <div>Department: {contact.department}</div>}
                          {contact.email && <div>Email: {contact.email}</div>}
                          {contact.phone && <div>Phone: {contact.phone}</div>}
                          {contact.mobile && <div>Mobile: {contact.mobile}</div>}
                        </div>
                      </div>
                      <div className={addStyles.itemActions}>
                        <button
                          type="button"
                          className={`${addStyles.itemActionBtn} ${addStyles.editActionBtn}`}
                          onClick={() => openContactModal(idx)}
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          className={`${addStyles.itemActionBtn} ${addStyles.deleteActionBtn}`}
                          onClick={() => deleteContact(idx)}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <FileText size={22} color="var(--admin-primary, #004d4d)" /> Notes
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              {existingNotes.length > 0 && (
                <div
                  style={{
                    marginBottom: "1rem",
                    padding: "1rem",
                    background: "#f8fafc",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#94a3b8",
                      marginBottom: "0.75rem",
                      display: "block",
                    }}
                  >
                    PAST NOTES
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {existingNotes.map((n, index) => (
                      <div
                        key={n._id || index}
                        style={{
                          paddingBottom: index !== existingNotes.length - 1 ? "0.75rem" : "0",
                          borderBottom:
                            index !== existingNotes.length - 1 ? "1px solid #f1f5f9" : "none",
                        }}
                      >
                        <div
                          style={{
                            color: "#64748b",
                            fontSize: "0.7rem",
                            marginBottom: "0.25rem",
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "0.5rem",
                          }}
                        >
                          <span>{n.title || `Note ${index + 1}`}</span>
                          <span>{n.createdAt ? formatDateTime(n.createdAt) : ""}</span>
                        </div>
                        <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                          By {formatNoteAuthorLabel(n)}
                        </div>
                        <div style={{ color: "#475569", fontSize: "0.85rem", fontWeight: 500 }}>
                          {n.note}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label style={{ margin: 0 }}>New notes</label>
                <button
                  type="button"
                  className={addStyles.modalSaveBtn}
                  onClick={() => openNoteModal()}
                  style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                >
                  <Plus size={16} /> Add Note
                </button>
              </div>

              {notes.length === 0 ? (
                <div className={addStyles.emptyState}>
                  No notes added yet. Click "Add Note" to insert one.
                </div>
              ) : (
                <div className={addStyles.itemGrid}>
                  {notes.map((note, idx) => (
                    <div key={idx} className={addStyles.itemCard}>
                      <div>
                        <div className={addStyles.itemHeader}>
                          <span className={addStyles.itemTitle}>{note.title || "Note"}</span>
                        </div>
                        <div className={addStyles.itemContent}>
                          <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.35rem" }}>
                            By {formatNoteAuthorLabel(note)}
                          </div>
                          {note.note}
                        </div>
                      </div>
                      <div className={addStyles.itemActions}>
                        <button
                          type="button"
                          className={`${addStyles.itemActionBtn} ${addStyles.editActionBtn}`}
                          onClick={() => openNoteModal(idx)}
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          className={`${addStyles.itemActionBtn} ${addStyles.deleteActionBtn}`}
                          onClick={() => deleteNote(idx)}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <Calendar size={22} color="var(--admin-primary, #004d4d)" /> Activities
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              {existingActivityLog.length > 0 && (
                <div
                  style={{
                    marginBottom: "1rem",
                    padding: "1rem",
                    background: "#f8fafc",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#94a3b8",
                      marginBottom: "0.75rem",
                      display: "block",
                    }}
                  >
                    PAST ACTIVITIES
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {existingActivityLog.map((log, index) => (
                      <div
                        key={index}
                        style={{
                          paddingBottom:
                            index !== existingActivityLog.length - 1 ? "0.75rem" : "0",
                          borderBottom:
                            index !== existingActivityLog.length - 1
                              ? "1px solid #f1f5f9"
                              : "none",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#1e293b",
                            fontSize: "0.85rem",
                            marginBottom: "0.25rem",
                          }}
                        >
                          {log.activityType || "Activity"}
                        </div>
                        {log.date && (
                          <div style={{ color: "#64748b", fontSize: "0.75rem" }}>
                            {formatDateTime(log.date)}
                          </div>
                        )}
                        {log.outcome && (
                          <div style={{ color: "#475569", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                            {log.outcome}
                          </div>
                        )}
                        {log.notes && (
                          <div style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                            {log.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label style={{ margin: 0 }}>New activities</label>
                <button
                  type="button"
                  className={addStyles.modalSaveBtn}
                  onClick={() => openActivityModal()}
                  style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                >
                  <Plus size={16} /> Add Activity
                </button>
              </div>

              {activities.length === 0 ? (
                <div className={addStyles.emptyState}>
                  No activities added yet. Click &quot;Add Activity&quot; to insert one.
                </div>
              ) : (
                <div className={addStyles.itemGrid}>
                  {activities.map((activityItem, idx) => (
                    <div key={idx} className={addStyles.itemCard}>
                      <div>
                        <div className={addStyles.itemHeader}>
                          <span className={addStyles.itemTitle}>
                            {activityItem.activityType || "Activity"}
                          </span>
                        </div>
                        <div className={addStyles.itemContent}>
                          {activityItem.date && (
                            <div>Date: {new Date(activityItem.date).toLocaleString()}</div>
                          )}
                          {activityItem.outcome && <div>Outcome: {activityItem.outcome}</div>}
                          {activityItem.notes && <div>{activityItem.notes}</div>}
                        </div>
                      </div>
                      <div className={addStyles.itemActions}>
                        <button
                          type="button"
                          className={`${addStyles.itemActionBtn} ${addStyles.editActionBtn}`}
                          onClick={() => openActivityModal(idx)}
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          className={`${addStyles.itemActionBtn} ${addStyles.deleteActionBtn}`}
                          onClick={() => deleteActivity(idx)}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

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
            {saving ? (
              "Saving..."
            ) : (
              <>
                <Save size={20} /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCloseConfirmModal}
        onConfirm={handleModalConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        type={modalConfig.btnType}
        isLoading={converting || markingLost}
        confirmDisabled={modalConfig.type === "lost" && !lostReason.trim()}
      >
        {modalConfig.type === "lost" ? (
          <div>
            <label className={modalStyles.modalFieldLabel} htmlFor="lost-reason-edit">
              Lost Reason <span className={modalStyles.modalFieldRequired}>*</span>
            </label>
            <textarea
              id="lost-reason-edit"
              className={modalStyles.modalTextarea}
              placeholder="Enter why this lead was lost..."
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              disabled={markingLost}
            />
          </div>
        ) : null}
      </ConfirmationModal>

      {/* Modals */}
      {activeModal === "address" && (
        <div className={addStyles.modalBackdrop} onClick={() => setActiveModal(null)}>
          <div className={addStyles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={addStyles.modalHeader}>
              <h3 className={addStyles.modalTitle}>
                {editingIndex !== null ? "Edit Address" : "Add Address"}
              </h3>
              <button
                type="button"
                className={addStyles.closeBtn}
                onClick={() => setActiveModal(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={addStyles.modalBody}>
              <div className={styles.formGroup}>
                <label>Title</label>
                <input
                  type="text"
                  placeholder="e.g. Office, Warehouse"
                  className={styles.formInput}
                  value={tempAddress.title}
                  onChange={(e) => setTempAddress({ ...tempAddress, title: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Street</label>
                <input
                  type="text"
                  placeholder="Street Address"
                  className={styles.formInput}
                  value={tempAddress.street}
                  onChange={(e) => setTempAddress({ ...tempAddress, street: e.target.value })}
                />
              </div>
              <UsaAddressFields
                city={tempAddress.city}
                state={tempAddress.state}
                zip={tempAddress.zip}
                onChange={(updates) =>
                  setTempAddress((prev) => ({ ...prev, ...updates }))
                }
                formGroupClassName={styles.formGroup}
                formSelectClassName={styles.formSelect}
              />
            </div>
            <div className={addStyles.modalFooter}>
              <button
                type="button"
                className={addStyles.modalCancelBtn}
                onClick={() => setActiveModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={addStyles.modalSaveBtn}
                onClick={saveAddress}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "contact" && (
        <div className={addStyles.modalBackdrop} onClick={() => setActiveModal(null)}>
          <div className={addStyles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={addStyles.modalHeader}>
              <h3 className={addStyles.modalTitle}>
                {editingIndex !== null ? "Edit Contact Info" : "Add Contact Info"}
              </h3>
              <button
                type="button"
                className={addStyles.closeBtn}
                onClick={() => setActiveModal(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={addStyles.modalBody}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className={styles.formGroup}>
                  <label>Name</label>
                  <input
                    type="text"
                    placeholder="Name"
                    className={styles.formInput}
                    value={tempContact.name}
                    onChange={(e) => setTempContact({ ...tempContact, name: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="Email"
                    className={styles.formInput}
                    value={tempContact.email}
                    onChange={(e) => setTempContact({ ...tempContact, email: e.target.value })}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className={styles.formGroup}>
                  <label>Position</label>
                  <input
                    type="text"
                    placeholder="e.g. CEO, Manager"
                    className={styles.formInput}
                    value={tempContact.position}
                    onChange={(e) => setTempContact({ ...tempContact, position: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Operations"
                    className={styles.formInput}
                    value={tempContact.department}
                    onChange={(e) => setTempContact({ ...tempContact, department: e.target.value })}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input
                    type="text"
                    placeholder="Phone"
                    className={styles.formInput}
                    value={tempContact.phone}
                    onChange={(e) => setTempContact({ ...tempContact, phone: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Mobile</label>
                  <input
                    type="text"
                    placeholder="Mobile"
                    className={styles.formInput}
                    value={tempContact.mobile}
                    onChange={(e) => setTempContact({ ...tempContact, mobile: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className={addStyles.modalFooter}>
              <button
                type="button"
                className={addStyles.modalCancelBtn}
                onClick={() => setActiveModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={addStyles.modalSaveBtn}
                onClick={saveContact}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "activity" && (
        <div className={addStyles.modalBackdrop} onClick={() => setActiveModal(null)}>
          <div className={addStyles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={addStyles.modalHeader}>
              <h3 className={addStyles.modalTitle}>
                {editingIndex !== null ? "Edit Activity" : "Add Activity"}
              </h3>
              <button
                type="button"
                className={addStyles.closeBtn}
                onClick={() => setActiveModal(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={addStyles.modalBody}>
              <div className={styles.formGroup}>
                <label>
                  Activity Type <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  className={styles.formSelect}
                  value={tempActivity.activityType}
                  onChange={(e) =>
                    setTempActivity({ ...tempActivity, activityType: e.target.value })
                  }
                >
                  <option value="Call">Call</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Email">Email</option>
                  <option value="Site Visit">Site Visit</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Date</label>
                <input
                  type="datetime-local"
                  className={styles.formInput}
                  value={tempActivity.date}
                  onChange={(e) =>
                    setTempActivity({ ...tempActivity, date: e.target.value })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>Outcome</label>
                <input
                  type="text"
                  placeholder="e.g. Left voicemail"
                  className={styles.formInput}
                  value={tempActivity.outcome}
                  onChange={(e) =>
                    setTempActivity({ ...tempActivity, outcome: e.target.value })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>Notes</label>
                <textarea
                  placeholder="Activity notes..."
                  className={styles.formInput}
                  rows={3}
                  value={tempActivity.notes}
                  onChange={(e) =>
                    setTempActivity({ ...tempActivity, notes: e.target.value })
                  }
                  style={{ resize: "vertical", minHeight: 80 }}
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className={styles.formGroup}>
                  <label>Follow Up Date</label>
                  <input
                    type="datetime-local"
                    className={styles.formInput}
                    value={tempActivity.followUpDate}
                    onChange={(e) =>
                      setTempActivity({ ...tempActivity, followUpDate: e.target.value })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Next Follow Up Date</label>
                  <input
                    type="datetime-local"
                    className={styles.formInput}
                    value={tempActivity.nextFollowUpDate}
                    onChange={(e) =>
                      setTempActivity({
                        ...tempActivity,
                        nextFollowUpDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className={addStyles.modalFooter}>
              <button
                type="button"
                className={addStyles.modalCancelBtn}
                onClick={() => setActiveModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={addStyles.modalSaveBtn}
                onClick={saveActivity}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "note" && (
        <div className={addStyles.modalBackdrop} onClick={() => setActiveModal(null)}>
          <div className={addStyles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={addStyles.modalHeader}>
              <h3 className={addStyles.modalTitle}>
                {editingIndex !== null ? "Edit Note" : "Add Note"}
              </h3>
              <button
                type="button"
                className={addStyles.closeBtn}
                onClick={() => setActiveModal(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={addStyles.modalBody}>
              <div className={styles.formGroup}>
                <label>Title</label>
                <input
                  type="text"
                  placeholder="e.g. Call logs"
                  className={styles.formInput}
                  value={tempNote.title}
                  onChange={(e) => setTempNote({ ...tempNote, title: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Note</label>
                <textarea
                  placeholder="Note text..."
                  className={styles.formInput}
                  rows={4}
                  value={tempNote.note}
                  onChange={(e) => setTempNote({ ...tempNote, note: e.target.value })}
                  style={{ resize: "vertical", minHeight: 100 }}
                />
              </div>
            </div>
            <div className={addStyles.modalFooter}>
              <button
                type="button"
                className={addStyles.modalCancelBtn}
                onClick={() => setActiveModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={addStyles.modalSaveBtn}
                onClick={saveNote}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
