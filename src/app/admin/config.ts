import { BarChart3, FileText, Settings, Trophy, Users } from "lucide-react";
import type { DateRangeFilter, IconComponent, Tab } from "./types";

export const tabs: Array<{ id: Tab; label: string; icon: IconComponent; title: string }> = [
  { id: "overview", label: "Overview", icon: BarChart3, title: "Overview" },
  { id: "logs", label: "Visitor Logs", icon: FileText, title: "Visitor Logs" },
  { id: "topvisitors", label: "Top Visitors", icon: Trophy, title: "Top Visitors" },
  { id: "students", label: "Visitors", icon: Users, title: "Visitors" },
  { id: "settings", label: "Settings", icon: Settings, title: "Settings" },
];

export const sidebarSections: Array<{ label: string; items: Tab[] }> = [
  { label: "Dashboard", items: ["overview"] },
  { label: "Library Activity", items: ["logs", "topvisitors", "students"] },
  { label: "Management", items: ["settings"] },
];

export const dateRangeOptions: Array<{ label: string; value: DateRangeFilter }> = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All Time", value: "all" },
];

export const chartColors = ["#4a9eff", "#4ade80", "#f0c040", "#a78bfa", "#f87171", "#38bdf8"];
