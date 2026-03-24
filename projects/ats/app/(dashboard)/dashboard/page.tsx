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
    // Initial fetch
    fetchDashboard()

    // Poll every 10 seconds
    const interval = setInterval(fetchDashboard, 10000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p className="text-gray-500">No locations found.</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500">Updates every 10 seconds</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((location) => (
          <LocationCard key={location.locationId} {...location} />
        ))}
      </div>
    </div>
  )
}
