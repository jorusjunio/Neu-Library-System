"use client";

import {
  ArrowLeftToLine,
  BookOpen,
  Building2,
  FileDown,
  FileSpreadsheet,
  Search,
  ShieldAlert,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { AmbientBackground } from "@/components/shared/AmbientBackground";
import { FilterBar } from "./components/FilterBar";
import { FilterDropdown } from "./components/FilterDropdown";
import { LoginView } from "./components/LoginView";
import { MetricsGrid, type StatCard } from "./components/MetricsGrid";
import { Sidebar } from "./components/Sidebar";
import { HourlyVisitsBarChart } from "./components/charts/HourlyVisitsBarChart";
import { PurposeDonutChart } from "./components/charts/PurposeDonutChart";
import { TopCollegesList } from "./components/charts/TopCollegesList";
import { VisitsLineChart } from "./components/charts/VisitsLineChart";
import { dateRangeOptions, tabs } from "./config";
import { useDashboardFilters } from "./hooks/useDashboardFilters";
import { exportCsv, exportPdf } from "./lib/export";
import { countBy, dateKey, displayType, formatDate, formatTime, inDateRange, includesQuery, visitsByHour, visitsPerDay } from "./lib/format";
import type { DashboardData, DateRangeFilter, Tab, Visitor, VisitorStatusFilter } from "./types";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [visitorSearch, setVisitorSearch] = useState("");
  const [visitorStatus, setVisitorStatus] = useState<VisitorStatusFilter>("all");
  const { filters, setPurpose, setCollege, setVisitorType, setDateRange, reset: resetFilters } = useDashboardFilters();
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
      inDateRange(log.visitedAt, filters.dateRange) &&
      (!filters.purpose || log.purposeSnapshot === filters.purpose) &&
      (!filters.college || log.college === filters.college) &&
      (!filters.visitorType || log.type === filters.visitorType)
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
  const stats: StatCard[] = [
    {
      icon: ArrowLeftToLine,
      tone: "blue",
      value: overviewStats.totalVisits,
      label: "Total Visits",
    },
    {
      icon: UsersIcon,
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

      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userName={session.user.name ?? "Library Administrator"}
        userEmail={session.user.email ?? "admin@neu.edu.ph"}
        onSignOutClick={openLogoutModal}
      />

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
              value={filters.dateRange}
              onChange={(value) => setDateRange(value as DateRangeFilter)}
            />
          </div>
        </header>

        {error && <p className="admin-login-error">{error}</p>}

        {activeTab === "overview" && (
          <div className="tab-content active">
            <FilterBar
              filters={filters}
              purposeOptions={purposeOptions}
              collegeOptions={collegeOptions}
              visitorTypeOptions={visitorTypeOptions}
              onPurposeChange={setPurpose}
              onCollegeChange={setCollege}
              onVisitorTypeChange={setVisitorType}
              onClear={resetFilters}
            />

            <MetricsGrid stats={stats} />

            <div className="charts-grid">
              <section className="chart-card span-2 line-chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">Visits Per Day</h3>
                </div>
                <VisitsLineChart rows={overviewCharts.visitsPerDay} />
              </section>
              <section className="chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">Purpose Breakdown</h3>
                </div>
                <PurposeDonutChart rows={overviewCharts.purposeBreakdown} />
              </section>
              <section className="chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">Visits by Hour</h3>
                </div>
                <HourlyVisitsBarChart rows={overviewCharts.visitsByHour} />
              </section>
              <section className="chart-card span-2 metric-chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">Top Colleges</h3>
                </div>
                <TopCollegesList rows={overviewCharts.topColleges} />
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
