"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { LocationForm } from "@/components/locations/location-form"
import { LocationsTable } from "@/components/locations/locations-table"

interface Location {
  id: string
  name: string
  country: string
  timezone: string | null
  isActive: boolean
  createdAt: string
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)

  async function loadLocations() {
    try {
      const res = await fetch("/api/locations")
      if (!res.ok) throw new Error("Failed to fetch locations")
      const data = await res.json()
      setLocations(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLocations()
  }, [])

  function handleSuccess() {
    setSheetOpen(false)
    loadLocations()
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Locations</h1>
        <Button onClick={() => setSheetOpen(true)}>Add Location</Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : locations.length === 0 ? (
        <p className="text-gray-500">No locations yet. Create one to get started.</p>
      ) : (
        <LocationsTable locations={locations} />
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetTitle>Add Location</SheetTitle>
          <div className="mt-6">
            <LocationForm
              onSuccess={handleSuccess}
              onCancel={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
