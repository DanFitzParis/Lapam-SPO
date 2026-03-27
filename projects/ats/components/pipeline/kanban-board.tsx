"use client"

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
  applications: Application[]
  isUkLocation?: boolean
  onStageChange: (applicationId: string, newStage: string) => Promise<void>
}

const STAGES = [
  { key: 'APPLIED', label: 'Applied', color: 'bg-gray-50' },
  { key: 'SCREENING', label: 'Screening', color: 'bg-blue-50' },
  { key: 'INTERVIEW', label: 'Interview', color: 'bg-purple-50' },
  { key: 'OFFER', label: 'Offer', color: 'bg-green-50' },
]

export function KanbanBoard({ applications, isUkLocation = false, onStageChange }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {STAGES.map((stage) => {
        const stageApplications = applications.filter((app) => app.stage === stage.key)

        return (
          <div key={stage.key} className={`rounded-lg p-4 ${stage.color}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{stage.label}</h3>
              <span className="text-sm text-gray-600">{stageApplications.length}</span>
            </div>
            <div className="space-y-3">
              {stageApplications.map((app) => (
                <CandidateCard
                  key={app.id}
                  applicationId={app.id}
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
                <p className="text-sm text-gray-400 text-center py-4">No candidates</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
