import type { ComponentType } from "react";

export type Tab = "overview" | "logs" | "topvisitors" | "students" | "settings";
export type VisitorStatusFilter = "all" | "active" | "blocked";
export type DateRangeFilter = "today" | "week" | "month" | "all";
export type IconComponent = ComponentType<{ size?: number; strokeWidth?: number }>;

export type Visitor = {
  id: string;
  schoolId: string;
  email: string;
  name: string;
  college: string;
  type: string;
  totalVisits: number;
  currentStreak: number;
  longestStreak: number;
  lastVisitAt: string | null;
  blocked: boolean;
};

export type VisitLog = {
  id: string;
  schoolId: string;
  visitorName: string;
  college: string;
  type: string;
  purposeSnapshot: string;
  visitedAt: string;
};

export type Purpose = {
  id: string;
  name: string;
  active: boolean;
  sortOrder: number;
};

export type AdminUser = {
  id: string;
  username: string;
  email: string | null;
  name: string;
  active: boolean;
  createdAt: string;
};

export type CountRow = {
  label: string;
  count: number;
};

export type DashboardData = {
  stats: {
    totalVisits: number;
    uniqueVisitors: number;
    topPurpose: string;
    topCollege: string;
  };
  visitors: Visitor[];
  visitLogs: VisitLog[];
  purposes: Purpose[];
  admins: AdminUser[];
  charts: {
    visitsPerDay: CountRow[];
    purposeBreakdown: CountRow[];
    visitsByHour: CountRow[];
    topColleges: CountRow[];
  };
};

export type DropdownOption = {
  label: string;
  value: string;
};
