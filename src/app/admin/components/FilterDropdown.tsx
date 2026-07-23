"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DropdownOption } from "../types";

export function FilterDropdown({
  label,
  options,
  value,
  onChange,
  compact = false,
  clearable = false,
}: {
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
  clearable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeOption = options.find((option) => option.value === value) ?? options[0];
  const defaultValue = options[0]?.value ?? "";
  const isCleared = clearable && value !== defaultValue;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={dropdownRef} className={`custom-dropdown ${compact ? "compact" : ""} ${open ? "is-open" : ""}`}>
      <div className={`custom-dropdown-trigger-wrap ${isCleared ? "has-clear" : ""}`}>
        <button type="button" className="custom-dropdown-trigger" onClick={() => setOpen((current) => !current)}>
          <span>{compact ? activeOption.label : label}</span>
          {!compact && <strong>{activeOption.label}</strong>}
          <ChevronDown size={14} strokeWidth={2.4} className="custom-dropdown-chevron" />
        </button>
        {isCleared && (
          <button
            type="button"
            className="custom-dropdown-clear"
            aria-label={`Clear ${label} filter`}
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
              onChange(defaultValue);
            }}
          >
            <X size={13} strokeWidth={2.6} />
          </button>
        )}
      </div>
      {open && (
        <div className="custom-dropdown-menu">
          {options.map((option) => (
            <button
              type="button"
              className={`custom-dropdown-option ${option.value === value ? "active" : ""}`}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
