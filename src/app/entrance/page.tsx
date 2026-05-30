"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import type { LucideIcon } from "lucide-react";
import { BookOpen, ClipboardList, LockKeyhole, Monitor, Search, X } from "lucide-react";
import { AmbientBackground } from "@/components/shared/AmbientBackground";
import { NeuHeader } from "@/components/shared/NeuHeader";

type Screen = "idle" | "scanning" | "welcome" | "success" | "error";
type LoginMode = "id" | "email";

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
  lastVisit: string | null;
  blocked: boolean;
};

type PurposeOption = {
  id: string;
  name: string;
};

const defaultPurposes: PurposeOption[] = [
  { id: "", name: "Reading Books" },
  { id: "", name: "Thesis Research" },
  { id: "", name: "Use of Computer" },
  { id: "", name: "Doing Assignments" },
];

const purposeDetails: Record<string, { Icon: LucideIcon; className: string }> = {
  "Reading Books": {
    Icon: BookOpen,
    className: "purpose-reading",
  },
  "Thesis Research": {
    Icon: Search,
    className: "purpose-research",
  },
  "Use of Computer": {
    Icon: Monitor,
    className: "purpose-computer",
  },
  "Doing Assignments": {
    Icon: ClipboardList,
    className: "purpose-assignment",
  },
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function displayType(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

export default function EntrancePage() {
  const [screen, setScreen] = useState<Screen>("idle");
  const [mode, setMode] = useState<LoginMode>("id");
  const [input, setInput] = useState("");
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [purposes, setPurposes] = useState<PurposeOption[]>(defaultPurposes);
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [error, setError] = useState("Please see the librarian for assistance.");
  const [submitting, setSubmitting] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminModalClosing, setAdminModalClosing] = useState(false);
  const [adminUsername, setAdminUsername] = useState("admin");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminNotice, setAdminNotice] = useState("");
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const adminCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (adminCloseTimer.current) {
        clearTimeout(adminCloseTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPurposes() {
      const response = await fetch("/api/entrance/purposes");

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const activePurposes = Array.isArray(data.purposes) ? data.purposes : [];

      if (!cancelled && activePurposes.length > 0) {
        setPurposes(activePurposes);
      }
    }

    void loadPurposes().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  function openAdminModal() {
    if (adminCloseTimer.current) {
      clearTimeout(adminCloseTimer.current);
      adminCloseTimer.current = null;
    }

    setAdminModalClosing(false);
    setAdminModalOpen(true);
  }

  function closeAdminModal() {
    if (adminModalClosing) {
      return;
    }

    setAdminModalClosing(true);
    adminCloseTimer.current = setTimeout(() => {
      setAdminModalOpen(false);
      setAdminModalClosing(false);
      setAdminError("");
      setAdminNotice("");
      setAdminPassword("");
      adminCloseTimer.current = null;
    }, 260);
  }

  function reset() {
    setScreen("idle");
    setInput("");
    setVisitor(null);
    setSelectedPurpose("");
    setSubmitting(false);
    setError("Please see the librarian for assistance.");
  }

  async function scanVisitor() {
    const value = input.trim();

    if (!value) {
      setError(mode === "id" ? "Please enter a school ID." : "Please enter an email.");
      setScreen("error");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/entrance/lookup?input=${encodeURIComponent(value)}`);

      if (response.status === 404) {
        setError(mode === "id" ? "School ID was not found." : "Email was not found.");
        setScreen("error");
        return;
      }

      if (!response.ok) {
        setError("Could not check visitor records. Please try again.");
        setScreen("error");
        return;
      }

      const data = await response.json();
      const match = data.visitor as Visitor | null;

      if (!match) {
        setError(mode === "id" ? "School ID was not found." : "Email was not found.");
        setScreen("error");
        return;
      }

      if (match.blocked) {
        setError("This visitor account is blocked. Please see the librarian.");
        setScreen("error");
        return;
      }

      setVisitor(match);
      setScreen("scanning");
      window.setTimeout(() => setScreen("welcome"), 720);
    } catch {
      setError("Database connection failed. Please see the librarian.");
      setScreen("error");
    } finally {
      setSubmitting(false);
    }
  }

  async function logPurpose(purpose: PurposeOption) {
    if (!visitor || submitting) return;

    setSubmitting(true);

    try {
      const response = await fetch("/api/visit-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visitorId: visitor.id,
          purposeId: purpose.id || undefined,
          purposeName: purpose.name,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "Visit could not be logged. Please try again.");
        setScreen("error");
        return;
      }

      setSelectedPurpose(purpose.name);
      setScreen("success");
      window.setTimeout(reset, 2000);
    } catch {
      setError("Database connection failed. Please see the librarian.");
      setScreen("error");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitAdminLogin() {
    setAdminError("");
    setAdminNotice("");
    setAdminSubmitting(true);

    const result = await signIn("credentials", {
      username: adminUsername,
      password: adminPassword,
      redirect: false,
    });

    setAdminSubmitting(false);

    if (result?.error) {
      setAdminError("Invalid admin username or password.");
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <main className="entrance-page">
      <AmbientBackground />
      <NeuHeader onLogoClick={openAdminModal} showLoginHint={screen === "idle" && !adminModalOpen} />

      <section className="main-container">
        {screen === "idle" && (
          <div className="screen" id="screenIdle">
            <div className="hero">
              <p className="hero-eyebrow">GOOD DAY! YOU ARE AT</p>
              <h1 className="hero-title">
                <span className="hero-line-1">WELCOME TO</span>
                <span className="hero-line-2">NEU LIBRARY</span>
              </h1>
              <p className="hero-subtitle">Quezon City, Philippines - Est. 1975</p>
            </div>

            <div className="rfid-ring">
              <div className="rfid-pulse" />
              <div className="rfid-pulse pulse-2" />
              <div className="rfid-pulse pulse-3" />
              <div className="rfid-icon" aria-hidden="true">
                <svg viewBox="0 0 80 80" fill="none">
                  <rect x="20" y="25" width="40" height="30" rx="4" stroke="currentColor" strokeWidth="2.5" />
                  <rect x="27" y="32" width="12" height="16" rx="2" fill="currentColor" opacity="0.6" />
                  <line x1="45" y1="34" x2="55" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="45" y1="40" x2="55" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="45" y1="46" x2="52" y2="46" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M10 20 Q10 10 20 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                  <path d="M70 20 Q70 10 60 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                  <path d="M10 60 Q10 70 20 70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                  <path d="M70 60 Q70 70 60 70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                </svg>
              </div>
            </div>

            <div className={`login-toggle ${mode === "email" ? "email-active" : ""}`}>
              <button
                type="button"
                className={`toggle-btn ${mode === "id" ? "active" : ""}`}
                onClick={() => {
                  setMode("id");
                  setInput("");
                }}
              >
                School ID
              </button>
              <button
                type="button"
                className={`toggle-btn ${mode === "email" ? "active" : ""}`}
                onClick={() => {
                  setMode("email");
                  setInput("");
                }}
              >
                Email
              </button>
            </div>

            <div className="id-input-group">
              <input
                type={mode === "email" ? "email" : "text"}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") scanVisitor();
                }}
                className="rfid-input"
                placeholder={
                  mode === "id"
                    ? "School ID  e.g. 2021-00001"
                    : "Email  e.g. juan@neu.edu.ph"
                }
                autoComplete="off"
                spellCheck={false}
              />
              <button type="button" className="scan-btn" onClick={scanVisitor} disabled={submitting}>
                {submitting ? "CHECKING" : "SCAN"}
              </button>
            </div>
          </div>
        )}

        {screen === "scanning" && (
          <div className="screen" id="screenScanning">
            <div className="scanning-anim">
              <div className="scan-line" />
              <div className="scan-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
            <p className="scanning-title">Reading ID Card</p>
            <p className="scanning-text">Please hold still...</p>
          </div>
        )}

        {screen === "welcome" && visitor && (
          <div className="screen" id="screenWelcome">
            <div className="welcome-hero">
              <p className="welcome-hero-label">WELCOME BACK,</p>
              <h2 className="welcome-hero-name">{visitor.name}</h2>
              <p className="welcome-hero-msg">
                Great to see you! Enjoy your time at the library.
              </p>
            </div>

            <div className="welcome-card">
              <div className="welcome-avatar">{initials(visitor.name)}</div>
              <div className="welcome-info">
                <div className="welcome-college">{visitor.college}</div>
                <div className="welcome-type">{displayType(visitor.type)}</div>
              </div>
              <div className="welcome-stats">
                <div className="stat-item">
                  <span className="stat-val">{visitor.currentStreak}</span>
                  <span className="stat-lbl">Streak</span>
                </div>
                <div className="stat-sep" />
                <div className="stat-item">
                  <span className="stat-val">{visitor.totalVisits}</span>
                  <span className="stat-lbl">Visits</span>
                </div>
              </div>
            </div>

            <div className="purpose-section">
              <p className="purpose-label">What is your purpose of visit today?</p>
              <div className="purpose-tabbar">
                {purposes.map((purpose) => {
                  const { Icon, className } = purposeDetails[purpose.name] ?? {
                    Icon: BookOpen,
                    className: "purpose-reading",
                  };

                  return (
                    <button
                      type="button"
                      key={purpose.id || purpose.name}
                      className={`purpose-card ${className}`}
                      onClick={() => logPurpose(purpose)}
                      disabled={submitting}
                    >
                      <span className="purpose-icon">
                        <Icon size={25} strokeWidth={2.3} />
                      </span>
                      <span className="purpose-text">{purpose.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {screen === "success" && (
          <div className="screen" id="screenSuccess">
            <div className="success-circle">
              <svg className="checkmark" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <div className="success-content">
              <h2 className="success-title">You&apos;re all set!</h2>
              <p className="success-subtitle">ENTRY LOGGED SUCCESSFULLY</p>
              <p className="success-purpose">{selectedPurpose}</p>
              <p className="success-msg">Enjoy your time at the NEU Library.</p>
            </div>
            <div className="countdown-bar-wrap">
              <div className="countdown-bar" />
            </div>
          </div>
        )}

        {screen === "error" && (
          <div className="screen" id="screenError">
            <div className="error-icon-wrap">
              <span className="error-icon">!</span>
            </div>
            <div className="error-content">
              <h2 className="error-title">Action Needed</h2>
              <p className="error-msg">{error}</p>
            </div>
            <button type="button" className="retry-btn" onClick={reset}>
              Back to Try Again
            </button>
          </div>
        )}
      </section>

      <footer className="footer">
        <span>NEU Library Visitor System</span>
        <span>New Era University - Quezon City &nbsp;-&nbsp; Copyright 2025</span>
      </footer>

      {adminModalOpen && (
        <div
          className={`admin-modal-backdrop ${adminModalClosing ? "is-closing" : ""}`}
          role="presentation"
        >
          <section
            className={`admin-modal ${adminModalClosing ? "is-closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="adminLoginTitle"
          >
            <button
              type="button"
              className="admin-modal-close"
              onClick={closeAdminModal}
              aria-label="Close admin login"
            >
              <X size={17} strokeWidth={2.4} />
            </button>

            <div className="admin-modal-icon">
              <LockKeyhole size={24} strokeWidth={2.3} />
            </div>
            <p className="admin-modal-kicker">Administrator Access</p>
            <h2 id="adminLoginTitle">Login to Admin Panel</h2>
            <p className="admin-modal-sub">
              Enter your admin credentials to manage visitors, logs, purposes, and dashboard data.
            </p>

            <div className="admin-modal-fields">
              <input
                value={adminUsername}
                onChange={(event) => setAdminUsername(event.target.value)}
                className="admin-modal-input"
                placeholder="Username"
                autoComplete="username"
              />
              <input
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitAdminLogin();
                }}
                type="password"
                className="admin-modal-input"
                placeholder="Password"
                autoComplete="current-password"
              />
            </div>

            {adminError && <p className="admin-modal-error">{adminError}</p>}
            {adminNotice && <p className="admin-modal-note">{adminNotice}</p>}

            <button
              type="button"
              className="admin-modal-submit"
              onClick={submitAdminLogin}
              disabled={adminSubmitting}
            >
              {adminSubmitting ? "Signing In..." : "Sign In"}
            </button>
            <button
              type="button"
              className="admin-modal-google"
              onClick={() => {
                setAdminError("");
                setAdminNotice("Google login is ready in the UI. We will connect the provider next.");
              }}
            >
              <span className="google-mark" aria-hidden="true">G</span>
              Continue with Google
              <span className="soon-pill">soon</span>
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
