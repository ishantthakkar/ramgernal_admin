"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Upload, User } from "lucide-react";
import { toast } from "react-toastify";
import addStyles from "@/app/(authenticated)/users/add/user-add.module.css";
import formStyles from "@/app/(authenticated)/dashboard.module.css";
import { ProfilePictureCropModal } from "./profile-picture-crop-modal";

interface ProfilePictureUploadProps {
  previewUrl: string | null;
  onChange: (file: File | null, previewUrl: string | null) => void;
  label?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function ProfilePictureUpload({
  previewUrl,
  onChange,
  label = "Upload Profile Picture",
}: ProfilePictureUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState("profile-picture.jpg");
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);

  useEffect(() => {
    return () => {
      if (cropSource) URL.revokeObjectURL(cropSource);
    };
  }, [cropSource]);

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      resetFileInput();
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be smaller than 5MB.");
      resetFileInput();
      return;
    }

    if (cropSource) URL.revokeObjectURL(cropSource);

    const objectUrl = URL.createObjectURL(file);
    const extension = file.name.split(".").pop()?.toLowerCase();
    const safeExtension = extension && ["jpg", "jpeg", "png", "webp"].includes(extension)
      ? extension
      : "jpg";

    setPendingFileName(`profile-picture.${safeExtension}`);
    setCropSource(objectUrl);
    resetFileInput();
  }

  function handleRemove() {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    onChange(null, null);
    resetFileInput();
  }

  function handleCropClose() {
    if (cropSource) URL.revokeObjectURL(cropSource);
    setCropSource(null);
    resetFileInput();
  }

  async function handleCropApply(file: File, nextPreviewUrl: string) {
    setIsApplyingCrop(true);
    try {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      onChange(file, nextPreviewUrl);
      if (cropSource) URL.revokeObjectURL(cropSource);
      setCropSource(null);
    } finally {
      setIsApplyingCrop(false);
    }
  }

  return (
    <>
      <div className={`${formStyles.formGroup} ${addStyles.profileUploadGroup}`}>
        <label>{label}</label>
        <div className={addStyles.profileUploadArea}>
          <div className={addStyles.profilePreview}>
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Profile preview"
                width={88}
                height={88}
                className={addStyles.profilePreviewImg}
                unoptimized
              />
            ) : (
              <User size={36} color="#64748b" />
            )}
          </div>

          <div className={addStyles.profileUploadControls}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={addStyles.hiddenFileInput}
              onChange={handleFileSelect}
            />
            <button
              type="button"
              className={addStyles.uploadBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={18} /> {previewUrl ? "Change Image" : "Choose Image"}
            </button>
            {previewUrl && (
              <button
                type="button"
                onClick={handleRemove}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                Remove photo
              </button>
            )}
            <span className={addStyles.uploadHint}>
              JPG, PNG or WEBP. Max 5MB. Crop after upload.
            </span>
          </div>
        </div>
      </div>

      {cropSource && (
        <ProfilePictureCropModal
          imageSrc={cropSource}
          fileName={pendingFileName}
          isOpen={Boolean(cropSource)}
          isApplying={isApplyingCrop}
          onClose={handleCropClose}
          onApply={handleCropApply}
        />
      )}
    </>
  );
}
