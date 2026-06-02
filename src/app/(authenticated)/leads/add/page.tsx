"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../../dashboard.module.css";
import {
  X,
  FileText,
  Info,
  Loader2,
  ChevronDown,
  UserPlus,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";

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
}

interface LeadNoteInput {
  title: string;
  note: string;
}

export default function AddLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [leadSources, setLeadSources] = useState<LeadSourceOption[]>([]);
  const [salesPersons, setSalesPersons] = useState<SalesPersonOption[]>([]);
  const billInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    company: "",
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

  const [addresses, setAddresses] = useState<LeadAddressInput[]>([
    { title: "Office", street: "", city: "", state: "", zip: "" },
  ]);
  const [contactInfo, setContactInfo] = useState<LeadContactInput[]>([
    { position: "Manager", department: "Ops", name: "", phone: "", mobile: "", email: "" },
  ]);
  const [notes, setNotes] = useState<LeadNoteInput[]>([
    { title: "", note: "" },
  ]);

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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.leadSource) {
      toast.error("Please select a lead source.");
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append("leadSource", formData.leadSource);
      data.append("name", formData.name.trim());
      data.append("company", formData.company.trim());
      data.append("mobileNumber", formData.mobileNumber.trim());
      if (formData.email.trim()) data.append("email", formData.email.trim());

      if (formData.leadName.trim()) data.append("leadName", formData.leadName.trim());
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

      const cleanedContacts = contactInfo
        .map((c) => ({
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

      const cleanedNotes = notes
        .map((n) => ({ title: n.title.trim(), note: n.note.trim() }))
        .filter((n) => n.title || n.note);
      if (cleanedNotes.length > 0) {
        data.append("notes", JSON.stringify(cleanedNotes));
      }

      for (const file of billFiles) {
        data.append("upload_electricity_bill", file);
      }

      await adminApi.createLead(data);
      toast.success("Lead created successfully!");
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
                Full Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                name="name"
                type="text"
                placeholder="e.g. Marcus Aurelius"
                className={styles.formInput}
                value={formData.name}
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
              <label>Electricity Bills (images / PDF)</label>
              <input
                ref={billInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                className={styles.formInput}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  // append (so user can select multiple times)
                  setBillFiles((prev) => {
                    const next = [...prev];
                    for (const file of files) {
                      // de-dupe by name+size+lastModified
                      const key = `${file.name}:${file.size}:${file.lastModified}`;
                      const has = next.some(
                        (f) => `${f.name}:${f.size}:${f.lastModified}` === key
                      );
                      if (!has) next.push(file);
                    }
                    return next;
                  });
                  // allow re-selecting same file
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
          </div>
        </section>

        <section className={styles.formSection}>
          <div className={styles.sectionTitle}>
            <FileText size={22} color="var(--admin-primary, #004d4d)" /> Contact & Address
          </div>

          <div className={styles.formGrid}>
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
            <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
              <label>Addresses</label>
              <div style={{ display: "grid", gap: "1rem" }}>
                {addresses.map((address, idx) => (
                  <div
                    key={idx}
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
                    key={idx}
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
              <label>Notes</label>
              <div style={{ display: "grid", gap: "1rem" }}>
                {notes.map((note, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      borderRadius: 10,
                      padding: "1rem",
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: "0.75rem",
                    }}
                  >
                    <div className={styles.formGroup}>
                      <label style={{ paddingLeft: 0 }}>Title</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={note.title}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNotes((prev) =>
                            prev.map((n, i) => (i === idx ? { ...n, title: value } : n))
                          );
                        }}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label style={{ paddingLeft: 0 }}>Note</label>
                      <textarea
                        className={styles.formInput}
                        rows={3}
                        value={note.note}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNotes((prev) =>
                            prev.map((n, i) => (i === idx ? { ...n, note: value } : n))
                          );
                        }}
                        style={{ resize: "vertical", minHeight: 88 }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className={styles.assignBtn}
                        onClick={() => setNotes((prev) => prev.filter((_, i) => i !== idx))}
                        disabled={notes.length === 1}
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
                    onClick={() => setNotes((prev) => [...prev, { title: "", note: "" }])}
                  >
                    Add Note
                  </button>
                </div>
              </div>
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
                <UserPlus size={20} /> Create Lead
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
