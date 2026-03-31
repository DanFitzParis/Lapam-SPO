"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import {
  LayoutDashboard,
  Briefcase,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Pipeline", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/talent-pool", label: "Talent Pool", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
]

const settingsItems = [
  { href: "/settings/locations", label: "Locations" },
  { href: "/settings/users", label: "Users" },
]

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(href)
  }

  const nav = (
    <div className="flex flex-col h-full bg-brand-400 text-white">
      {/* Logo/Brand header - explicit white color to override global h1 styles */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-semibold tracking-tight !text-white">Lapam</h1>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                active
                  ? "bg-brand-300 text-white"
                  : "text-white/88 hover:bg-white/10"
              }`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}

        {/* Settings section - explicit white color for label */}
        <div className="pt-4 mt-4 border-t border-white/10">
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider !text-white/64">
            Settings
          </div>
          {settingsItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? "bg-brand-300 text-white"
                    : "text-white/88 hover:bg-white/10"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User controls */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-8 h-8"
              }
            }}
          />
          <span className="text-sm text-white/88">Account</span>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-brand-400 text-white rounded-lg shadow-lg"
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Desktop sidebar */}
      <div className="hidden lg:block w-[272px] flex-shrink-0">{nav}</div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="lg:hidden fixed inset-y-0 left-0 w-[272px] z-40 shadow-xl">
            {nav}
          </div>
        </>
      )}
    </>
  )
}
