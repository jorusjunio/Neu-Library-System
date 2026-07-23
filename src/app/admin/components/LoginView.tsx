"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeftToLine } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { AmbientBackground } from "@/components/shared/AmbientBackground";

export function LoginView() {
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
