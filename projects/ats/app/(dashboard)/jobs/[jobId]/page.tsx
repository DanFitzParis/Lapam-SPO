"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { KanbanBoard } from "@/components/pipeline/kanban-board"

interface Job {
  id: string
  title: string
  location: {
    id: string
    name: string
    country: string
  }
}

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

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const router = useRouter()
  const [jobId, setJobId] = useState<string | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  // Unwrap params promise
  useEffect(() => {
    params.then((p) => setJobId(p.jobId))
  }, [params])

  useEffect(() => {
    if (!jobId) return

    async function fetchJob() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`)
        if (res.ok) {
          const data = await res.json()
          setJob(data)
        }
      } catch (error) {
        console.error('Failed to fetch job:', error)
      }
    }

    async function fetchApplications() {
      try {
        const res = await fetch(`/api/jobs/${jobId}/applications`)
        if (res.ok) {
          const data = await res.json()
          setApplications(data)
        }
      } catch (error) {
        console.error('Failed to fetch applications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
    fetchApplications()
  }, [jobId])

  async function handleStageChange(applicationId: string, newStage: string) {
    const res = await fetch(`/api/applications/${applicationId}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    })

    if (!res.ok) throw new Error('Failed to update stage')

    // Optimistic update
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId ? { ...app, stage: newStage } : app
      )
    )
  }

  if (loading || !jobId) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="p-8">
        <p className="text-red-600">Job not found</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-600 hover:text-gray-900 mb-2"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">{job.title}</h1>
        <p className="text-gray-600">
          {job.location?.name ?? 'No location'}{job.location?.country ? `, ${job.location.country}` : ''}
        </p>
      </div>

      <KanbanBoard
        applications={applications}
        isUkLocation={job.location?.country === 'GB'}
        onStageChange={handleStageChange}
      />
    </div>
  )
}
