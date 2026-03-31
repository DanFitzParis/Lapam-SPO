"use client"

import { useEffect, useState } from "react"
import { LocationCard } from "@/components/dashboard/location-card"

interface DashboardLocation {
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

export default function DashboardPage() {
  const [locations, setLocations] = useState<DashboardLocation[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchDashboard() {
    try {
      const res = await fetch("/api/dashboard")
      if (res.ok) {
        const data = await res.json()
        setLocations(data)
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
    const interval = setInterval(fetchDashboard, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="p-5 md:p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-brand-300 border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-300">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <div className="p-5 md:p-6 space-y-6">
        <h1 className="text-2xl font-bold text-neutral-500">Dashboard</h1>
        <p className="text-neutral-300 text-center py-12">No locations found.</p>
      </div>
    )
  }

  return (
    <div className="p-5 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-neutral-500">Dashboard</h1>
        <p className="text-sm text-neutral-300">Updates every 10 seconds</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {locations.map((location) => (
          <LocationCard key={location.locationId} {...location} />
        ))}
      </div>
    </div>
  )
}
