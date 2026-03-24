"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Location {
  id: string
  name: string
  country: string
  timezone: string | null
  isActive: boolean
  createdAt: string
}

interface LocationsTableProps {
  locations: Location[]
}

export function LocationsTable({ locations }: LocationsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Country</TableHead>
          <TableHead>Timezone</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {locations.map((location) => (
          <TableRow key={location.id}>
            <TableCell className="font-medium">{location.name}</TableCell>
            <TableCell>{location.country}</TableCell>
            <TableCell>{location.timezone || "—"}</TableCell>
            <TableCell>
              {location.isActive ? (
                <span className="text-green-600">Active</span>
              ) : (
                <span className="text-gray-400">Inactive</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
