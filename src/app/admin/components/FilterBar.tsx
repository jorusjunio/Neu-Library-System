"use client";

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
  onClear,
}: {
  filters: Pick<DashboardFilters, "purpose" | "college" | "visitorType">;
  purposeOptions: DropdownOption[];
  collegeOptions: DropdownOption[];
  visitorTypeOptions: DropdownOption[];
  onPurposeChange: (value: string) => void;
  onCollegeChange: (value: string) => void;
  onVisitorTypeChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="stat-filter-bar">
      <span className="stat-filter-label">Filter by:</span>
      <FilterDropdown label="Purpose" options={purposeOptions} value={filters.purpose} onChange={onPurposeChange} />
      <FilterDropdown label="College" options={collegeOptions} value={filters.college} onChange={onCollegeChange} />
      <FilterDropdown label="Visitor" options={visitorTypeOptions} value={filters.visitorType} onChange={onVisitorTypeChange} />
      <button className="stat-filter-clear" type="button" onClick={onClear}>
        Clear
      </button>
    </div>
  );
}
