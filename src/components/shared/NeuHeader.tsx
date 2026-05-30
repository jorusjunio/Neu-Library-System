"use client";

import Image from "next/image";
import { LiveClock } from "@/components/shared/LiveClock";

type NeuHeaderProps = {
  onLogoClick?: () => void;
  showLoginHint?: boolean;
};

export function NeuHeader({ onLogoClick, showLoginHint = false }: NeuHeaderProps) {
  return (
    <header className="neu-header">
      <div className="header-logo">
        <button
          type="button"
          className={`neu-logo-button ${showLoginHint ? "show-hint" : ""}`}
          onClick={onLogoClick}
          aria-label="Open admin login"
        >
          {showLoginHint && <span className="logo-tap-ring" />}
          <span className="neu-logo-wrap">
            <Image
              src="/assets/neu-logo.png"
              alt="NEU Logo"
              width={50}
              height={50}
              className="neu-logo"
              priority
            />
          </span>
          {showLoginHint && (
            <span className="logo-login-hint">
              <span>Admin login</span>
              <small>Click the logo</small>
            </span>
          )}
        </button>
        <span className="title-main">NEW ERA UNIVERSITY</span>
      </div>
      <div className="header-center">
        <span className="title-sub">Library Information System</span>
      </div>
      <LiveClock />
    </header>
  );
}
