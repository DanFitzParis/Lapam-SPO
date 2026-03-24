"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GdprNotice } from "./gdpr-notice"

interface ApplyFormProps {
  applyLinkToken: string
  job: {
    title: string
    description: string
    employmentType: string
  }
}

export function ApplyForm({ applyLinkToken, job }: ApplyFormProps) {
  const router = useRouter()
  const [screen, setScreen] = useState(1)
  const [loading, setLoading] = useState(false)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [mobile, setMobile] = useState("")
  const [email, setEmail] = useState("")
  const [availability, setAvailability] = useState("")
  const [consent, setConsent] = useState(false)
  const [consentError, setConsentError] = useState(false)

  async function handleSubmit() {
    if (!consent) {
      setConsentError(true)
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/public/jobs/${applyLinkToken}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          mobileNumber: mobile,
          email,
          availabilityType: availability,
          consentGiven: consent,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to submit")
      }

      // Success - redirect to confirmation
      router.push(`/apply/${applyLinkToken}/success`)
    } catch (error: any) {
      console.error(error)
      alert(error.message || "Failed to submit application")
    } finally {
      setLoading(false)
    }
  }

  if (screen === 1) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
          <p className="text-gray-600 text-sm mb-1">{job.employmentType.replace('_', ' ')}</p>
          <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
        </div>
        <Button onClick={() => setScreen(2)} className="w-full" size="default">
          Apply Now
        </Button>
      </div>
    )
  }

  if (screen === 2) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Your Details</h2>
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="mobile">Mobile Number *</Label>
          <Input
            id="mobile"
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email (optional)</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setScreen(3)}
            disabled={!firstName || !lastName || !mobile}
            className="flex-1"
          >
            Next
          </Button>
          <Button variant="outline" onClick={() => setScreen(1)}>
            Back
          </Button>
        </div>
      </div>
    )
  }

  if (screen === 3) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Availability</h2>
        <p className="text-sm text-gray-600">What hours can you work?</p>
        <div className="grid gap-3">
          {['FULL_TIME', 'PART_TIME', 'FLEXIBLE'].map((type) => (
            <button
              key={type}
              onClick={() => setAvailability(type)}
              className={`p-4 rounded-lg border-2 text-left transition ${
                availability === type
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">
                {type === 'FULL_TIME' && 'Full Time'}
                {type === 'PART_TIME' && 'Part Time'}
                {type === 'FLEXIBLE' && 'Flexible'}
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setScreen(4)}
            disabled={!availability}
            className="flex-1"
          >
            Next
          </Button>
          <Button variant="outline" onClick={() => setScreen(2)}>
            Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Consent</h2>
      <GdprNotice
        checked={consent}
        onChange={(c) => {
          setConsent(c)
          setConsentError(false)
        }}
        error={consentError}
      />
      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={loading || !consent}
          className="flex-1"
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </Button>
        <Button variant="outline" onClick={() => setScreen(3)} disabled={loading}>
          Back
        </Button>
      </div>
    </div>
  )
}
