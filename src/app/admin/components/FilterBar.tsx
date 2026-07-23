"use client";

import { X } from "lucide-react";
import type { DashboardFilters } from "../hooks/useDashboardFilters";
import type { DropdownOption } from "../types";
import { FilterDropdown } from "./FilterDropdown";

export function FilterBar({
  filters,
  purposeOptions,
  collegeOptions,
  visitorTypeOptions,
  onPurposeChange,
  onCollegeChange,
  onVisitorTypeChange,
  onClearAll,
}: {
  filters: Pick<DashboardFilters, "purpose" | "college" | "visitorType">;
  purposeOptions: DropdownOption[];
  collegeOptions: DropdownOption[];
  visitorTypeOptions: DropdownOption[];
  onPurposeChange: (value: string) => void;
  onCollegeChange: (value: string) => void;
  onVisitorTypeChange: (value: string) => void;
  onClearAll: () => void;
}) {
  const activeCount = [filters.purpose, filters.college, filters.visitorType].filter(Boolean).length;

  return (
    <div className="stat-filter-bar">
      <span className="stat-filter-label">Filter by:</span>
      <FilterDropdown clearable label="Purpose" options={purposeOptions} value={filters.purpose} onChange={onPurposeChange} />
      <FilterDropdown clearable label="College" options={collegeOptions} value={filters.college} onChange={onCollegeChange} />
      <FilterDropdown clearable label="Visitor" options={visitorTypeOptions} value={filters.visitorType} onChange={onVisitorTypeChange} />
      {activeCount >= 2 && (
        <button type="button" className="stat-filter-clear-all" onClick={onClearAll}>
          <X size={12} strokeWidth={2.6} />
          Clear all
        </button>
      )}
    </div>
  );
}
