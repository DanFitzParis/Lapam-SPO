"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CloseHireSheetProps {
  applicationId: string
  candidateName: string
  jobTitle: string
  onClose: () => void
  onSuccess: () => void
}

export function CloseHireSheet({
  applicationId,
  candidateName,
  jobTitle,
  onClose,
  onSuccess,
}: CloseHireSheetProps) {
  const [tag, setTag] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/applications/${applicationId}/close-hire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag, notes }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to close hire record")
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Close Hire Record</h2>
        
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <p className="text-sm">
            <strong>{candidateName}</strong> will be added to the talent pool.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Role: {jobTitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tag">Talent Pool Tag *</Label>
            <Select value={tag} onValueChange={setTag} required>
              <SelectTrigger id="tag">
                <SelectValue placeholder="Select tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REHIRE_ELIGIBLE">Rehire Eligible</SelectItem>
                <SelectItem value="CONDITIONAL_REHIRE">Conditional Rehire</SelectItem>
                <SelectItem value="DO_NOT_REENGAGE">Do Not Re-engage</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Used for future re-engagement campaigns
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea
              id="notes"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional context for talent pool..."
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !tag}>
              {loading ? "Processing..." : "Add to Talent Pool"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
