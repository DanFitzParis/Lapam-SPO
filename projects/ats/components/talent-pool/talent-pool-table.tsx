"use client"

import { Checkbox } from "@/components/ui/checkbox"

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

interface TalentPoolTableProps {
  entries: TalentPoolEntry[]
  selectedIds: Set<string>
  onToggleSelection: (id: string) => void
  onToggleAll: () => void
}

export function TalentPoolTable({
  entries,
  selectedIds,
  onToggleSelection,
  onToggleAll,
}: TalentPoolTableProps) {
  const allSelected = selectedIds.size === entries.length && entries.length > 0

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left">
              <Checkbox checked={allSelected} onCheckedChange={onToggleAll} />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Original Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Tag
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Consent Expiry
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <Checkbox
                  checked={selectedIds.has(entry.id)}
                  onCheckedChange={() => onToggleSelection(entry.id)}
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {entry.candidate.firstName} {entry.candidate.lastName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {entry.originalRole}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {entry.location?.name || "—"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    entry.tag === "REHIRE_ELIGIBLE"
                      ? "bg-green-100 text-green-800"
                      : entry.tag === "CONDITIONAL_REHIRE"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {entry.tag.replace(/_/g, " ")}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {entry.consent
                  ? new Date(entry.consent.consentExpiry).toLocaleDateString()
                  : "—"}
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                No entries found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
