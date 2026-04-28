"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "./commission-edit.module.css";
import dashboardStyles from "../../../dashboard.module.css";
import modalStyles from "../../commissions-modal.module.css";
import {
  X,
  Save,
  Plus,
  Trash2,
  ChevronDown,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";

interface ApiCommission {
  _id: string;
  commissionType: string;
  salesPerson: string | null;
  contractor: string | null;
  otherName?: string;
  amount: number;
  paidAmount: number;
  paymentMethod: string;
  paymentDate: string;
  paymentStatus: string;
  date: string;
  paidTo: string;
  pending: number;
}

interface ApiCustomer {
  id: string;
  name: string;
  company: string;
  salesPerson: string;
  contractor: string;
  total_overall_amount: number;
  total_paid_amount: number;
  total_pending_amount: number;
  commissions: ApiCommission[];
}

const PAYMENT_METHODS = [
  "Cash",
  "ACH Transfer",
  "Wire Transfer",
  "Check",
  "Credit Card",
  "Debit Card",
  "PayPal",
  "Stripe",
  "Other",
];

export default function EditCommissionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customer, setCustomer] = useState<ApiCustomer | null>(null);
  const [customerDetails, setCustomerDetails] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [commissionResponse, detailsResponse] = await Promise.all([
          adminApi.getCommissionList(),
          adminApi.getCustomerWorkflowDetails(id),
        ]);
        const found = (commissionResponse.customers || []).find((c: ApiCustomer) => c.id === id);
        if (found) {
          setCustomer(found);
        } else {
          toast.error("Customer not found.");
        }
        if (detailsResponse?.customer) {
          setCustomerDetails(detailsResponse.customer);
        }
      } catch (err: any) {
        console.error("Failed to fetch commissions:", err);
        toast.error(err.message || "Failed to load commission data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const [formData, setFormData] = useState({
    commissionType: "Survey Commission" as string,
    commissionName: "",
    customerName: "",
    companyName: "",
    paidTo: "",
    totalAmount: "",
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        commissionType: customer.commissions[0]?.commissionType || "Survey Commission",
        commissionName: customer.commissions[0]?.otherName || "",
        customerName: customer.name,
        companyName: customer.company,
        paidTo: customer.commissions[0]?.paidTo || customer.salesPerson,
        totalAmount: (customer.total_overall_amount || 0).toString(),
      });
    }
  }, [customer]);

  // Add commission modal state
  const [addFormData, setAddFormData] = useState({
    commissionType: "" as string,
    commissionName: "",
    customerName: "",
    companyName: "",
    paidTo: "",
    totalAmount: "",
  });
  const [addPayments, setAddPayments] = useState<
    { id: string; paidAmount: string; paymentMethod: string; paymentDate: string }[]
  >([]);

  useEffect(() => {
    if (customer) {
      setAddFormData((prev) => ({
        ...prev,
        customerName: customer.name,
        companyName: customer.company,
        paidTo: customer.salesPerson,
      }));
    }
  }, [customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSaving(false);
    router.push("/commissions");
  };

  // Add commission modal handlers
  const handleAddFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "commissionType") {
        next.commissionName = "";
        next.paidTo = "";
      }
      return next;
    });
  };

  const getPaidToOptions = () => {
    if (!customer) return [];
    if (addFormData.commissionType === "Survey Commission") return customer.salesPerson ? [customer.salesPerson] : [];
    if (addFormData.commissionType === "Installation Commission") return customer.contractor ? [customer.contractor] : [];
    if (addFormData.commissionType === "Others") {
      const opts = [];
      if (customer.salesPerson) opts.push(customer.salesPerson);
      if (customer.contractor) opts.push(customer.contractor);
      return opts;
    }
    return [];
  };

  const addPaymentRow = () => {
    setAddPayments((prev) => [
      ...prev,
      { id: Math.random().toString(36).substr(2, 9), paidAmount: "", paymentMethod: "", paymentDate: "" },
    ]);
  };

  const removePaymentRow = (pid: string) => {
    setAddPayments((prev) => prev.filter((p) => p.id !== pid));
  };

  const updatePaymentRow = (pid: string, field: string, value: string) => {
    setAddPayments((prev) => prev.map((p) => (p.id === pid ? { ...p, [field]: value } : p)));
  };

  const computedPaid = useMemo(() => {
    return addPayments.reduce((sum, p) => sum + (parseFloat(p.paidAmount) || 0), 0);
  }, [addPayments]);

  const computedPending = useMemo(() => {
    return (parseFloat(addFormData.totalAmount) || 0) - computedPaid;
  }, [addFormData.totalAmount, computedPaid]);

  const isAddFormValid = () => {
    return (
      addFormData.commissionType &&
      addFormData.customerName &&
      addFormData.companyName &&
      addFormData.paidTo &&
      addFormData.totalAmount &&
      (addFormData.commissionType !== "Others" || addFormData.commissionName)
    );
  };

  const handleSaveNewCommission = async () => {
    if (!customer) return;
    try {
      setSaving(true);

      const mapCommissionType = (type: string) => {
        if (type === "Survey Commission") return "Survey";
        if (type === "Installation Commission") return "Installation";
        return "Other";
      };

      const newCommission: any = {
        commission_type: mapCommissionType(addFormData.commissionType),
        amount: parseFloat(addFormData.totalAmount) || 0,
        paid_amount: computedPaid,
        payment_method: addPayments[0]?.paymentMethod || "",
        payment_status: computedPaid >= (parseFloat(addFormData.totalAmount) || 0) ? "paid" : "payment pending",
      };

      if (addPayments[0]?.paymentDate) {
        newCommission.payment_date = addPayments[0].paymentDate;
      }

      if (newCommission.commission_type === "Survey") {
        newCommission.sales_person = customerDetails?.assignedTo || "";
      } else if (newCommission.commission_type === "Installation") {
        newCommission.contractor_id = customerDetails?.assignToContractor || "";
      } else if (newCommission.commission_type === "Other") {
        newCommission.other_name = addFormData.commissionName;
      }

      const existingCommissions = (customer.commissions || []).map((c: ApiCommission) => {
        const mapped: any = {
          commission_type: c.commissionType,
          amount: c.amount,
          paid_amount: c.paidAmount,
          payment_method: c.paymentMethod,
          payment_status: c.paymentStatus,
        };
        if (c.paymentDate) mapped.payment_date = c.paymentDate.split("T")[0];
        if (c.otherName) mapped.other_name = c.otherName;
        return mapped;
      });

      const allCommissions = [...existingCommissions, newCommission];

      await adminApi.updateCustomerCommissions(id, allCommissions);
      toast.success("Commission added successfully.");

      // Refresh data
      const response = await adminApi.getCommissionList();
      const found = (response.customers || []).find((c: ApiCustomer) => c.id === id);
      if (found) setCustomer(found);

      setShowAddModal(false);
      setAddFormData({
        commissionType: "",
        commissionName: "",
        customerName: customer?.name || "",
        companyName: customer?.company || "",
        paidTo: customer?.salesPerson || "",
        totalAmount: "",
      });
      setAddPayments([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to save commission.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.editPage}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem" }}>
          <Loader2 size={40} className={dashboardStyles.spinner} style={{ color: "#64748b" }} />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className={styles.editPage}>
        <div className={dashboardStyles.breadcrumb}>
          ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
          <span style={{ cursor: "pointer" }} onClick={() => router.push("/commissions")}>COMMISSIONS</span>
        </div>
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>
          Customer not found.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.editPage}>
      {/* Breadcrumb */}
      <div className={dashboardStyles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/commissions")}>
          COMMISSIONS
        </span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>EDIT COMMISSION</span>
      </div>

      <div className={styles.titleArea}>
        <h1 className={styles.profileTitle}>
          Edit Commission: {customer.name}
        </h1>
      </div>

      {/* Commission Information */}
      <section className={styles.formSection}>
        <h2 className={styles.sectionHeading}>Commission Information</h2>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Commission Type</label>
            <div style={{ position: "relative" }}>
              <select
                name="commissionType"
                className={styles.formSelect}
                value={formData.commissionType}
                onChange={handleChange}
              >
                <option value="Survey Commission">Survey Commission</option>
                <option value="Installation Commission">Installation Commission</option>
                <option value="Others">Others</option>
              </select>
              <ChevronDown size={18} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }} />
            </div>
          </div>

          {formData.commissionType === "Others" && (
            <div className={styles.formGroup}>
              <label>Commission Name</label>
              <input
                type="text"
                name="commissionName"
                className={styles.formInput}
                placeholder="e.g. Referral Bonus"
                value={formData.commissionName}
                onChange={handleChange}
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Customer Name</label>
            <div className={styles.readOnlyField}>{formData.customerName}</div>
          </div>

          <div className={styles.formGroup}>
            <label>Company Name</label>
            <div className={styles.readOnlyField}>{formData.companyName}</div>
          </div>

          <div className={styles.formGroup}>
            <label>Paid To</label>
            <div style={{ position: "relative" }}>
              <select
                name="paidTo"
                className={styles.formSelect}
                value={formData.paidTo}
                onChange={handleChange}
              >
                {customer && (
                  <>
                    {customer.salesPerson && <option value={customer.salesPerson}>{customer.salesPerson}</option>}
                    {customer.contractor && <option value={customer.contractor}>{customer.contractor}</option>}
                  </>
                )}
              </select>
              <ChevronDown size={18} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Total Commission</label>
            <input
              type="number"
              name="totalAmount"
              className={styles.formInput}
              placeholder="0.00"
              value={formData.totalAmount}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      {/* Commission History */}
      <section className={styles.paymentsSection}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
          <h2 className={styles.sectionHeading} style={{ marginBottom: 0 }}>Commission</h2>
          <button className={styles.addCommissionBtn} onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> Add Commission
          </button>
        </div>
        {(customer.commissions || []).length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontWeight: 500 }}>
            No commissions recorded.
          </div>
        ) : (
          <table className={styles.paymentTable}>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Pending</th>
                <th>Status</th>
                <th>Payment Method</th>
                <th>Payment Date</th>
              </tr>
            </thead>
            <tbody>
              {(customer.commissions || []).map((comm, idx) => (
                <tr key={comm._id}>
                  <td style={{ fontWeight: 600, color: "#64748b" }}>{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>
                    {comm.commissionType === "Other" && comm.otherName
                      ? `${comm.commissionType} (${comm.otherName})`
                      : comm.commissionType}
                  </td>
                  <td style={{ fontWeight: 700, color: "#0076ce" }}>
                    ${(comm.amount || 0).toLocaleString()}
                  </td>
                  <td style={{ color: "#10b981", fontWeight: 600 }}>
                    ${(comm.paidAmount || 0).toLocaleString()}
                  </td>
                  <td style={{ color: "#f59e0b", fontWeight: 600 }}>
                    ${(comm.pending || 0).toLocaleString()}
                  </td>
                  <td>
                    <span
                      className={`${modalStyles.badge} ${comm.paymentStatus === "paid" ? modalStyles.badgeBlue : ""}`}
                      style={{
                        background: comm.paymentStatus === "paid" ? "#ecfdf5" : "#fffbeb",
                        color: comm.paymentStatus === "paid" ? "#10b981" : "#f59e0b",
                      }}
                    >
                      {comm.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`${modalStyles.badge} ${modalStyles.badgeBlue}`}>
                      {comm.paymentMethod}
                    </span>
                  </td>
                  <td>
                    {comm.paymentDate ? new Date(comm.paymentDate).toLocaleDateString() : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Action Footer */}
      <div className={styles.actionFooter}>
        <button className={styles.cancelBtn} onClick={() => router.push("/commissions")}>
          <X size={18} /> Cancel
        </button>
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {saving ? <Loader2 size={18} className={dashboardStyles.spinner} /> : <Save size={18} />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Add Commission Modal */}
      {showAddModal && (
        <div className={modalStyles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={`${modalStyles.modalContent} ${modalStyles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
            <div className={modalStyles.modalHeader}>
              <div>
                <h3>Add Commission</h3>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.2rem" }}>
                  Create a new commission for {customer.name}.
                </div>
              </div>
              <button className={modalStyles.closeBtn} onClick={() => setShowAddModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className={modalStyles.modalBody}>
              <div className={modalStyles.formGrid}>
                <div className={modalStyles.formGroup}>
                  <label>Commission Type <span style={{ color: "#ef4444" }}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <select
                      name="commissionType"
                      className={modalStyles.formSelect}
                      value={addFormData.commissionType}
                      onChange={handleAddFormChange}
                    >
                      <option value="">Select Type</option>
                      <option value="Survey Commission">Survey Commission</option>
                      <option value="Installation Commission">Installation Commission</option>
                      <option value="Others">Others</option>
                    </select>
                    <ChevronDown size={18} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }} />
                  </div>
                </div>

                {addFormData.commissionType === "Others" && (
                  <div className={modalStyles.formGroup}>
                    <label>Commission Name <span style={{ color: "#ef4444" }}>*</span></label>
                    <input
                      type="text"
                      name="commissionName"
                      placeholder="e.g. Referral Bonus"
                      className={modalStyles.formInput}
                      value={addFormData.commissionName}
                      onChange={handleAddFormChange}
                    />
                  </div>
                )}

                <div className={modalStyles.formGroup}>
                  <label>Customer Name <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    type="text"
                    name="customerName"
                    placeholder="e.g. John Doe"
                    className={modalStyles.formInput}
                    value={addFormData.customerName}
                    onChange={handleAddFormChange}
                  />
                </div>

                <div className={modalStyles.formGroup}>
                  <label>Company Name <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    type="text"
                    name="companyName"
                    placeholder="e.g. Sunwell Solar"
                    className={modalStyles.formInput}
                    value={addFormData.companyName}
                    onChange={handleAddFormChange}
                  />
                </div>

                <div className={modalStyles.formGroup}>
                  <label>Paid To <span style={{ color: "#ef4444" }}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <select
                      name="paidTo"
                      className={modalStyles.formSelect}
                      value={addFormData.paidTo}
                      onChange={handleAddFormChange}
                      disabled={!addFormData.commissionType}
                    >
                      <option value="">
                        {addFormData.commissionType ? "Select" : "Select Commission Type First"}
                      </option>
                      {getPaidToOptions().map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={18} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }} />
                  </div>
                </div>

                <div className={modalStyles.formGroup}>
                  <label>Total Commission <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    type="number"
                    name="totalAmount"
                    placeholder="0.00"
                    className={modalStyles.formInput}
                    value={addFormData.totalAmount}
                    onChange={handleAddFormChange}
                  />
                </div>
              </div>

              {/* Payments Section */}
              <div style={{ marginTop: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                    Payments
                  </h4>
                  <button type="button" className={modalStyles.addPaymentBtn} onClick={addPaymentRow}>
                    <Plus size={16} /> Add Payment
                  </button>
                </div>

                {addPayments.length === 0 ? (
                  <div className={modalStyles.emptyPayments}>
                    No payments added yet. Click "Add Payment" to record a payment.
                  </div>
                ) : (
                  <div className={modalStyles.paymentRows}>
                    {addPayments.map((payment) => (
                      <div key={payment.id} className={modalStyles.paymentRow}>
                        <div className={modalStyles.paymentField}>
                          <label>Paid Amount</label>
                          <input
                            type="number"
                            placeholder="0.00"
                            className={modalStyles.formInput}
                            value={payment.paidAmount}
                            onChange={(e) => updatePaymentRow(payment.id, "paidAmount", e.target.value)}
                          />
                        </div>
                        <div className={modalStyles.paymentField}>
                          <label>Payment Method</label>
                          <div style={{ position: "relative" }}>
                            <select
                              className={modalStyles.formSelect}
                              value={payment.paymentMethod}
                              onChange={(e) => updatePaymentRow(payment.id, "paymentMethod", e.target.value)}
                            >
                              <option value="">Select Method</option>
                              {PAYMENT_METHODS.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={16} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }} />
                          </div>
                        </div>
                        <div className={modalStyles.paymentField}>
                          <label>Payment Date</label>
                          <input
                            type="date"
                            className={modalStyles.formInput}
                            value={payment.paymentDate}
                            onChange={(e) => updatePaymentRow(payment.id, "paymentDate", e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          className={modalStyles.removePaymentBtn}
                          onClick={() => removePaymentRow(payment.id)}
                          title="Remove payment"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className={modalStyles.summaryBox}>
                <div className={modalStyles.summaryItem}>
                  <span>Total Commission</span>
                  <strong>${(parseFloat(addFormData.totalAmount) || 0).toLocaleString()}</strong>
                </div>
                <div className={modalStyles.summaryItem}>
                  <span>Paid Commission</span>
                  <strong style={{ color: "#10b981" }}>${computedPaid.toLocaleString()}</strong>
                </div>
                <div className={modalStyles.summaryItem}>
                  <span>Pending Commission</span>
                  <strong style={{ color: "#f59e0b" }}>${computedPending.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <div className={modalStyles.modalFooter}>
              <button className={modalStyles.cancelBtn} onClick={() => setShowAddModal(false)}>
                <X size={18} /> Cancel
              </button>
              <button
                className={modalStyles.saveBtn}
                onClick={handleSaveNewCommission}
                disabled={!isAddFormValid() || saving}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                {saving ? <Loader2 size={18} className={dashboardStyles.spinner} /> : <CheckCircle2 size={18} />}
                {saving ? "Saving..." : "Save Commission"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
