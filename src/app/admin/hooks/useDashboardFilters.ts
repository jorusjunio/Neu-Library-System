"use client";

import { useReducer } from "react";
import type { DateRangeFilter } from "../types";

export type DashboardFilters = {
  purpose: string;
  college: string;
  visitorType: string;
  dateRange: DateRangeFilter;
};

const initialFilters: DashboardFilters = {
  purpose: "",
  college: "",
  visitorType: "",
  dateRange: "all",
};

type FilterAction =
  | { type: "SET_PURPOSE"; value: string }
  | { type: "SET_COLLEGE"; value: string }
  | { type: "SET_VISITOR_TYPE"; value: string }
  | { type: "SET_DATE_RANGE"; value: DateRangeFilter }
  | { type: "CLEAR_QUICK_FILTERS" }
  | { type: "RESET" };

function filterReducer(state: DashboardFilters, action: FilterAction): DashboardFilters {
  switch (action.type) {
    case "SET_PURPOSE":
      return { ...state, purpose: action.value };
    case "SET_COLLEGE":
      return { ...state, college: action.value };
    case "SET_VISITOR_TYPE":
      return { ...state, visitorType: action.value };
    case "SET_DATE_RANGE":
      return { ...state, dateRange: action.value };
    case "CLEAR_QUICK_FILTERS":
      return { ...state, purpose: "", college: "", visitorType: "" };
    case "RESET":
      return initialFilters;
    default:
      return state;
  }
}

export function useDashboardFilters() {
  const [filters, dispatch] = useReducer(filterReducer, initialFilters);

  return {
    filters,
    setPurpose: (value: string) => dispatch({ type: "SET_PURPOSE", value }),
    setCollege: (value: string) => dispatch({ type: "SET_COLLEGE", value }),
    setVisitorType: (value: string) => dispatch({ type: "SET_VISITOR_TYPE", value }),
    setDateRange: (value: DateRangeFilter) => dispatch({ type: "SET_DATE_RANGE", value }),
    clearQuickFilters: () => dispatch({ type: "CLEAR_QUICK_FILTERS" }),
    reset: () => dispatch({ type: "RESET" }),
  };
}
