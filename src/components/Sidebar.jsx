import React from "react";
import { Compass, Inbox as InboxIcon, Layers, Settings as SettingsIcon, X } from "lucide-react";

const ITEMS = [
  { id: "overview", label: "Overview", icon: Compass },
  { id: "inbox", label: "Inbox", icon: InboxIcon },
  { id: "pipeline", label: "Pipeline", icon: Layers },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar({ view, setView, profile, guest, mobileOpen, onClose, counts }) {
  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`app-sidebar${mobileOpen ? " open" : ""}`}>
        <div className="brand">
          <div>
            <div className="brand-mark"><span className="brand-dot" aria-hidden="true" />TravelSleek</div>
            <div className="brand-sub">{guest ? "browsing as guest" : `${profile?.name || "your"} · case file`}</div>
          </div>
          <button onClick={onClose} className="mobile-menu-btn icon-btn" aria-label="Close menu"><X size={18} /></button>
        </div>
        <nav aria-label="Main">
          {ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item${view === id ? " active" : ""}`} aria-current={view === id ? "page" : undefined}
              onClick={() => { setView(id); onClose?.(); }}>
              <Icon size={16} /> <span>{label}</span>
              {counts?.[id] > 0 && <em>{counts[id]}</em>}
            </button>
          ))}
        </nav>
        {guest && (
          <button className="btn btn-primary side-cta" onClick={() => { setView("auth"); onClose?.(); }}>Log in / Sign up</button>
        )}
      </aside>
    </>
  );
}
