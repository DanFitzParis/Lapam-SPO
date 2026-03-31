"use client";

import { Activity, FolderKanban, Users } from "lucide-react";
import { NavItem } from "./NavItem";

export function Sidebar() {
  return (
    <aside
      className="w-64 bg-shell flex flex-col"
      style={{ backgroundColor: "var(--color-shell-bg)" }}
    >
      {/* Logo/Wordmark */}
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: "var(--color-brand-purple)" }}
          >
            MC
          </div>
          <div>
            <h1 className="text-white text-lg font-bold leading-tight">Mission Control</h1>
            <p className="text-neutral-200 text-xs">SPO Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        <NavItem href="/team" icon={Users} label="Team" />
        <NavItem href="/projects" icon={FolderKanban} label="Projects" />
        <NavItem href="/activity" icon={Activity} label="Live Activity" />
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <p className="text-neutral-200 text-xs font-medium">Operator: Daniel</p>
        <p className="text-neutral-300 text-xs mt-1">OpenClaw v0.1</p>
      </div>
    </aside>
  );
}
