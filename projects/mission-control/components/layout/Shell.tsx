import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 bg-workspace overflow-auto">{children}</main>
    </div>
  );
}
