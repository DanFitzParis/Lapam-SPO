"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface SlotData {
  slot: {
    id: string
    status: string
    proposedAt: string
  }
  application: {
    candidate: {
      firstName: string
    }
    job: {
      title: string
      location: {
        name: string
      }
    }
  }
  availableSlots: Array<{
    id: string
    slotToken: string
    proposedAt: string
    status: string
  }>
}

export default function InterviewSlotPage({
  params,
}: {
  params: Promise<{ slotToken: string }>
}) {
  const router = useRouter()
  const [slotToken, setSlotToken] = useState<string | null>(null)
  const [data, setData] = useState<SlotData | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Unwrap params promise
  useEffect(() => {
    params.then((p) => setSlotToken(p.slotToken))
  }, [params])

  useEffect(() => {
    if (!slotToken) return

    async function fetchSlot() {
      try {
        const res = await fetch(`/api/public/interview-slots/${slotToken}`)
        if (res.ok) {
          const slotData = await res.json()
          setData(slotData)
        } else {
          setError('Interview invitation not found or expired')
        }
      } catch (error) {
        setError('Failed to load interview details')
      } finally {
        setLoading(false)
      }
    }

    fetchSlot()
  }, [slotToken])

  async function handleConfirm(selectedToken: string) {
    if (!selectedToken) return

    setConfirming(true)
    try {
      const res = await fetch(`/api/public/interview-slots/${selectedToken}`, {
        method: 'POST',
      })

      if (res.ok) {
        router.push(`/interview/${selectedToken}/confirmed`)
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to confirm slot')
      }
    } catch (error) {
      setError('Failed to confirm slot')
    } finally {
      setConfirming(false)
    }
  }

  if (loading || !slotToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Unable to Load</h1>
          <p className="text-gray-600">{error || 'Interview invitation not found'}</p>
        </div>
      </div>
    )
  }

  if (data.slot.status === 'CONFIRMED') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Already Confirmed</h1>
          <p className="text-gray-600">
            You've already confirmed your interview for {new Date(data.slot.proposedAt).toLocaleString()}.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">
            Interview Invitation
          </h1>
          <p className="text-gray-700 mb-1">
            Hi {data.application.candidate.firstName}! 👋
          </p>
          <p className="text-gray-600">
            Select your preferred time for an interview for the{' '}
            <strong>{data.application.job.title}</strong> role at{' '}
            <strong>{data.application.job.location.name}</strong>.
          </p>
        </div>

        <div className="space-y-3">
          {data.availableSlots
            .filter((s) => s.status === 'PROPOSED')
            .map((slot) => (
              <button
                key={slot.id}
                onClick={() => handleConfirm(slot.slotToken)}
                disabled={confirming}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-medium text-gray-900">
                  {new Date(slot.proposedAt).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(slot.proposedAt).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </button>
            ))}
        </div>

        {confirming && (
          <p className="text-center text-gray-500 mt-4">Confirming...</p>
        )}
      </div>
    </div>
  )
}
