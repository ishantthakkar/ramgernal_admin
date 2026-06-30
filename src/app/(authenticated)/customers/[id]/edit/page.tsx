"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "../../../dashboard.module.css";
import addStyles from "../../../leads/add/leads-add.module.css";
import {
  X,
  Info,
  Loader2,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Users,
  FileText,
  Save,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { formatNoteAuthorLabel, withNoteAuthor } from "@/lib/leadNotes";
import { formatDateTime } from "@/lib/dateUtils";
import { toast } from "react-toastify";
import { UsaAddressFields } from "@/components/address/usa-address-fields";

const SECTION_ICON_COLOR = "var(--admin-primary, #004d4d)";

const ELECTRIC_COMPANIES = [
  "PSE&G",
  "JCP&L",
  "ATLANTIC CITY ENERGY",
] as const;

interface LeadSourceOption {
  code: string;
  name: string;
}

interface AddressInput {
  id?: string;
  title: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface ContactInput {
  id?: string;
  position: string;
  department: string;
  name: string;
  phone: string;
  mobile: string;
  email: string;
}

interface NoteInput {
  title: string;
  note: string;
  writtenByName?: string;
  writtenByEmail?: string;
  writtenByRole?: string;
}

function formatUsPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "New":
      return "#3b82f6";
    case "in_progress":
    case "In Progress":
      return "#f59e0b";
    case "completed":
    case "Completed":
      return "#10b981";
    case "reopen":
      return "#8b5cf6";
    case "pending_edit_approval":
      return "#ef4444";
    default:
      return "#64748b";
  }
}

function mapAddressesFromCustomer(customer: Record<string, unknown>): AddressInput[] {
  const list = Array.isArray(customer.addresses) ? customer.addresses : [];
  if (list.length > 0) {
    return (list as Record<string, unknown>[]).map((a) => ({
      id: (a._id || a.id) as string | undefined,
      title: String(a.title || ""),
      street: String(a.street || ""),
      city: String(a.city || ""),
      state: String(a.state || ""),
      zip: String(a.zip || ""),
    }));
  }
  const legacy = customer.address as Record<string, string> | undefined;
  if (legacy && (legacy.street || legacy.city || legacy.state || legacy.zip)) {
    return [
      {
        title: "Primary Address",
        street: legacy.street || "",
        city: legacy.city || "",
        state: legacy.state || "",
        zip: legacy.zip || "",
      },
    ];
  }
  return [];
}

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leadSources, setLeadSources] = useState<LeadSourceOption[]>([]);
  const [leadIdLabel, setLeadIdLabel] = useState("");
  const [customerStatus, setCustomerStatus] = useState("New");
  const [existingNotes, setExistingNotes] = useState<Record<string, unknown>[]>([]);

  const [formData, setFormData] = useState({
    leadName: "",
    email: "",
    mobileNumber: "",
    dba: "",
    legalName: "",
    accountNumber: "",
    electricCompany: "",
    leadSource: "",
  });
  const [addresses, setAddresses] = useState<AddressInput[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInput[]>([]);
  const [notes, setNotes] = useState<NoteInput[]>([]);

  const [activeModal, setActiveModal] = useState<"address" | "contact" | "note" | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempAddress, setTempAddress] = useState<AddressInput>({
    title: "",
    street: "",
    city: "",
    state: "",
    zip: "",
  });
  const [tempContact, setTempContact] = useState<ContactInput>({
    position: "",
    department: "",
    name: "",
    phone: "",
    mobile: "",
    email: "",
  });
  const [tempNote, setTempNote] = useState<NoteInput>({ title: "", note: "" });

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
        prev.map((item, i) => (i === editingIndex ? { ...item, ...tempAddress } : item))
      );
    } else {
      setAddresses((prev) => [...prev, tempAddress]);
    }
    setActiveModal(null);
    setEditingIndex(null);
  };

  const deleteAddress = (index: number) => {
    setAddresses((prev) => prev.filter((_, i) => i !== index));
  };

  const openContactModal = (index?: number) => {
    if (index !== undefined) {
      setTempContact(contactInfo[index]);
      setEditingIndex(index);
    } else {
      setTempContact({
        position: "Manager",
        department: "Ops",
        name: "",
        phone: "",
        mobile: "",
        email: "",
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
      setContactInfo((prev) =>
        prev.map((item, i) => (i === editingIndex ? { ...item, ...tempContact } : item))
      );
    } else {
      setContactInfo((prev) => [...prev, tempContact]);
    }
    setActiveModal(null);
    setEditingIndex(null);
  };

  const deleteContact = (index: number) => {
    setContactInfo((prev) => prev.filter((_, i) => i !== index));
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
    setNotes((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setFetching(true);
      try {
        const [customerRes, sourcesRes] = await Promise.all([
          adminApi.getCustomerWorkflowDetails(id),
          adminApi.getLeadSources().catch(() => ({ leadSources: [] })),
        ]);
        const customer = (customerRes.customer || {}) as Record<string, unknown>;
        const leadRecord =
          customer.leadId && typeof customer.leadId === "object"
            ? (customer.leadId as Record<string, unknown>)
            : null;
        setLeadSources(sourcesRes.leadSources || []);

        setLeadIdLabel(String(customer.lead_id || leadRecord?.lead_id || customer.leadId || ""));
        setCustomerStatus(String(customer.status || "New"));

        setFormData({
          leadName: String(customer.leadName || leadRecord?.leadName || leadRecord?.name || customer.name || ""),
          email: String(customer.email || ""),
          mobileNumber: customer.mobileNumber
            ? formatUsPhone(String(customer.mobileNumber))
            : "",
          dba: String(customer.dba || leadRecord?.dba || ""),
          legalName: String(customer.legalName || ""),
          accountNumber: String(customer.accountNumber || ""),
          electricCompany: String(customer.electricCompany || leadRecord?.electricCompany || ""),
          leadSource: String(customer.leadSource || ""),
        });

        setExistingNotes(Array.isArray(customer.notes) ? (customer.notes as Record<string, unknown>[]) : []);
        setAddresses(mapAddressesFromCustomer(customer));
        setContactInfo(
          Array.isArray(customer.contactInfo)
            ? (customer.contactInfo as Record<string, unknown>[]).map((c) => ({
                id: (c._id || c.id) as string | undefined,
                position: String(c.position || ""),
                department: String(c.department || ""),
                name: String(c.name || ""),
                phone: String(c.phone || ""),
                mobile: String(c.mobile || ""),
                email: String(c.email || ""),
              }))
            : []
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load customer details";
        toast.error(message);
      } finally {
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

      data.append("leadName", leadName);
      data.append("name", leadName);
      data.append("leadSource", formData.leadSource);
      data.append("lastActivity", new Date().toISOString());

      if (formData.email.trim()) data.append("email", formData.email.trim());
      if (formData.mobileNumber.trim()) data.append("mobileNumber", formData.mobileNumber.trim());
      if (formData.dba.trim()) data.append("dba", formData.dba.trim());
      if (formData.legalName.trim()) data.append("legalName", formData.legalName.trim());
      if (formData.accountNumber.trim()) data.append("accountNumber", formData.accountNumber.trim());
      if (formData.electricCompany.trim()) data.append("electricCompany", formData.electricCompany.trim());

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

      if (cleanedAddresses.length > 0) {
        const primary = cleanedAddresses[0];
        data.append(
          "address",
          JSON.stringify({
            street: primary.street,
            city: primary.city,
            state: primary.state,
            zip: primary.zip,
          })
        );
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

      await adminApi.updateCustomerWorkflow(id, data);
      toast.success("Customer updated successfully!");
      router.push(`/customers/${id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update customer.";
      toast.error(message);
    } finally {
      setSaving(false);
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
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/customers")}>
          CUSTOMERS
        </span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push(`/customers/${id}`)}>
          VIEW CUSTOMER
        </span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>EDIT CUSTOMER</span>
      </div>

      <div className={styles.pageHeader} style={{ marginBottom: "2.5rem" }}>
        <div>
          <h1 className={styles.welcomeText}>Edit Customer</h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                backgroundColor: `${getStatusColor(customerStatus)}15`,
                color: getStatusColor(customerStatus),
                padding: "0.25rem 0.75rem",
                borderRadius: "99px",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {customerStatus}
            </span>
            {leadIdLabel ? (
              <span
                style={{
                  backgroundColor: "#f1f5f9",
                  color: "#334155",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "99px",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                {leadIdLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <Info size={22} color={SECTION_ICON_COLOR} /> Customer Information
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
            <div className={styles.formGroup}>
              <label>Account Number</label>
              <input
                name="accountNumber"
                type="text"
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
                className={styles.formInput}
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <MapPin size={22} color={SECTION_ICON_COLOR} /> Address Information
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
                  No addresses added yet. Click &quot;Add Address&quot; to insert one.
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
                            <div>{[address.city, address.state, address.zip].filter(Boolean).join(", ")}</div>
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
            <Users size={22} color={SECTION_ICON_COLOR} /> Contact Information
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
                  No contacts added yet. Click &quot;Add Contact&quot; to insert one.
                </div>
              ) : (
                <div className={addStyles.itemGrid}>
                  {contactInfo.map((contact, idx) => (
                    <div key={idx} className={addStyles.itemCard}>
                      <div>
                        <div className={addStyles.itemHeader}>
                          <span className={addStyles.itemTitle}>
                            {contact.name || "Contact"}
                            {contact.position ? ` (${contact.position})` : ""}
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
            <FileText size={22} color={SECTION_ICON_COLOR} /> Notes
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
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: "0.75rem", display: "block" }}>
                    PAST NOTES
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {existingNotes.map((n, index) => (
                      <div
                        key={(n._id as string) || index}
                        style={{
                          paddingBottom: index !== existingNotes.length - 1 ? "0.75rem" : "0",
                          borderBottom: index !== existingNotes.length - 1 ? "1px solid #f1f5f9" : "none",
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
                          <span>{String(n.title || `Note ${index + 1}`)}</span>
                          <span>{n.createdAt ? formatDateTime(n.createdAt as string) : ""}</span>
                        </div>
                        <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                          By {formatNoteAuthorLabel(n)}
                        </div>
                        <div style={{ color: "#475569", fontSize: "0.85rem", fontWeight: 500 }}>
                          {String(n.note || "")}
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
                  No notes added yet. Click &quot;Add Note&quot; to insert one.
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

        <div className={styles.actionFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => router.push(`/customers/${id}`)}
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

      {activeModal === "address" && (
        <div className={addStyles.modalBackdrop} onClick={() => setActiveModal(null)}>
          <div className={addStyles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={addStyles.modalHeader}>
              <h3 className={addStyles.modalTitle}>{editingIndex !== null ? "Edit Address" : "Add Address"}</h3>
              <button type="button" className={addStyles.closeBtn} onClick={() => setActiveModal(null)}>
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
              <button type="button" className={addStyles.modalCancelBtn} onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button type="button" className={addStyles.modalSaveBtn} onClick={saveAddress}>
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
              <h3 className={addStyles.modalTitle}>{editingIndex !== null ? "Edit Contact" : "Add Contact"}</h3>
              <button type="button" className={addStyles.closeBtn} onClick={() => setActiveModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className={addStyles.modalBody}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className={styles.formGroup}>
                  <label>Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={tempContact.name}
                    onChange={(e) => setTempContact({ ...tempContact, name: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    className={styles.formInput}
                    value={tempContact.email}
                    onChange={(e) => setTempContact({ ...tempContact, email: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className={styles.formGroup}>
                  <label>Position</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={tempContact.position}
                    onChange={(e) => setTempContact({ ...tempContact, position: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Department</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={tempContact.department}
                    onChange={(e) => setTempContact({ ...tempContact, department: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={tempContact.phone}
                    onChange={(e) => setTempContact({ ...tempContact, phone: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Mobile</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={tempContact.mobile}
                    onChange={(e) => setTempContact({ ...tempContact, mobile: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className={addStyles.modalFooter}>
              <button type="button" className={addStyles.modalCancelBtn} onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button type="button" className={addStyles.modalSaveBtn} onClick={saveContact}>
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
              <h3 className={addStyles.modalTitle}>{editingIndex !== null ? "Edit Note" : "Add Note"}</h3>
              <button type="button" className={addStyles.closeBtn} onClick={() => setActiveModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className={addStyles.modalBody}>
              <div className={styles.formGroup}>
                <label>Title</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={tempNote.title}
                  onChange={(e) => setTempNote({ ...tempNote, title: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Note</label>
                <textarea
                  className={styles.formInput}
                  rows={4}
                  value={tempNote.note}
                  onChange={(e) => setTempNote({ ...tempNote, note: e.target.value })}
                  style={{ resize: "vertical", minHeight: 100 }}
                />
              </div>
            </div>
            <div className={addStyles.modalFooter}>
              <button type="button" className={addStyles.modalCancelBtn} onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button type="button" className={addStyles.modalSaveBtn} onClick={saveNote}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
