"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface OfferDetails {
  candidate: {
    firstName: string
    lastName: string
  }
  job: {
    title: string
    location: string
  }
  sentAt: string
  status: string
}

export default function OfferAcceptancePage({
  params,
}: {
  params: Promise<{ acceptanceToken: string }>
}) {
  const router = useRouter()
  const [acceptanceToken, setAcceptanceToken] = useState<string | null>(null)
  const [offer, setOffer] = useState<OfferDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alreadyResponded, setAlreadyResponded] = useState(false)

  // Unwrap params promise
  useEffect(() => {
    params.then((p) => {
      setAcceptanceToken(p.acceptanceToken)
      fetchOffer(p.acceptanceToken)
    })
  }, [params])

  async function fetchOffer(token: string) {
    try {
      const response = await fetch(`/api/public/offers/${token}`)
      
      if (response.status === 410) {
        setAlreadyResponded(true)
        setLoading(false)
        return
      }

      if (!response.ok) {
        setError('Offer not found')
        setLoading(false)
        return
      }

      const data = await response.json()
      setOffer(data)
    } catch (err) {
      setError('Failed to load offer')
    } finally {
      setLoading(false)
    }
  }

  async function handleResponse(action: 'accept' | 'decline') {
    if (!acceptanceToken) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/public/offers/${acceptanceToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (response.status === 409) {
        const data = await response.json()
        setError(data.message || data.error)
        setSubmitting(false)
        return
      }

      if (!response.ok) {
        setError('Failed to submit response')
        setSubmitting(false)
        return
      }

      // Redirect to confirmation
      router.push(`/offer/${acceptanceToken}/confirmed?action=${action}`)
    } catch (err) {
      setError('Failed to submit response')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-500">Loading offer...</p>
      </div>
    )
  }

  if (alreadyResponded) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white rounded-lg shadow p-8">
          <div className="text-5xl mb-4">ℹ️</div>
          <h1 className="text-2xl font-bold mb-2">Already Responded</h1>
          <p className="text-gray-600">
            You have already responded to this offer.
          </p>
        </div>
      </div>
    )
  }

  if (error && !offer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white rounded-lg shadow p-8">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">
            Job Offer
          </h1>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Candidate</p>
              <p className="text-lg font-semibold">
                {offer?.candidate.firstName} {offer?.candidate.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Position</p>
              <p className="text-lg font-semibold">{offer?.job.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="text-lg font-semibold">{offer?.job.location}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Offer Date</p>
              <p className="text-lg">
                {offer?.sentAt ? new Date(offer.sentAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => handleResponse('accept')}
            disabled={submitting}
            className="w-full bg-green-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {submitting ? 'Processing...' : 'Accept Offer'}
          </button>

          <button
            onClick={() => handleResponse('decline')}
            disabled={submitting}
            className="w-full bg-red-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {submitting ? 'Processing...' : 'Decline Offer'}
          </button>
        </div>
      </div>
    </div>
  )
}
