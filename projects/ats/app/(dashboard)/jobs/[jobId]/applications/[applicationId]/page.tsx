"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MessageCompose } from "@/components/pipeline/message-compose"
import { MessageThread } from "@/components/pipeline/message-thread"

interface Application {
  id: string
  stage: string
  candidate: {
    firstName: string
    lastName: string
  }
  job: {
    title: string
  }
}

interface Message {
  id: string
  direction: string
  channel: string
  body: string
  status: string
  sentAt: string | null
  aiAssisted: boolean
  createdAt: string
}

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ jobId: string; applicationId: string }>
}) {
  const router = useRouter()
  const [jobId, setJobId] = useState<string | null>(null)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [application, setApplication] = useState<Application | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  // Unwrap params promise
  useEffect(() => {
    params.then((p) => {
      setJobId(p.jobId)
      setApplicationId(p.applicationId)
    })
  }, [params])

  useEffect(() => {
    if (!applicationId) return

    async function fetchData() {
      try {
        // Fetch application details (would need endpoint)
        // For now, mock minimal data
        setApplication({
          id: applicationId!,
          stage: 'SCREENING',
          candidate: { firstName: 'John', lastName: 'Doe' },
          job: { title: 'Head Chef' },
        })

        // Fetch messages
        const res = await fetch(`/api/applications/${applicationId}/messages`)
        if (res.ok) {
          const data = await res.json()
          setMessages(data)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [applicationId])

  async function handleMessageSent() {
    // Refresh messages
    if (!applicationId) return
    const res = await fetch(`/api/applications/${applicationId}/messages`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data)
    }
  }

  if (loading || !applicationId || !application) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        ← Back to pipeline
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {application.candidate.firstName} {application.candidate.lastName}
        </h1>
        <p className="text-gray-600">{application.job.title}</p>
        <p className="text-sm text-gray-500">Stage: {application.stage}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">Send Message</h2>
          <MessageCompose
            applicationId={applicationId}
            candidateName={application.candidate.firstName}
            jobTitle={application.job.title}
            stage={application.stage}
            onMessageSent={handleMessageSent}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Message History</h2>
          <div className="border border-gray-200 rounded-lg p-4">
            <MessageThread messages={messages} />
          </div>
        </div>
      </div>
    </div>
  )
}
