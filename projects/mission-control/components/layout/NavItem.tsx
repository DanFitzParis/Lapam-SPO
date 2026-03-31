"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
}

export function NavItem({ href, icon: Icon, label }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative",
        "text-sm font-medium",
        isActive
          ? "text-white bg-white/5"
          : "text-neutral-200 hover:text-white hover:bg-white/5",
      )}
      style={{
        borderLeft: isActive ? "3px solid var(--color-brand-purple)" : "3px solid transparent",
      }}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );
}
