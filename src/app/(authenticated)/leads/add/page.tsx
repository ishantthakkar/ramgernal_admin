"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../../dashboard.module.css";
import addStyles from "./leads-add.module.css";
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

function formatActivityDate(value: string): string {
  if (!value.trim()) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toDateInputValue(value: string): string {
  if (!value.trim()) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}
import { adminApi } from "@/lib/api";
import { formatNoteAuthorLabel, withNoteAuthor } from "@/lib/leadNotes";
import { persistLeadActivities, persistLeadNotes } from "@/lib/leadPersistence";
import { toast } from "react-toastify";
import { UsaAddressFields } from "@/components/address/usa-address-fields";
import ConfirmationModal from "@/components/modals/ConfirmationModal";

interface LeadSourceOption {
  code: string;
  name: string;
}

interface SalesPersonOption {
  id: string;
  fullName?: string;
  email?: string;
}

interface LeadAddressInput {
  title: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface LeadContactInput {
  position: string;
  department: string;
  name: string;
  phone: string;
  mobile: string;
  email: string;
  businessCardFiles: File[];
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

export default function AddLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCreateConfirmModal, setShowCreateConfirmModal] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [leadSources, setLeadSources] = useState<LeadSourceOption[]>([]);
  const [salesPersons, setSalesPersons] = useState<SalesPersonOption[]>([]);
  const billInputRef = useRef<HTMLInputElement>(null);
  const contactCardInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    email: "",
    mobileNumber: "",
    leadName: "",
    dba: "",
    legalName: "",
    accountNumber: "",
    electricCompany: "",
    billDate: "",
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
    position: "", department: "", name: "", phone: "", mobile: "", email: "", businessCardFiles: []
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
      setAddresses(prev => prev.map((item, i) => i === editingIndex ? tempAddress : item));
    } else {
      setAddresses(prev => [...prev, tempAddress]);
    }
    setActiveModal(null);
    setEditingIndex(null);
  };

  const deleteAddress = (index: number) => {
    setAddresses(prev => prev.filter((_, i) => i !== index));
  };

  const contactCardPreviews = useMemo(() => {
    return tempContact.businessCardFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
  }, [tempContact.businessCardFiles]);

  useEffect(() => {
    return () => {
      contactCardPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [contactCardPreviews]);

  const openContactModal = (index?: number) => {
    if (index !== undefined) {
      setTempContact({
        ...contactInfo[index],
        businessCardFiles: contactInfo[index].businessCardFiles || [],
      });
      setEditingIndex(index);
    } else {
      setTempContact({
        position: "Manager",
        department: "Ops",
        name: "",
        phone: "",
        mobile: "",
        email: "",
        businessCardFiles: [],
      });
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
      setContactInfo(prev => prev.map((item, i) => i === editingIndex ? tempContact : item));
    } else {
      setContactInfo(prev => [...prev, tempContact]);
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
    async function loadOptions() {
      setLoadingOptions(true);
      try {
        const [sourcesRes, salesRes] = await Promise.all([
          adminApi.getLeadSources(),
          adminApi.getLeadSalesPersons(),
        ]);
        setLeadSources(sourcesRes.leadSources || []);
        setSalesPersons(salesRes.salesPersons || []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load form options";
        toast.error(message);
      } finally {
        setLoadingOptions(false);
      }
    }
    loadOptions();
  }, []);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.leadSource) {
      toast.error("Please select a lead source.");
      return;
    }
    if (!formData.leadName.trim()) {
      toast.error("Please enter a lead name.");
      return;
    }

    setShowCreateConfirmModal(true);
  };

  async function createLead() {
    setLoading(true);

    try {
      const data = new FormData();
      const leadName = formData.leadName.trim();
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

      if (formData.salesPersonId) {
        data.append("salesPersonId", formData.salesPersonId);
      }

      const cleanedAddresses = addresses
        .map((a) => ({
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

      const contactsForSubmit = contactInfo
        .map((c) => ({
          contact: {
            position: c.position.trim(),
            department: c.department.trim(),
            name: c.name.trim(),
            phone: c.phone.trim(),
            mobile: c.mobile.trim(),
            email: c.email.trim(),
          },
          businessCardFiles: c.businessCardFiles || [],
        }))
        .filter(
          ({ contact, businessCardFiles }) =>
            contact.position ||
            contact.department ||
            contact.name ||
            contact.phone ||
            contact.mobile ||
            contact.email ||
            businessCardFiles.length > 0
        );

      if (contactsForSubmit.length > 0) {
        data.append(
          "contactInfo",
          JSON.stringify(contactsForSubmit.map(({ contact }) => contact))
        );
        contactsForSubmit.forEach(({ businessCardFiles }, idx) => {
          for (const file of businessCardFiles) {
            data.append(`contact_business_card_${idx}`, file);
          }
        });
      }

      const cleanedNotes = notes
        .map((n) => ({
          title: n.title.trim(),
          note: n.note.trim(),
        }))
        .filter((n) => n.note);

      const cleanedActivities = activities
        .map((a) => ({
          activityType: a.activityType.trim(),
          date: toIsoOrEmpty(a.date) || new Date().toISOString(),
          outcome: a.outcome.trim(),
          notes: a.notes.trim(),
          followUpDate: toIsoOrEmpty(a.followUpDate),
          nextFollowUpDate: toIsoOrEmpty(a.nextFollowUpDate),
        }))
        .filter((a) => a.activityType);

      for (const file of billFiles) {
        data.append("upload_electricity_bill", file);
      }

      if (formData.billDate.trim()) {
        const billDateIso = toIsoOrEmpty(formData.billDate);
        if (billDateIso) {
          data.append("billDate", billDateIso);
        }
      }

      const result = await adminApi.createLead(data);
      const createdLead = result.lead || result.data || result;
      const leadId = createdLead?._id || createdLead?.id;
      if (leadId) {
        await persistLeadNotes(String(leadId), cleanedNotes);
        await persistLeadActivities(String(leadId), cleanedActivities);
      }
      toast.success("Lead created successfully!");
      setShowCreateConfirmModal(false);
      router.push("/leads");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create lead. Please check your data.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingOptions) {
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
        <span className={styles.breadcrumbCurrent}>ADD NEW LEAD</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Create New Lead</h1>
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
              <label>Bill Date</label>
              <input
                name="billDate"
                type="date"
                className={styles.formInput}
                value={formData.billDate}
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
                          {(contact.businessCardFiles?.length ?? 0) > 0 && (
                            <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#64748b" }}>
                              {contact.businessCardFiles.length} contact card
                              {contact.businessCardFiles.length === 1 ? "" : "s"} attached
                            </div>
                          )}
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label style={{ margin: 0 }}>Notes</label>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label style={{ margin: 0 }}>Activity log</label>
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
                          {activityItem.followUpDate && (
                            <div>Follow Up Date: {formatActivityDate(activityItem.followUpDate)}</div>
                          )}
                          {activityItem.nextFollowUpDate && (
                            <div>
                              Next Follow Up Date: {formatActivityDate(activityItem.nextFollowUpDate)}
                            </div>
                          )}
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
            onClick={() => router.push("/leads")}
            disabled={loading}
          >
            <X size={20} /> Cancel
          </button>
          <button type="submit" className={styles.createBtn} disabled={loading}>
            {loading ? (
              "Creating..."
            ) : (
              <>
                <Plus size={20} /> Create Lead
              </>
            )}
          </button>
        </div>
      </form>

      <ConfirmationModal
        isOpen={showCreateConfirmModal}
        onClose={() => {
          if (!loading) setShowCreateConfirmModal(false);
        }}
        onConfirm={createLead}
        title="Create Lead?"
        message={`Are you sure you want to create the lead "${formData.leadName.trim()}"?`}
        confirmText="Yes, Create Lead"
        cancelText="Cancel"
        type="success"
        isLoading={loading}
      />

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
                flow="zipFirst"
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
              <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
                <label>Contact Card</label>
                <input
                  ref={contactCardInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className={styles.formInput}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setTempContact((prev) => {
                      const nextFiles = [...prev.businessCardFiles];
                      for (const file of files) {
                        const key = `${file.name}:${file.size}:${file.lastModified}`;
                        const exists = nextFiles.some(
                          (f) => `${f.name}:${f.size}:${f.lastModified}` === key
                        );
                        if (!exists) nextFiles.push(file);
                      }
                      return { ...prev, businessCardFiles: nextFiles };
                    });
                    if (contactCardInputRef.current) contactCardInputRef.current.value = "";
                  }}
                />
                {contactCardPreviews.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    {contactCardPreviews.map((preview) => (
                      <div
                        key={`${preview.file.name}:${preview.file.size}:${preview.file.lastModified}`}
                        style={{
                          width: 120,
                          border: "1px solid #e2e8f0",
                          borderRadius: 10,
                          overflow: "hidden",
                          background: "#ffffff",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preview.url}
                          alt={preview.file.name}
                          style={{ width: "100%", height: 80, objectFit: "cover" }}
                        />
                        <div style={{ padding: "0.4rem 0.5rem" }}>
                          <div
                            title={preview.file.name}
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#334155",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {preview.file.name}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setTempContact((prev) => ({
                                ...prev,
                                businessCardFiles: prev.businessCardFiles.filter(
                                  (file) =>
                                    `${file.name}:${file.size}:${file.lastModified}` !==
                                    `${preview.file.name}:${preview.file.size}:${preview.file.lastModified}`
                                ),
                              }))
                            }
                            style={{
                              marginTop: "0.25rem",
                              fontSize: 11,
                              color: "#ef4444",
                              fontWeight: 600,
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                            }}
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
                    type="date"
                    className={styles.formInput}
                    value={toDateInputValue(tempActivity.followUpDate)}
                    onChange={(e) =>
                      setTempActivity({ ...tempActivity, followUpDate: e.target.value })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Next Follow Up Date</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={toDateInputValue(tempActivity.nextFollowUpDate)}
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
