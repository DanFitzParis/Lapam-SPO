"use client"

import { useSearchParams } from "next/navigation"

export default function OfferConfirmedPage() {
  const searchParams = useSearchParams()
  const action = searchParams.get('action')

  const isAccepted = action === 'accept'

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white rounded-lg shadow p-8">
        <div className="text-5xl mb-4">{isAccepted ? '🎉' : '👋'}</div>
        <h1 className="text-2xl font-bold mb-2">
          {isAccepted ? 'Offer Accepted!' : 'Offer Declined'}
        </h1>
        <p className="text-gray-600">
          {isAccepted
            ? 'Thank you for accepting our offer. We look forward to working with you!'
            : 'Thank you for your response. We wish you all the best in your career.'}
        </p>
      </div>
    </div>
  )
}
