"use client"

import { useEffect, useState } from "react"
import { TalentPoolFilters } from "@/components/talent-pool/talent-pool-filters"
import { TalentPoolTable } from "@/components/talent-pool/talent-pool-table"
import { CampaignModal } from "@/components/talent-pool/campaign-modal"

interface TalentPoolEntry {
  id: string
  candidate: {
    firstName: string
    lastName: string
  }
  originalRole: string
  location: {
    name: string
  } | null
  tag: string
  consent: {
    consentExpiry: string
  } | null
}

export default function TalentPoolPage() {
  const [entries, setEntries] = useState<TalentPoolEntry[]>([])
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showCampaign, setShowCampaign] = useState(false)
  
  const [tagFilter, setTagFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")

  useEffect(() => {
    async function fetchData() {
      try {
        const [entriesRes, locationsRes] = await Promise.all([
          fetch("/api/talent-pool"),
          fetch("/api/locations"),
        ])

        if (entriesRes.ok) {
          const data = await entriesRes.json()
          setEntries(data)
        }

        if (locationsRes.ok) {
          const data = await locationsRes.json()
          setLocations(data)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredEntries = entries.filter((entry) => {
    if (tagFilter !== "all" && entry.tag !== tagFilter) return false
    if (locationFilter !== "all" && entry.location?.name !== locationFilter) return false
    return true
  })

  function toggleSelection(id: string) {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  function toggleAll() {
    if (selectedIds.size === filteredEntries.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredEntries.map((e) => e.id)))
    }
  }

  async function handleSendCampaign(message: string) {
    const res = await fetch("/api/talent-pool/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entryIds: Array.from(selectedIds),
        message,
      }),
    })

    if (!res.ok) throw new Error("Failed to send campaign")

    alert(`Campaign sent to ${selectedIds.size} candidates`)
    setSelectedIds(new Set())
  }

  if (loading) {
    return (
      <div className="p-5 md:p-6 space-y-6">
        <p className="text-gray-500">Loading talent pool...</p>
      </div>
    )
  }

  return (
    <div className="p-5 md:p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Talent Pool</h1>
        
        <TalentPoolFilters
          tagFilter={tagFilter}
          locationFilter={locationFilter}
          locations={locations}
          selectedCount={selectedIds.size}
          onTagFilterChange={setTagFilter}
          onLocationFilterChange={setLocationFilter}
          onSendCampaign={() => setShowCampaign(true)}
        />
      </div>

      <TalentPoolTable
        entries={filteredEntries}
        selectedIds={selectedIds}
        onToggleSelection={toggleSelection}
        onToggleAll={toggleAll}
      />

      {showCampaign && (
        <CampaignModal
          selectedCount={selectedIds.size}
          onClose={() => setShowCampaign(false)}
          onSend={handleSendCampaign}
        />
      )}
    </div>
  )
}
