"use client";

import { Activity, FolderKanban, Users } from "lucide-react";
import { NavItem } from "./NavItem";

export function Sidebar() {
  return (
    <aside
      className="w-60 bg-shell flex flex-col"
      style={{ backgroundColor: "var(--color-shell-bg)" }}
    >
      {/* Logo/Wordmark */}
      <div className="px-5 pt-6 pb-4">
        <div>
          <h1 className="text-white text-2xl font-bold leading-tight">SPO</h1>
          <p className="text-sm" style={{ color: "rgba(255, 255, 255, 0.64)" }}>
            Mission Control
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3 mt-2">
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
