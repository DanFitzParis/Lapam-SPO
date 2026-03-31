import { Badge } from "@/components/ui/badge"
import { StaleAlertBadge } from "./stale-alert-badge"

interface LocationCardProps {
  locationId: string
  locationName: string
  country: string
  openRolesCount: number
  stageCounts: {
    APPLIED: number
    SCREENING: number
    INTERVIEW: number
    OFFER: number
  }
  staleAlert: boolean
}

export function LocationCard({
  locationId,
  locationName,
  country,
  openRolesCount,
  stageCounts,
  staleAlert,
}: LocationCardProps) {
  const totalActive = stageCounts.APPLIED + stageCounts.SCREENING + stageCounts.INTERVIEW + stageCounts.OFFER

  return (
    <div className="block p-6 bg-white border border-neutral-100 rounded-2xl shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-500">{locationName}</h3>
          <p className="text-sm text-neutral-400">{country}</p>
        </div>
        {staleAlert && <StaleAlertBadge />}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-2xl font-bold text-neutral-500">{openRolesCount}</p>
          <p className="text-xs text-neutral-300">Open Roles</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-brand-300">{totalActive}</p>
          <p className="text-xs text-neutral-300">Active Candidates</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className="p-3 bg-neutral-50 rounded-lg">
          <p className="font-semibold text-neutral-500">{stageCounts.APPLIED}</p>
          <p className="text-neutral-400 mt-1">Applied</p>
        </div>
        <div className="p-3 bg-brand-100/50 rounded-lg">
          <p className="font-semibold text-brand-300">{stageCounts.SCREENING}</p>
          <p className="text-brand-300/70 mt-1">Screening</p>
        </div>
        <div className="p-3 bg-brand-100 rounded-lg">
          <p className="font-semibold text-brand-300">{stageCounts.INTERVIEW}</p>
          <p className="text-brand-300/70 mt-1">Interview</p>
        </div>
        <div className="p-3 bg-[#ECF4EE] rounded-lg">
          <p className="font-semibold text-[#278740]">{stageCounts.OFFER}</p>
          <p className="text-[#278740]/70 mt-1">Offer</p>
        </div>
      </div>
    </div>
  )
}
