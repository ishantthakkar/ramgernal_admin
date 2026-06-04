"use client";

import { useEffect, useRef, useState } from "react";
import { adminApi } from "@/lib/api";
import { FileText, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { toast } from "react-toastify";
import uploadStyles from "./signed-quotation-upload.module.css";

const ACCEPTED_TYPES = "application/pdf,image/*";

interface SignedQuotationUploadProps {
  customerId: string;
  onUploaded?: () => void | Promise<void>;
  label?: string;
  variant?: "primary" | "outline";
  hasSignedFile?: boolean;
  disabled?: boolean;
}

export function SignedQuotationUpload({
  customerId,
  onUploaded,
  label = "Sign",
  variant = "primary",
  hasSignedFile = false,
  disabled = false,
}: SignedQuotationUploadProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const clearPreviewUrl = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  };

  const resetSelection = () => {
    setSelectedFile(null);
    clearPreviewUrl();
  };

  const closeModal = () => {
    setModalOpen(false);
    resetSelection();
    setDragOver(false);
  };

  const openModal = () => {
    if (disabled || uploading) return;
    setModalOpen(true);
  };

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const applyFile = (file: File) => {
    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      toast.error("Only PDF or image files are allowed.");
      return;
    }

    clearPreviewUrl();
    setSelectedFile(file);
    if (isImage) {
      const url = URL.createObjectURL(file);
      previewUrlRef.current = url;
      setPreviewUrl(url);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) applyFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.warning("Please select a signed PDF or image to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("quotations", selectedFile);

    try {
      setUploading(true);
      const response = await adminApi.uploadQuotation(customerId, formData);
      toast.success(response.message || "Signed quotation uploaded successfully.");
      closeModal();
      await onUploaded?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload signed quotation.";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const triggerLabel = hasSignedFile ? "Replace Sign" : label;
  const triggerClass =
    variant === "outline"
      ? `${uploadStyles.trigger} ${uploadStyles.triggerOutline}`
      : uploadStyles.trigger;

  const modalTitle = hasSignedFile ? "Replace Signed Quotation" : "Upload Signed Quotation";

  return (
    <>
      <button
        type="button"
        className={triggerClass}
        disabled={disabled || uploading}
        onClick={openModal}
      >
        {uploading ? <Loader2 size={14} className={uploadStyles.spinner} /> : <Upload size={14} />}
        {triggerLabel}
      </button>

      {modalOpen ? (
        <div className={uploadStyles.modalOverlay} onClick={closeModal}>
          <div className={uploadStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={uploadStyles.modalHeader}>
              <h3>{modalTitle}</h3>
              <button type="button" className={uploadStyles.closeBtn} onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <div className={uploadStyles.modalBody}>
              <p className={uploadStyles.modalSubtitle}>
                Upload the customer-signed quotation as a PDF or image file.
              </p>

              <div
                className={`${uploadStyles.dropzone} ${dragOver ? uploadStyles.dropzoneActive : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <div className={uploadStyles.dropzoneIcon}>
                  <ImageIcon size={32} />
                </div>
                <div className={uploadStyles.dropzoneTitle}>Drag & drop signed file here</div>
                <div className={uploadStyles.dropzoneHint}>
                  or click to browse · PDF or image (max 10MB)
                </div>
              </div>

              {selectedFile ? (
                <div className={uploadStyles.previewBox}>
                  <div className={uploadStyles.previewLabel}>Selected file</div>
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Signed quotation preview"
                      className={uploadStyles.previewImage}
                    />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        color: "#64748b",
                      }}
                    >
                      <FileText size={20} color="#dc2626" />
                      <span className={uploadStyles.previewFileName}>{selectedFile.name}</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className={uploadStyles.modalFooter}>
              <button type="button" className={uploadStyles.cancelBtn} onClick={closeModal}>
                Cancel
              </button>
              <button
                type="button"
                className={uploadStyles.uploadBtn}
                disabled={!selectedFile || uploading}
                onClick={handleUpload}
              >
                {uploading ? <Loader2 size={16} className={uploadStyles.spinner} /> : <Upload size={16} />}
                Upload
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        style={{ display: "none" }}
        onChange={handleFileInputChange}
      />
    </>
  );
}
