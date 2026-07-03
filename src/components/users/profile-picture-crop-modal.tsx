"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { X } from "lucide-react";
import { getCroppedImageFile } from "@/lib/crop-image";
import styles from "./profile-picture-crop-modal.module.css";

interface ProfilePictureCropModalProps {
  imageSrc: string;
  fileName: string;
  isOpen: boolean;
  isApplying?: boolean;
  onClose: () => void;
  onApply: (file: File, previewUrl: string) => void;
}

export function ProfilePictureCropModal({
  imageSrc,
  fileName,
  isOpen,
  isApplying = false,
  onClose,
  onApply,
}: ProfilePictureCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleApply() {
    if (!croppedAreaPixels) return;

    const croppedFile = await getCroppedImageFile(imageSrc, croppedAreaPixels, fileName);
    const previewUrl = URL.createObjectURL(croppedFile);
    onApply(croppedFile, previewUrl);
  }

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Crop Profile Picture</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose} disabled={isApplying}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.cropArea}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className={styles.controls}>
          <label className={styles.zoomLabel} htmlFor="profile-crop-zoom">
            Zoom
          </label>
          <input
            id="profile-crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className={styles.zoomSlider}
          />

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isApplying}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.applyBtn}
              onClick={handleApply}
              disabled={isApplying || !croppedAreaPixels}
            >
              {isApplying ? "Applying..." : "Set Photo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
