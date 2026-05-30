"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftToLine,
  BarChart3,
  BookOpen,
  Building2,
  ChevronDown,
  FileDown,
  FileSpreadsheet,
  FileText,
  LogOut,
  Search,
  Settings,
  ShieldAlert,
  Trophy,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { type ComponentType, useEffect, useRef, useState } from "react";
import { AmbientBackground } from "@/components/shared/AmbientBackground";

type Tab = "overview" | "logs" | "topvisitors" | "students" | "settings";
type VisitorStatusFilter = "all" | "active" | "blocked";
type DateRangeFilter = "today" | "week" | "month" | "all";
type IconComponent = ComponentType<{ size?: number; strokeWidth?: number }>;

type Visitor = {
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

type VisitLog = {
  id: string;
  schoolId: string;
  visitorName: string;
  college: string;
  type: string;
  purposeSnapshot: string;
  visitedAt: string;
};

type Purpose = {
  id: string;
  name: string;
  active: boolean;
  sortOrder: number;
};

type AdminUser = {
  id: string;
  username: string;
  email: string | null;
  name: string;
  active: boolean;
  createdAt: string;
};

type CountRow = {
  label: string;
  count: number;
};

type DashboardData = {
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

const tabs: Array<{ id: Tab; label: string; icon: IconComponent; title: string }> = [
  { id: "overview", label: "Overview", icon: BarChart3, title: "Overview" },
  { id: "logs", label: "Visitor Logs", icon: FileText, title: "Visitor Logs" },
  { id: "topvisitors", label: "Top Visitors", icon: Trophy, title: "Top Visitors" },
  { id: "students", label: "Visitors", icon: Users, title: "Visitors" },
  { id: "settings", label: "Settings", icon: Settings, title: "Settings" },
];

const sidebarSections: Array<{ label: string; items: Tab[] }> = [
  { label: "Dashboard", items: ["overview"] },
  { label: "Library Activity", items: ["logs", "topvisitors", "students"] },
  { label: "Management", items: ["settings"] },
];

const dateRangeOptions: Array<{ label: string; value: DateRangeFilter }> = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All Time", value: "all" },
];

function displayType(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function escapeCsv(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadBlob(filename: string, type: string, content: BlobPart) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportCsv(filename: string, headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\r\n");

  downloadBlob(filename, "text/csv;charset=utf-8", csv);
}

function escapePdfText(value: string | number | null | undefined) {
  return String(value ?? "-")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function exportPdf(filename: string, title: string, headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const lines = [
    title,
    headers.join(" | "),
    "-".repeat(Math.min(96, headers.join(" | ").length)),
    ...rows.map((row) => row.map((cell) => String(cell ?? "-")).join(" | ")),
  ].slice(0, 90);
  const streamLines = ["BT", "/F1 10 Tf", "36 792 Td"];

  lines.forEach((line, index) => {
    if (index > 0) {
      streamLines.push("0 -14 Td");
    }

    streamLines.push(`(${escapePdfText(line).slice(0, 132)}) Tj`);
  });

  streamLines.push("ET");

  const stream = streamLines.join("\n");
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += object;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  downloadBlob(filename, "application/pdf", pdf);
}

function includesQuery(values: Array<string | number | null | undefined>, query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) return true;

  return values.some((value) => String(value ?? "").toLowerCase().includes(normalized));
}

function dateKey(value: Date) {
  return value.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

function inDateRange(value: string, range: DateRangeFilter) {
  if (range === "all") return true;

  const date = new Date(value);
  const now = new Date();

  if (range === "today") {
    return dateKey(date) === dateKey(now);
  }

  if (range === "month") {
    return (
      date.toLocaleDateString("en-CA", { month: "2-digit", timeZone: "Asia/Manila" }) ===
        now.toLocaleDateString("en-CA", { month: "2-digit", timeZone: "Asia/Manila" }) &&
      date.toLocaleDateString("en-CA", { year: "numeric", timeZone: "Asia/Manila" }) ===
        now.toLocaleDateString("en-CA", { year: "numeric", timeZone: "Asia/Manila" })
    );
  }

  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  return date >= start && date <= now;
}

function countBy(rows: VisitLog[], getLabel: (row: VisitLog) => string) {
  const map = new Map<string, number>();

  rows.forEach((row) => {
    const label = getLabel(row) || "Unknown";
    map.set(label, (map.get(label) ?? 0) + 1);
  });

  return Array.from(map, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

function visitsPerDay(rows: VisitLog[]) {
  return countBy(rows, (row) => dateKey(new Date(row.visitedAt)))
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(-7);
}

function visitsByHour(rows: VisitLog[]) {
  return countBy(rows, (row) =>
    new Intl.DateTimeFormat("en-PH", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Manila",
    }).format(new Date(row.visitedAt)),
  ).sort((a, b) => a.label.localeCompare(b.label));
}

type DropdownOption = {
  label: string;
  value: string;
};

function FilterDropdown({
  label,
  options,
  value,
  onChange,
  compact = false,
}: {
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeOption = options.find((option) => option.value === value) ?? options[0];

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
      <button type="button" className="custom-dropdown-trigger" onClick={() => setOpen((current) => !current)}>
        <span>{compact ? activeOption.label : label}</span>
        {!compact && <strong>{activeOption.label}</strong>}
        <ChevronDown size={14} strokeWidth={2.4} />
      </button>
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

function maxCount(rows: CountRow[]) {
  return Math.max(1, ...rows.map((row) => row.count));
}

const chartColors = ["#4a9eff", "#4ade80", "#f0c040", "#a78bfa", "#f87171", "#38bdf8"];

function pieBackground(rows: CountRow[]) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  if (!total) {
    return "rgba(255,255,255,0.06)";
  }

  let cursor = 0;
  const slices = rows.map((row, index) => {
    const start = cursor;
    const size = (row.count / total) * 100;
    cursor += size;
    return `${chartColors[index % chartColors.length]} ${start}% ${cursor}%`;
  });

  return `conic-gradient(${slices.join(", ")})`;
}

function LineChart({ rows }: { rows: CountRow[] }) {
  const chartRows = rows.length ? rows : [{ label: "No logs", count: 0 }];
  const max = maxCount(chartRows);
  const width = 1000;
  const height = 260;
  const padding = { top: 22, right: 10, bottom: 34, left: 10 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const points = chartRows.map((row, index) => {
    const x = padding.left + (chartRows.length === 1 ? plotWidth / 2 : (index / (chartRows.length - 1)) * plotWidth);
    const y = padding.top + plotHeight - (row.count / max) * plotHeight;

    return { ...row, x, y };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${padding.left},${padding.top + plotHeight} ${polyline} ${padding.left + plotWidth},${padding.top + plotHeight}`;

  return (
    <div className="line-chart-wrap">
      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Visits per day line chart">
        {[0, 1, 2, 3].map((line) => {
          const y = padding.top + (plotHeight / 3) * line;

          return <line className="line-chart-grid" key={line} x1={padding.left} y1={y} x2={width - padding.right} y2={y} />;
        })}
        <polygon className="line-chart-area" points={area} />
        <polyline className="line-chart-stroke" points={polyline} />
        {points.map((point) => (
          <g className="line-chart-point" key={point.label} transform={`translate(${point.x} ${point.y})`}>
            <circle r="5" />
            <text y="-11">{point.count}</text>
          </g>
        ))}
        {points.map((point) => (
          <text className="line-chart-label" key={`${point.label}-label`} x={point.x} y={height - 13}>
            {point.label.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  );
}

function LoginView() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError("");
    setNotice("");
    setSubmitting(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (result?.error) {
      setError("Invalid username or password.");
    }
  }

  return (
    <main className="login-page">
      <AmbientBackground />
      <section className="admin-login-card">
        <div className="admin-login-logo">
          <Image src="/assets/neu-logo.png" alt="NEU Logo" width={64} height={64} />
        </div>
        <p className="admin-login-kicker">Administrator Access</p>
        <h1 className="admin-login-title">NEU Library Dashboard</h1>
        <p className="admin-login-sub">
          Sign in with your admin account to view live Neon data.
        </p>
        <div className="admin-login-fields">
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="admin-login-input"
            placeholder="Username"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
            type="password"
            className="admin-login-input"
            placeholder="Password"
          />
        </div>
        {error && <p className="admin-login-error">{error}</p>}
        <button type="button" className="admin-login-btn" onClick={submit} disabled={submitting}>
          {submitting ? "Signing In..." : "Sign In"}
        </button>
        <button
          type="button"
          className="admin-google-btn"
          onClick={() => {
            setError("");
            setNotice("Google login is ready in the UI. We will connect the provider next.");
          }}
        >
          <span className="google-mark" aria-hidden="true">G</span>
          Continue with Google
          <span className="soon-pill">soon</span>
        </button>
        {notice && <p className="admin-login-note">{notice}</p>}
        <Link href="/entrance" className="admin-login-secondary">
          <ArrowLeftToLine size={15} />
          Open Entrance Screen
        </Link>
      </section>
    </main>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [visitorSearch, setVisitorSearch] = useState("");
  const [visitorStatus, setVisitorStatus] = useState<VisitorStatusFilter>("all");
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all");
  const [purposeFilter, setPurposeFilter] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("");
  const [visitorTypeFilter, setVisitorTypeFilter] = useState("");
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [logoutModalClosing, setLogoutModalClosing] = useState(false);
  const logoutCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (logoutCloseTimer.current) {
        clearTimeout(logoutCloseTimer.current);
      }

      if (noticeTimer.current) {
        clearTimeout(noticeTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!notice) return;

    if (noticeTimer.current) {
      clearTimeout(noticeTimer.current);
    }

    noticeTimer.current = setTimeout(() => {
      setNotice("");
      noticeTimer.current = null;
    }, 4000);
  }, [notice]);

  async function loadDashboard(cancelled?: () => boolean) {
    try {
      const response = await fetch("/api/admin/dashboard");

      if (!response.ok) {
        throw new Error("Dashboard request failed.");
      }

      const data = await response.json();

      if (!cancelled?.()) {
        setDashboard(data);
      }
    } catch {
      if (!cancelled?.()) {
        setError("Could not load dashboard data from the database.");
      }
    }
  }

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    void Promise.resolve().then(() => loadDashboard(() => cancelled));

    return () => {
      cancelled = true;
    };
  }, [status]);

  async function toggleVisitorBlocked(visitor: Visitor) {
    setError("");
    setNotice("");

    const nextBlocked = !visitor.blocked;
    const response = await fetch(`/api/admin/visitors/${visitor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolId: visitor.schoolId,
        email: visitor.email,
        name: visitor.name,
        college: visitor.college,
        type: visitor.type,
        blocked: nextBlocked,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Could not update visitor status.");
      return;
    }

    setNotice(nextBlocked ? "Visitor blocked." : "Visitor unblocked.");
    await loadDashboard();
  }

  if (status === "loading") {
    return (
      <main className="login-page">
        <AmbientBackground />
        <section className="admin-login-card">
          <p className="admin-login-kicker">Loading</p>
          <h1 className="admin-login-title">Checking Session</h1>
        </section>
      </main>
    );
  }

  if (!session?.user) {
    return <LoginView />;
  }

  const activeTitle = tabs.find((tab) => tab.id === activeTab)?.title ?? "Overview";
  const visitors = dashboard?.visitors ?? [];
  const visitLogs = dashboard?.visitLogs ?? [];
  const purposes = dashboard?.purposes ?? [];
  const colleges = Array.from(new Set(visitors.map((visitor) => visitor.college))).sort();
  const visitorTypes = Array.from(new Set(visitors.map((visitor) => visitor.type))).sort();
  const filteredLogs = visitLogs.filter((log) =>
    includesQuery(
      [log.schoolId, log.visitorName, log.college, log.type, log.purposeSnapshot, formatDate(log.visitedAt)],
      logSearch,
    ),
  );
  const filteredVisitors = visitors.filter((visitor) => {
    const statusMatches =
      visitorStatus === "all" ||
      (visitorStatus === "active" && !visitor.blocked) ||
      (visitorStatus === "blocked" && visitor.blocked);

    return (
      statusMatches &&
      includesQuery(
        [visitor.schoolId, visitor.name, visitor.email, visitor.college, visitor.type],
        visitorSearch,
      )
    );
  });
  const overviewLogs = visitLogs.filter((log) => {
    return (
      inDateRange(log.visitedAt, dateRange) &&
      (!purposeFilter || log.purposeSnapshot === purposeFilter) &&
      (!collegeFilter || log.college === collegeFilter) &&
      (!visitorTypeFilter || log.type === visitorTypeFilter)
    );
  });
  const overviewCharts = {
    visitsPerDay: visitsPerDay(overviewLogs),
    purposeBreakdown: countBy(overviewLogs, (log) => log.purposeSnapshot),
    visitsByHour: visitsByHour(overviewLogs),
    topColleges: countBy(overviewLogs, (log) => log.college).slice(0, 6),
  };
  const overviewStats = {
    totalVisits: overviewLogs.length,
    uniqueVisitors: new Set(overviewLogs.map((log) => log.schoolId)).size,
    topPurpose: overviewCharts.purposeBreakdown[0]?.label ?? "-",
    topCollege: overviewCharts.topColleges[0]?.label ?? "-",
  };
  const stats = [
    {
      icon: ArrowLeftToLine,
      tone: "blue",
      value: overviewStats.totalVisits,
      label: "Total Visits",
    },
    {
      icon: Users,
      tone: "gold",
      value: overviewStats.uniqueVisitors,
      label: "Unique Visitors",
    },
    {
      icon: BookOpen,
      tone: "green",
      value: overviewStats.topPurpose,
      label: "Top Purpose",
    },
    {
      icon: Building2,
      tone: "purple",
      value: overviewStats.topCollege,
      label: "Top College",
    },
  ];
  const purposeOptions = [{ label: "All Purposes", value: "" }, ...purposes.map((purpose) => ({ label: purpose.name, value: purpose.name }))];
  const collegeOptions = [{ label: "All Colleges", value: "" }, ...colleges.map((college) => ({ label: college, value: college }))];
  const visitorTypeOptions = [
    { label: "All Visitors", value: "" },
    ...visitorTypes.map((type) => ({ label: displayType(type), value: type })),
  ];
  const hourMax = maxCount(overviewCharts.visitsByHour);
  const collegeMax = maxCount(overviewCharts.topColleges);
  const purposeRows = overviewCharts.purposeBreakdown.length
    ? overviewCharts.purposeBreakdown
    : [{ label: "No logs yet", count: 0 }];
  const purposeTotal = purposeRows.reduce((sum, row) => sum + row.count, 0);
  const topVisitors = visitors.slice().sort((a, b) => b.totalVisits - a.totalVisits);
  const logExportRows = filteredLogs.map((log, index) => [
    index + 1,
    log.schoolId,
    log.visitorName,
    log.college,
    displayType(log.type),
    log.purposeSnapshot,
    formatDate(log.visitedAt),
    formatTime(log.visitedAt),
  ]);
  const topVisitorExportRows = topVisitors.map((visitor, index) => [
    index + 1,
    visitor.schoolId,
    visitor.name,
    visitor.college,
    displayType(visitor.type),
    visitor.totalVisits,
    visitor.currentStreak,
    visitor.longestStreak,
  ]);
  const visitorExportRows = filteredVisitors.map((visitor) => [
    visitor.schoolId,
    visitor.name,
    visitor.college,
    displayType(visitor.type),
    visitor.email,
    visitor.totalVisits,
    formatDate(visitor.lastVisitAt),
    visitor.blocked ? "Blocked" : "Active",
  ]);
  const exportGroups = [
    {
      key: "logs",
      title: "Visitor Logs",
      description: `${logExportRows.length} filtered log entries`,
      headers: ["#", "School ID", "Name", "College / Office", "Type", "Purpose", "Date", "Time"],
      rows: logExportRows,
    },
    {
      key: "top-visitors",
      title: "Top Visitors",
      description: `${topVisitorExportRows.length} ranked visitors`,
      headers: ["Rank", "School ID", "Name", "College / Office", "Type", "Total Visits", "Current Streak", "Longest Streak"],
      rows: topVisitorExportRows,
    },
    {
      key: "visitors",
      title: "Visitors",
      description: `${visitorExportRows.length} filtered visitor records`,
      headers: ["School ID", "Name", "College / Office", "Type", "Email", "Total Visits", "Last Visit", "Status"],
      rows: visitorExportRows,
    },
  ];

  function exportGroup(group: (typeof exportGroups)[number], format: "csv" | "pdf") {
    const stamp = dateKey(new Date());
    const filename = `neu-library-${group.key}-${stamp}.${format}`;

    if (format === "csv") {
      exportCsv(filename, group.headers, group.rows);
    } else {
      exportPdf(filename, group.title, group.headers, group.rows);
    }

    setNotice(`${group.title} exported as ${format.toUpperCase()}.`);
  }

  function openLogoutModal() {
    if (logoutCloseTimer.current) {
      clearTimeout(logoutCloseTimer.current);
      logoutCloseTimer.current = null;
    }

    setLogoutModalClosing(false);
    setLogoutModalOpen(true);
  }

  function closeLogoutModal() {
    if (logoutModalClosing) {
      return;
    }

    setLogoutModalClosing(true);
    logoutCloseTimer.current = setTimeout(() => {
      setLogoutModalOpen(false);
      setLogoutModalClosing(false);
      logoutCloseTimer.current = null;
    }, 190);
  }

  function confirmSignOut() {
    signOut({ callbackUrl: "/admin" });
  }

  return (
    <main className="admin-page">
      <AmbientBackground />

      <aside className="sidebar">
        <div className="sidebar-logo">
          <Image
            src="/assets/neu-logo.png"
            alt="NEU"
            width={38}
            height={38}
            className="sidebar-neu-logo"
          />
          <div className="sidebar-brand">
            <div className="logo-title">NEU Library</div>
            <div className="logo-sub">Admin Dashboard</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sidebarSections.map((section) => (
            <div className="nav-section" key={section.label}>
              <div className="nav-section-label">{section.label}</div>
              {section.items.map((tabId) => {
                const tab = tabs.find((item) => item.id === tabId);

                if (!tab) return null;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="nav-icon">
                      <tab.icon size={17} strokeWidth={2.2} />
                    </span>
                    <span className="nav-label">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar-wrap">
              <div className="sidebar-user-avatar">
                <UserCog size={17} />
              </div>
              <span className="sidebar-online-dot" />
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{session.user.name ?? "Library Administrator"}</div>
              <div className="sidebar-user-email">{session.user.email ?? "admin@neu.edu.ph"}</div>
            </div>
          </div>
          <button className="nav-item entrance-link" type="button" onClick={openLogoutModal}>
            <span className="nav-icon">
              <LogOut size={17} strokeWidth={2.2} />
            </span>
            <span className="nav-label">Sign Out</span>
          </button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title">{activeTitle}</h1>
            <p className="page-sub">NEU Main Library - Real-time Statistics</p>
          </div>
          <div className="topbar-right">
            <FilterDropdown
              compact
              label="Date range"
              options={dateRangeOptions}
              value={dateRange}
              onChange={(value) => setDateRange(value as DateRangeFilter)}
            />
          </div>
        </header>

        {error && <p className="admin-login-error">{error}</p>}

        {activeTab === "overview" && (
          <div className="tab-content active">
            <div className="stat-filter-bar">
              <span className="stat-filter-label">Filter by:</span>
              <FilterDropdown label="Purpose" options={purposeOptions} value={purposeFilter} onChange={setPurposeFilter} />
              <FilterDropdown label="College" options={collegeOptions} value={collegeFilter} onChange={setCollegeFilter} />
              <FilterDropdown label="Visitor" options={visitorTypeOptions} value={visitorTypeFilter} onChange={setVisitorTypeFilter} />
              <button
                className="stat-filter-clear"
                type="button"
                onClick={() => {
                  setPurposeFilter("");
                  setCollegeFilter("");
                  setVisitorTypeFilter("");
                }}
              >
                Clear
              </button>
            </div>

            <div className="stat-cards">
              {stats.map((stat) => (
                <article className="stat-card" key={stat.label}>
                  <div className={`stat-icon-wrap ${stat.tone}`}>
                    <stat.icon size={21} strokeWidth={2.2} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                </article>
              ))}
            </div>

            <div className="charts-grid">
              <section className="chart-card span-2 line-chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">Visits Per Day</h3>
                </div>
                <LineChart rows={overviewCharts.visitsPerDay} />
              </section>
              <section className="chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">Purpose Breakdown</h3>
                </div>
                <div className="donut-chart-wrap">
                  <div className="donut-chart" style={{ background: pieBackground(purposeRows) }}>
                    <span>{purposeTotal}</span>
                    <small>Visits</small>
                  </div>
                  <div className="donut-legend">
                    {purposeRows.map((row, index) => (
                      <div className="donut-legend-row" key={row.label}>
                        <span
                          className="donut-dot"
                          style={{ background: chartColors[index % chartColors.length] }}
                        />
                        <p>{row.label}</p>
                        <strong>{row.count}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
              <section className="chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">Visits by Hour</h3>
                </div>
                <div className="real-chart bars compact">
                  {(overviewCharts.visitsByHour.length ? overviewCharts.visitsByHour : [{ label: "No logs", count: 0 }]).map((row) => (
                    <span key={row.label} style={{ height: `${Math.max(6, (row.count / hourMax) * 100)}%` }}>
                      <strong>{row.count}</strong>
                      <small>{row.label}</small>
                    </span>
                  ))}
                </div>
              </section>
              <section className="chart-card span-2 metric-chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">Top Colleges</h3>
                </div>
                <div className="metric-list">
                  {(overviewCharts.topColleges.length ? overviewCharts.topColleges : [{ label: "No logs yet", count: 0 }]).map((row) => (
                    <div className="metric-row" key={row.label}>
                      <div>
                        <span>{row.label}</span>
                        <i style={{ width: `${Math.max(4, (row.count / collegeMax) * 100)}%` }} />
                      </div>
                      <strong>{row.count}</strong>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="tab-content active">
            <div className="toolbar">
              <div className="search-wrap">
                <span className="search-icon">
                  <Search size={15} strokeWidth={2.2} />
                </span>
                <input
                  className="search-input"
                  placeholder="Search by name, college, or purpose..."
                  value={logSearch}
                  onChange={(event) => setLogSearch(event.target.value)}
                />
              </div>
              <span className="record-count">{filteredLogs.length} of {visitLogs.length} entries</span>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>School ID</th>
                    <th>Name</th>
                    <th>College / Office</th>
                    <th>Type</th>
                    <th>Purpose</th>
                    <th>Date</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, index) => (
                    <tr key={log.id}>
                      <td>{index + 1}</td>
                      <td>{log.schoolId}</td>
                      <td>{log.visitorName}</td>
                      <td>{log.college}</td>
                      <td><span className={`badge badge-${log.type.toLowerCase()}`}>{displayType(log.type)}</span></td>
                      <td>{log.purposeSnapshot}</td>
                      <td>{formatDate(log.visitedAt)}</td>
                      <td>{formatTime(log.visitedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "topvisitors" && (
          <div className="tab-content active">
            <div className="top-visitors-list">
              {topVisitors.map((visitor, index) => (
                <article className="top-visitor-card" key={visitor.schoolId}>
                  <div className="top-rank">{["#1", "#2", "#3"][index] ?? `#${index + 1}`}</div>
                  <div>
                    <h3>{visitor.name}</h3>
                    <p>{visitor.college}</p>
                  </div>
                  <strong>{visitor.totalVisits}</strong>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeTab === "students" && (
          <div className="tab-content active">
            <div className="toolbar">
              <div className="search-wrap">
                <span className="search-icon">
                  <Search size={15} strokeWidth={2.2} />
                </span>
                <input
                  className="search-input"
                  placeholder="Search by name, ID, or college..."
                  value={visitorSearch}
                  onChange={(event) => setVisitorSearch(event.target.value)}
                />
              </div>
              <div className="toolbar-right">
                <span className="record-count">{filteredVisitors.length} of {visitors.length} visitors</span>
                <div className="filter-toggle">
                  <button className={`filter-pill ${visitorStatus === "all" ? "active" : ""}`} type="button" onClick={() => setVisitorStatus("all")}>All</button>
                  <button className={`filter-pill ${visitorStatus === "active" ? "active" : ""}`} type="button" onClick={() => setVisitorStatus("active")}>Active</button>
                  <button className={`filter-pill ${visitorStatus === "blocked" ? "active" : ""}`} type="button" onClick={() => setVisitorStatus("blocked")}>Blocked</button>
                </div>
              </div>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>School ID</th>
                    <th>Name</th>
                    <th>College / Office</th>
                    <th>Type</th>
                    <th>Email</th>
                    <th className="numeric-column">Total Visits</th>
                    <th>Last Visit</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitors.map((visitor) => (
                    <tr key={visitor.schoolId}>
                      <td>{visitor.schoolId}</td>
                      <td>{visitor.name}</td>
                      <td>{visitor.college}</td>
                      <td><span className={`badge badge-${visitor.type.toLowerCase()}`}>{displayType(visitor.type)}</span></td>
                      <td>{visitor.email}</td>
                      <td className="numeric-column">{visitor.totalVisits}</td>
                      <td>{formatDate(visitor.lastVisitAt)}</td>
                      <td><span className={`badge ${visitor.blocked ? "badge-blocked" : "badge-active"}`}>{visitor.blocked ? "Blocked" : "Active"}</span></td>
                      <td className="row-actions">
                        <button
                          type="button"
                          className={visitor.blocked ? "row-action-restore" : "row-action-warn"}
                          onClick={() => toggleVisitorBlocked(visitor)}
                          aria-label={visitor.blocked ? "Unblock visitor" : "Block visitor"}
                          title={visitor.blocked ? "Unblock visitor" : "Block visitor"}
                        >
                          {visitor.blocked ? "Unblock" : "Block"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="tab-content active">
            <div className="settings-grid export-grid">
              {exportGroups.map((group) => (
                <article className="settings-card export-card" key={group.key}>
                  <div className="settings-card-header">
                    <div className="settings-icon">
                      <FileSpreadsheet size={18} strokeWidth={2.2} />
                    </div>
                    <div>
                      <h3 className="settings-title">{group.title}</h3>
                      <p className="settings-sub">{group.description}</p>
                    </div>
                  </div>
                  <div className="export-actions">
                    <button type="button" className="inline-action primary" onClick={() => exportGroup(group, "csv")}>
                      <FileSpreadsheet size={14} />
                      CSV
                    </button>
                    <button type="button" className="inline-action" onClick={() => exportGroup(group, "pdf")}>
                      <FileDown size={14} />
                      PDF
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

      </section>

      {notice && (
        <div className="admin-toast" role="status" aria-live="polite">
          <span className="admin-toast-dot" />
          <p>{notice}</p>
        </div>
      )}

      {logoutModalOpen && (
        <div className={`logout-modal-backdrop ${logoutModalClosing ? "is-closing" : ""}`} role="presentation">
          <section className={`logout-modal ${logoutModalClosing ? "is-closing" : ""}`} role="dialog" aria-modal="true" aria-labelledby="logoutTitle">
            <button type="button" className="logout-modal-close" onClick={closeLogoutModal} aria-label="Close logout confirmation">
              <X size={16} strokeWidth={2.4} />
            </button>
            <div className="logout-modal-icon">
              <ShieldAlert size={24} strokeWidth={2.2} />
            </div>
            <p className="logout-modal-kicker">Session Control</p>
            <h2 id="logoutTitle">Sign out of admin?</h2>
            <p className="logout-modal-text">
              You will return to the admin login screen. Make sure any current changes are saved.
            </p>
            <div className="logout-modal-actions">
              <button type="button" className="logout-cancel-btn" onClick={closeLogoutModal}>
                Cancel
              </button>
              <button type="button" className="logout-confirm-btn" onClick={confirmSignOut}>
                Sign Out
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
