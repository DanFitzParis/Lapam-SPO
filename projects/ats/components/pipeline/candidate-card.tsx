"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CandidateCardProps {
  applicationId: string
  candidateName: string
  appliedAt: Date
  availabilityType: string
  currentStage: string
  isUkLocation?: boolean
  onStageChange: (applicationId: string, newStage: string) => Promise<void>
}

export function CandidateCard({
  applicationId,
  candidateName,
  appliedAt,
  availabilityType,
  currentStage,
  isUkLocation = false,
  onStageChange,
}: CandidateCardProps) {
  const [selectedStage, setSelectedStage] = useState(currentStage)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const timeSinceApplied = Math.floor(
    (Date.now() - new Date(appliedAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  async function handleStageChange(newStage: string) {
    if (newStage === currentStage) return

    // Confirmation for REJECTED
    if (newStage === 'REJECTED') {
      setSelectedStage(newStage)
      setShowConfirm(true)
      return
    }

    await performStageChange(newStage)
  }

  async function performStageChange(newStage: string) {
    setLoading(true)
    try {
      await onStageChange(applicationId, newStage)
      setShowConfirm(false)
    } catch (error) {
      console.error('Stage change failed:', error)
      setSelectedStage(currentStage) // Revert on error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-gray-900">{candidateName}</h4>
          <p className="text-xs text-gray-500">
            Applied {timeSinceApplied === 0 ? 'today' : `${timeSinceApplied}d ago`}
          </p>
        </div>
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
          {availabilityType.replace('_', ' ')}
        </span>
      </div>

      {currentStage === 'OFFER' && isUkLocation && (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
          ⚠️ RTW check required before hire
        </div>
      )}

      <Select value={selectedStage} onValueChange={handleStageChange} disabled={loading}>
        <SelectTrigger className="w-full text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="APPLIED">Applied</SelectItem>
          <SelectItem value="SCREENING">Screening</SelectItem>
          <SelectItem value="INTERVIEW">Interview</SelectItem>
          <SelectItem value="OFFER">Offer</SelectItem>
          <SelectItem value="HIRED">Hired</SelectItem>
          <SelectItem value="REJECTED">Rejected</SelectItem>
          <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
        </SelectContent>
      </Select>

      {showConfirm && (
        <div className="p-3 bg-red-50 border border-red-200 rounded space-y-2">
          <p className="text-sm text-red-800">
            Are you sure you want to reject this candidate?
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => performStageChange('REJECTED')}
              disabled={loading}
            >
              Confirm Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowConfirm(false)
                setSelectedStage(currentStage)
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
