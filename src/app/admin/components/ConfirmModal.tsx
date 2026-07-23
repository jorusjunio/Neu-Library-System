"use client";

import { X } from "lucide-react";
import type { IconComponent } from "../types";

export function ConfirmModal({
  open,
  closing,
  icon: Icon,
  tone = "gold",
  kicker,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  closing: boolean;
  icon: IconComponent;
  tone?: "gold" | "red" | "green";
  kicker: string;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className={`logout-modal-backdrop ${closing ? "is-closing" : ""}`} role="presentation">
      <section
        className={`logout-modal ${closing ? "is-closing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmModalTitle"
      >
        <button type="button" className="logout-modal-close" onClick={onCancel} aria-label="Close">
          <X size={16} strokeWidth={2.4} />
        </button>
        <div className={`logout-modal-icon tone-${tone}`}>
          <Icon size={24} strokeWidth={2.2} />
        </div>
        <p className={`logout-modal-kicker tone-${tone}`}>{kicker}</p>
        <h2 id="confirmModalTitle">{title}</h2>
        <p className="logout-modal-text">{description}</p>
        <div className="logout-modal-actions">
          <button type="button" className="logout-cancel-btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={`logout-confirm-btn tone-${tone}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
