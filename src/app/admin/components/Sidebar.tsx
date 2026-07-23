import Image from "next/image";
import { LogOut, UserCog } from "lucide-react";
import { sidebarSections, tabs } from "../config";
import type { Tab } from "../types";

export function Sidebar({
  activeTab,
  onTabChange,
  userName,
  userEmail,
  onSignOutClick,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  userName: string;
  userEmail: string;
  onSignOutClick: () => void;
}) {
  return (
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
                  onClick={() => onTabChange(tab.id)}
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
            <div className="sidebar-user-name">{userName}</div>
            <div className="sidebar-user-email">{userEmail}</div>
          </div>
        </div>
        <button className="nav-item entrance-link" type="button" onClick={onSignOutClick}>
          <span className="nav-icon">
            <LogOut size={17} strokeWidth={2.2} />
          </span>
          <span className="nav-label">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
