"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TalentPoolFiltersProps {
  tagFilter: string
  locationFilter: string
  locations: Array<{ id: string; name: string }>
  selectedCount: number
  onTagFilterChange: (value: string) => void
  onLocationFilterChange: (value: string) => void
  onSendCampaign: () => void
}

export function TalentPoolFilters({
  tagFilter,
  locationFilter,
  locations,
  selectedCount,
  onTagFilterChange,
  onLocationFilterChange,
  onSendCampaign,
}: TalentPoolFiltersProps) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div>
        <label className="text-sm text-gray-600 block mb-1">Filter by Tag</label>
        <Select value={tagFilter} onValueChange={onTagFilterChange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            <SelectItem value="REHIRE_ELIGIBLE">Rehire Eligible</SelectItem>
            <SelectItem value="CONDITIONAL_REHIRE">Conditional Rehire</SelectItem>
            <SelectItem value="DO_NOT_REENGAGE">Do Not Re-engage</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Filter by Location</label>
        <Select value={locationFilter} onValueChange={onLocationFilterChange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.name}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCount > 0 && (
        <div className="ml-auto">
          <Button onClick={onSendCampaign}>
            Send Re-engagement ({selectedCount})
          </Button>
        </div>
      )}
    </div>
  )
}
