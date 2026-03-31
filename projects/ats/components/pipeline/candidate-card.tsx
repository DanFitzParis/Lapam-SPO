"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CloseHireSheet } from "./close-hire-sheet"

interface ScreeningResponse {
  question: string
  response: string
  isKnockout: boolean
}

interface CandidateCardProps {
  applicationId: string
  jobId: string
  candidateName: string
  jobTitle: string
  appliedAt: Date
  availabilityType: string
  currentStage: string
  isUkLocation?: boolean
  screeningResponses?: ScreeningResponse[]
  isKnockoutFlagged?: boolean
  onStageChange: (applicationId: string, newStage: string) => Promise<void>
  onCloseHire?: () => void
}

export function CandidateCard({
  applicationId,
  jobId,
  candidateName,
  jobTitle,
  appliedAt,
  availabilityType,
  currentStage,
  isUkLocation = false,
  screeningResponses = [],
  isKnockoutFlagged = false,
  onStageChange,
  onCloseHire,
}: CandidateCardProps) {
  const [selectedStage, setSelectedStage] = useState(currentStage)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showScreening, setShowScreening] = useState(false)
  const [showCloseHire, setShowCloseHire] = useState(false)
  const [loading, setLoading] = useState(false)

  const timeSinceApplied = Math.floor(
    (Date.now() - new Date(appliedAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  async function handleStageChange(newStage: string) {
    if (newStage === currentStage) return

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
      setSelectedStage(currentStage)
    } finally {
      setLoading(false)
    }
  }

  function handleCloseHireSuccess() {
    onCloseHire?.()
  }

  return (
    <div className="bg-white border border-neutral-100 rounded-2xl p-4 space-y-3 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={`/jobs/${jobId}/applications/${applicationId}`}
              className="font-medium text-neutral-500 hover:text-brand-300 underline"
            >
              {candidateName}
            </Link>
            {isKnockoutFlagged && (
              <Badge variant="warning">⚠️ Knockout</Badge>
            )}
          </div>
          <p className="text-xs text-neutral-300 mt-1">
            Applied {timeSinceApplied === 0 ? 'today' : `${timeSinceApplied}d ago`}
          </p>
        </div>
        <Badge variant="neutral">
          {availabilityType?.replace('_', ' ') ?? 'N/A'}
        </Badge>
      </div>

      {screeningResponses.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowScreening(!showScreening)}
            className="text-sm text-brand-300 hover:text-brand-400 underline"
          >
            {showScreening ? 'Hide' : 'Show'} screening responses ({screeningResponses.length})
          </button>
          {showScreening && (
            <div className="mt-2 space-y-2 bg-neutral-50 rounded-lg p-3">
              {screeningResponses.map((sr, idx) => (
                <div key={idx} className="text-sm">
                  <p className="font-medium text-neutral-500 flex items-center gap-1">
                    {sr.question}
                    {sr.isKnockout && (
                      <span className="text-[#B8860B] text-xs">(knockout)</span>
                    )}
                  </p>
                  <p className="text-neutral-400 ml-2">{sr.response}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {currentStage === 'HIRED' && (
        <div className="border-t border-neutral-100 pt-3">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setShowCloseHire(true)}
            className="w-full"
          >
            Close Hire Record
          </Button>
          <p className="text-xs text-neutral-300 mt-1 text-center">
            Add to talent pool for future roles
          </p>
        </div>
      )}

      {currentStage === 'OFFER' && isUkLocation && (
        <div className="text-xs text-[#B8860B] bg-[#FFF3E2] p-2 rounded-lg">
          ⚠️ UK location — right to work check required before HIRED
        </div>
      )}

      {showConfirm ? (
        <div className="space-y-2 border-t border-neutral-100 pt-3">
          <p className="text-sm text-neutral-400">
            Are you sure you want to reject this application?
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => performStageChange(selectedStage)}
              disabled={loading}
            >
              {loading ? 'Rejecting...' : 'Yes, Reject'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setShowConfirm(false)
                setSelectedStage(currentStage)
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Select
          value={selectedStage}
          onValueChange={handleStageChange}
          disabled={loading}
        >
          <SelectTrigger className="w-full">
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
      )}

      {showCloseHire && (
        <CloseHireSheet
          applicationId={applicationId}
          candidateName={candidateName}
          jobTitle={jobTitle}
          onClose={() => setShowCloseHire(false)}
          onSuccess={handleCloseHireSuccess}
        />
      )}
    </div>
  )
}
