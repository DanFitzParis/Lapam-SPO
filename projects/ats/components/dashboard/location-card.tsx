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
  return (
    <div className="block p-6 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{locationName}</h3>
          <p className="text-sm text-gray-500">{country}</p>
        </div>
        {staleAlert && <StaleAlertBadge />}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-2xl font-bold text-gray-900">{openRolesCount}</p>
          <p className="text-xs text-gray-500">Open Roles</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600">
            {stageCounts.APPLIED + stageCounts.SCREENING + stageCounts.INTERVIEW + stageCounts.OFFER}
          </p>
          <p className="text-xs text-gray-500">Active Candidates</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2 bg-gray-50 rounded">
          <p className="font-semibold text-gray-900">{stageCounts.APPLIED}</p>
          <p className="text-gray-500">Applied</p>
        </div>
        <div className="p-2 bg-blue-50 rounded">
          <p className="font-semibold text-blue-900">{stageCounts.SCREENING}</p>
          <p className="text-blue-600">Screening</p>
        </div>
        <div className="p-2 bg-purple-50 rounded">
          <p className="font-semibold text-purple-900">{stageCounts.INTERVIEW}</p>
          <p className="text-purple-600">Interview</p>
        </div>
        <div className="p-2 bg-green-50 rounded">
          <p className="font-semibold text-green-900">{stageCounts.OFFER}</p>
          <p className="text-green-600">Offer</p>
        </div>
      </div>
    </div>
  )
}
