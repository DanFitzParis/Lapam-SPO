"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function RtwVerificationPage({
  params,
}: {
  params: Promise<{ rtwToken: string }>
}) {
  const router = useRouter()
  const [rtwToken, setRtwToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [shareCode, setShareCode] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Unwrap params promise
  useEffect(() => {
    params.then((p) => setRtwToken(p.rtwToken))
    setLoading(false)
  }, [params])

  async function handleIdvt() {
    if (!rtwToken) return
    
    setSubmitting(true)
    // In production, initiate GBG IDVT and redirect
    // Mock: redirect to confirmation
    router.push(`/rtw/${rtwToken}/submitted`)
  }

  async function handleShareCode() {
    if (!rtwToken || !shareCode.trim()) return

    setSubmitting(true)
    // In production, submit share code to GBG
    // Mock: redirect to confirmation
    router.push(`/rtw/${rtwToken}/submitted`)
  }

  if (loading || !rtwToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">
            Right to Work Verification
          </h1>
          <p className="text-gray-600">
            Please verify your right to work in the UK using one of the methods below.
            This should take less than 5 minutes.
          </p>
        </div>

        <div className="space-y-4">
          {/* UK/Irish Passport - IDVT */}
          <button
            onClick={handleIdvt}
            disabled={submitting}
            className="w-full p-6 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">🛂</div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">
                  UK or Irish Passport
                </div>
                <div className="text-sm text-gray-600">
                  Fastest option. Takes 2-3 minutes.
                </div>
              </div>
            </div>
          </button>

          {/* Share Code */}
          <div className="border-2 border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">📋</div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">
                  Share Code
                </div>
                <div className="text-sm text-gray-600">
                  From gov.uk - if you have a valid share code
                </div>
              </div>
            </div>
            <input
              type="text"
              placeholder="Enter your 9-character share code"
              value={shareCode}
              onChange={(e) => setShareCode(e.target.value.toUpperCase())}
              maxLength={9}
              className="w-full px-4 py-2 border border-gray-300 rounded-md mb-3 font-mono"
              disabled={submitting}
            />
            <button
              onClick={handleShareCode}
              disabled={submitting || !shareCode.trim()}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Verify with Share Code"}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Your data is processed securely and in compliance with UK law.</p>
        </div>
      </div>
    </div>
  )
}
