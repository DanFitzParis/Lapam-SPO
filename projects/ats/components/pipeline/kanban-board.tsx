"use client"

import { Badge } from "@/components/ui/badge"
import { CandidateCard } from "./candidate-card"

interface Application {
  id: string
  stage: string
  availabilityType: string
  createdAt: string
  candidate: {
    firstName: string
    lastName: string
  }
  job: {
    title: string
  }
}

interface KanbanBoardProps {
  jobId: string
  applications: Application[]
  isUkLocation?: boolean
  onStageChange: (applicationId: string, newStage: string) => Promise<void>
}

const STAGES = [
  { key: 'APPLIED', label: 'Applied', bgColor: 'bg-neutral-50' },
  { key: 'SCREENING', label: 'Screening', bgColor: 'bg-brand-100/30' },
  { key: 'INTERVIEW', label: 'Interview', bgColor: 'bg-brand-100/50' },
  { key: 'OFFER', label: 'Offer', bgColor: 'bg-[#ECF4EE]' },
]

export function KanbanBoard({ applications, jobId, isUkLocation = false, onStageChange }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {STAGES.map((stage) => {
        const stageApplications = applications.filter((app) => app.stage === stage.key)

        return (
          <div key={stage.key} className={`rounded-2xl p-4 ${stage.bgColor}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-neutral-500">{stage.label}</h3>
              <Badge variant="neutral">{stageApplications.length}</Badge>
            </div>
            <div className="space-y-3">
              {stageApplications.map((app) => (
                <CandidateCard
                  key={app.id}
                  applicationId={app.id}
                  jobId={jobId}
                  candidateName={`${app.candidate.firstName} ${app.candidate.lastName}`}
                  jobTitle={app.job.title}
                  appliedAt={new Date(app.createdAt)}
                  availabilityType={app.availabilityType}
                  currentStage={app.stage}
                  isUkLocation={isUkLocation}
                  onStageChange={onStageChange}
                />
              ))}
              {stageApplications.length === 0 && (
                <p className="text-sm text-neutral-400 text-center py-4">No candidates</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
