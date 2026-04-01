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
        "flex items-center gap-3 px-4 py-3 rounded-2xl",
        "text-sm font-medium transition-all duration-[180ms]"
      )}
      style={{
        backgroundColor: isActive ? "#301E4A" : "transparent",
        color: isActive ? "#FFFFFF" : "rgba(255, 255, 255, 0.88)",
        transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
      }}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );
}
