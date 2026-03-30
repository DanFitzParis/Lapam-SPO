"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MessageCompose } from "@/components/pipeline/message-compose"
import { MessageThread } from "@/components/pipeline/message-thread"
import { InterviewQuestions } from "@/components/pipeline/interview-questions"

interface Application {
  id: string
  stage: string
  source?: string
  availabilityType?: string
  candidate: {
    firstName: string
    lastName: string
    email?: string
    mobileNumber?: string
  }
  job: {
    id: string
    title: string
    locationType?: string
  }
  rightToWorkCheck?: {
    checkType: string
    result: string
  }
  offer?: {
    status: string
    sentAt: string
  }
  interviewSlots?: Array<{
    status: string
    confirmedAt?: string
    proposedAt: string
  }>
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
        const appRes = await fetch(`/api/applications/${applicationId}`)
        if (appRes.ok) {
          const data = await appRes.json()
          setApplication(data)
        }

        const msgRes = await fetch(`/api/applications/${applicationId}/messages`)
        if (msgRes.ok) {
          const data = await msgRes.json()
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

  const rtwCheck = application.rightToWorkCheck
  const offer = application.offer
  const interview = application.interviewSlots?.[0]

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

      <div className="space-y-6">
        {/* RTW Section */}
        {(application.stage === 'INTERVIEW' || application.stage === 'OFFER' || application.stage === 'HIRED') && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Right to Work</h2>
            {rtwCheck ? (
              <div>
                <p className="text-sm">
                  <span className="font-medium">Result:</span>{' '}
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                    rtwCheck.result === 'PASS' ? 'bg-green-100 text-green-800' :
                    rtwCheck.result === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {rtwCheck.result}
                  </span>
                </p>
                <p className="text-sm mt-2">
                  <span className="font-medium">Check Type:</span> {rtwCheck.checkType}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No RTW check completed</p>
            )}
          </div>
        )}

        {/* Offer Section */}
        {(application.stage === 'OFFER' || application.stage === 'HIRED') && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Offer</h2>
            {offer ? (
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Status:</span>{' '}
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                    offer.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                    offer.status === 'SENT' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {offer.status}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Sent:</span> {new Date(offer.sentAt).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No offer sent</p>
            )}
          </div>
        )}

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

        <div>
          <h2 className="text-lg font-semibold mb-3">Interview Prep</h2>
          <InterviewQuestions
            roleTitle={application.job.title}
            locationType={application.job.locationType}
          />
        </div>
      </div>
    </div>
  )
}
