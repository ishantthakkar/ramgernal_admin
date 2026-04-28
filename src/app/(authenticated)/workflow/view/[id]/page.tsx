"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "../../../dashboard.module.css";
import modalStyles from "./workflow-details.module.css";
import {
  User,
  ShieldCheck,
  Loader2,
  Edit2,
  X,
  ClipboardCheck,
  Building,
  Phone,
  Mail,
  MapPin,
  Image as ImageIcon,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Calendar,
  Hammer,
  ArrowLeft,
  Plus
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "react-toastify";

export default function WorkflowViewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedImages, setSelectedImages] = useState<string[] | null>(null);
  const [activeArea, setActiveArea] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"survey" | "installations">("survey");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await adminApi.getCustomerWorkflowDetails(id);
        setData(result);
      } catch (err: any) {
        toast.error(err.message || "Failed to load workflow details.");
        router.push("/workflow");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, router]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={48} className={styles.spinner} color="#0076ce" />
      </div>
    );
  }

  if (!data?.customer) return null;

  const { customer, surveys } = data;
  const isContractorAssigned = !!(customer.assignToContractor || customer.contractorName || customer.contractor);

  return (
    <div className={styles.addUserPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/workflow")}>WORKFLOW</span>
        <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>VIEW SURVEY</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.welcomeText}>Workflow Details</h1>
        <button 
          className={styles.addBtn}
          onClick={() => router.push(`/workflow/edit/${id}`)}
          style={{ background: "#0076ce" }}
        >
          <Edit2 size={18} /> Edit Workflow
        </button>
      </div>

      <div className={styles.tabs} style={{ marginBottom: "2rem", width: "fit-content" }}>
        <button 
          className={`${styles.tab} ${activeTab === "survey" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("survey")}
          style={{ border: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <ClipboardCheck size={18} /> Survey
        </button>
        <button 
          className={`${styles.tab} ${activeTab === "installations" ? styles.tabActive : ""}`}
          onClick={() => {
            if (isContractorAssigned) {
              setActiveTab("installations");
            } else {
              toast.warning("Materials are only available after contractor assignment.");
            }
          }}
          style={{ 
            border: "none", 
            display: "flex", 
            alignItems: "center", 
            gap: "0.5rem",
            opacity: isContractorAssigned ? 1 : 0.5,
            cursor: isContractorAssigned ? "pointer" : "not-allowed"
          }}
          title={!isContractorAssigned ? "Contractor not assigned" : ""}
        >
          <Hammer size={18} /> Installations
        </button>
      </div>

      {/* Customer Information */}
      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>
          <User size={22} color="#0076ce" /> Customer Information
        </div>
        <p className={styles.sectionSubtitle}>Primary contact and company details.</p>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Name</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              {customer.name}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Account Number</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#64748b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              #{customer.accountNumber || "N/A"}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Company</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              {customer.company}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Mobile Number</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              {customer.mobileNumber}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Sales Person</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#1e293b", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              {customer.salesPerson}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Current Status</label>
            <div className={styles.formInput} style={{ background: "#f8fafc", color: "#0076ce", fontWeight: 700, border: "1px solid #e2e8f0", textTransform: "uppercase" }}>
              {customer.status}
            </div>
          </div>
        </div>
      </div>

      {/* Survey Information Table */}
      {activeTab === "survey" ? (
        <div className={styles.formSection} style={{ marginTop: "2rem" }}>
          <div className={styles.sectionTitle}>
            <ClipboardCheck size={22} color="#10b981" /> Survey History
          </div>

          {surveys && surveys.length > 0 ? (
            <div className={styles.userTableContainer} style={{ marginTop: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <table className={styles.userTable}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ minWidth: "150px" }}>Area</th>
                    <th>Height</th>
                    <th>Existing Fixture Type</th>
                    <th>Existing Bulbs</th>
                    <th>Existing Qty</th>
                    <th>Proposed Fixture</th>
                    <th>Proposed Qty</th>
                    <th>Price / Unit</th>
                    <th>Total Price</th>
                    <th>Note</th>
                    <th>Images/Videos</th>
                  </tr>
                </thead>
                <tbody>
                  {surveys.map((survey: any) => (
                    <tr key={survey._id}>
                      <td style={{ fontWeight: 600, color: "#1e293b" }}>{survey.area}</td>
                      <td style={{ color: "#64748b" }}>{survey.heightInInches || "N/A"}</td>
                      <td style={{ color: "#64748b" }}>
                        {survey.existingFixtureType === "Other" ? survey.otherFixtureType : survey.existingFixtureType}
                      </td>
                      <td style={{ color: "#64748b" }}>{survey.existingBulbs || "N/A"}</td>
                      <td style={{ color: "#ef4444", fontWeight: 700 }}>{survey.existingQuantity}</td>
                      <td style={{ color: "#0076ce", fontWeight: 600 }}>{survey.proposedFixture}</td>
                      <td style={{ color: "#10b981", fontWeight: 700 }}>{survey.proposedQuantity}</td>
                      <td style={{ color: "#64748b" }}>${survey.pricePerUnit}</td>
                      <td style={{ fontWeight: 700, color: "#1e293b" }}>${survey.totalPrice}</td>
                      <td style={{
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "#64748b",
                        fontSize: "0.8rem"
                      }} title={survey.note}>
                        {survey.note || "N/A"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          {survey.images && survey.images.length > 0 ? (
                            <button
                              className={modalStyles.viewImgBtn}
                              onClick={() => {
                                setSelectedImages(survey.images);
                                setActiveArea(survey.area);
                              }}
                            >
                              <Eye size={14} /> View
                              <span style={{ opacity: 0.7, fontWeight: 500 }}>({survey.images.length})</span>
                            </button>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600 }}>
                              <ImageIcon size={14} /> None
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "3rem", background: "#f8fafc", borderRadius: "12px", marginTop: "1rem" }}>
              <p style={{ color: "#94a3b8", fontWeight: 500 }}>No survey records found for this customer.</p>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.formSection} style={{ marginTop: "2rem" }}>
          <div className={styles.sectionTitle}>
            <Hammer size={22} color="#475569" /> Installation Materials
          </div>
          <p className={styles.sectionSubtitle}>Items and quantities issued for this installation.</p>

          {data.materials && data.materials.length > 0 ? (
            <div className={styles.userTableContainer} style={{ marginTop: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <table className={styles.userTable}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ width: "80px" }}>Sr. No</th>
                    <th style={{ minWidth: "200px" }}>Item Name</th>
                    <th style={{ width: "150px" }}>Issued Qty</th>
                    <th>Image</th>
                  </tr>
                </thead>
                <tbody>
                  {data.materials.map((item: any, index: number) => (
                    <tr key={index}>
                      <td style={{ fontWeight: 600, color: "#64748b" }}>{index + 1}</td>
                      <td style={{ fontWeight: 600, color: "#1e293b" }}>{item.item_name}</td>
                      <td style={{ fontWeight: 700, color: "#0076ce" }}>{item.issued_qty}</td>
                      <td>
                        {item.image ? (
                          <div style={{ width: "60px", height: "60px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                            <img src={item.image} alt={item.item_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No image</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "3rem", background: "#f8fafc", borderRadius: "12px", marginTop: "1rem" }}>
              <p style={{ color: "#94a3b8", fontWeight: 500 }}>No materials recorded yet.</p>
            </div>
          )}
        </div>
      )}




      {/* Notes Section */}
      <div className={styles.formSection} style={{ marginTop: "2rem" }}>
        <div className={styles.sectionTitle}>
          <FileText size={22} color="#f59e0b" /> Internal Notes
        </div>
        <p className={styles.sectionSubtitle}>System and manual notes regarding this customer.</p>

        {customer.notes && customer.notes.length > 0 ? (
          <div className={styles.userTableContainer} style={{ marginTop: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <table className={styles.userTable}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ width: "200px" }}>Date</th>
                  <th>Note Content</th>
                </tr>
              </thead>
              <tbody>
                {customer.notes.map((note: any) => (
                  <tr key={note._id}>
                    <td style={{ color: "#64748b", fontWeight: 600 }}>{new Date(note.createdAt).toLocaleString()}</td>
                    <td style={{ color: "#1e293b", fontWeight: 500 }}>{note.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "2rem", background: "#f8fafc", borderRadius: "12px", marginTop: "1rem" }}>
            <p style={{ color: "#94a3b8", fontWeight: 500 }}>No notes found.</p>
          </div>
        )}
      </div>

      {/* Activities Section */}
      <div className={styles.formSection} style={{ marginTop: "2rem" }}>
        <div className={styles.sectionTitle}>
          <Calendar size={22} color="#8b5cf6" /> Recent Activities
        </div>
        <p className={styles.sectionSubtitle}>Call logs, meetings, and follow-ups.</p>

        {data.activities && data.activities.length > 0 ? (
          <div className={styles.userTableContainer} style={{ marginTop: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <table className={styles.userTable}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ width: "150px" }}>Date</th>
                  <th style={{ width: "150px" }}>Type</th>
                  <th>Outcome</th>
                  <th style={{ width: "180px" }}>Next Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {data.activities.map((activity: any) => (
                  <tr key={activity._id}>
                    <td style={{ color: "#64748b", fontWeight: 600 }}>{new Date(activity.date).toLocaleDateString()}</td>
                    <td>
                      <span style={{
                        padding: "0.25rem 0.6rem",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        textTransform: "uppercase"
                      }}>
                        {activity.activityType}
                      </span>
                    </td>
                    <td style={{ color: "#1e293b", fontWeight: 500 }}>{activity.outcome}</td>
                    <td style={{ color: "#64748b" }}>
                      {activity.nextFollowUpDate ? new Date(activity.nextFollowUpDate).toLocaleDateString() : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "2rem", background: "#f8fafc", borderRadius: "12px", marginTop: "1rem" }}>
            <p style={{ color: "#94a3b8", fontWeight: 500 }}>No activities recorded.</p>
          </div>
        )}
      </div>
      <div className={styles.actionFooter} style={{ background: "#f1f5f9", padding: "2.5rem", borderRadius: "16px", marginTop: "3rem", justifyContent: "flex-end" }}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => router.push("/workflow")}
          style={{ padding: "0.875rem 3rem", background: "#64748b", color: "#ffffff" }}
        >
          <X size={20} /> Close
        </button>
      </div>
      {/* Image Modal */}
      {selectedImages && (
        <div className={modalStyles.imgModalOverlay} onClick={() => setSelectedImages(null)}>
          <div className={modalStyles.imgModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={modalStyles.imgModalHeader}>
              <div>
                <h3>Survey Images</h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
                  Area: <span style={{ color: "#1e293b", fontWeight: 700 }}>{activeArea}</span>
                </p>
              </div>
              <button className={modalStyles.closeBtn} onClick={() => setSelectedImages(null)}>
                <X size={20} />
              </button>
            </div>
            <div className={modalStyles.imgModalBody}>
              <div className={modalStyles.modalImageGrid}>
                {selectedImages.map((img, idx) => (
                  <div key={idx} className={modalStyles.modalImageWrapper}>
                    <img src={img} alt={`Survey ${idx}`} />
                    <a
                      href={img}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className={modalStyles.downloadIconOverlay}
                      title="Download Image"
                    >
                      <Download size={18} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
