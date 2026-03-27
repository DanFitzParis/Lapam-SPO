"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AiJdButton } from "./ai-jd-button"
import { ScreeningQuestionsBuilder, ScreeningQuestion } from "./screening-questions-builder"

interface JobFormProps {
  jobId?: string
  initialData?: {
    title: string
    description: string
    locationId: string
    locationType?: string
    employmentType: string
    screeningQuestions?: ScreeningQuestion[]
  }
}

export function JobForm({ jobId, initialData }: JobFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([])

  const [title, setTitle] = useState(initialData?.title || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [locationId, setLocationId] = useState(initialData?.locationId || "")
  const [locationType, setLocationType] = useState(initialData?.locationType || "")
  const [employmentType, setEmploymentType] = useState(initialData?.employmentType || "FULL_TIME")
  const [screeningQuestions, setScreeningQuestions] = useState<ScreeningQuestion[]>(
    initialData?.screeningQuestions || []
  )
  const [aiDrafted, setAiDrafted] = useState(false)

  useEffect(() => {
    async function loadLocations() {
      const res = await fetch("/api/locations")
      if (res.ok) {
        const data = await res.json()
        setLocations(data)
      }
    }
    loadLocations()
  }, [])

  function handleAiGenerated(generatedDescription: string) {
    setDescription(generatedDescription)
    setAiDrafted(true)
  }

  function handleDescriptionChange(value: string) {
    setDescription(value)
    if (aiDrafted) {
      setAiDrafted(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const url = jobId ? `/api/jobs/${jobId}` : "/api/jobs"
      const method = jobId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          locationId,
          locationType: locationType || undefined,
          employmentType,
          screeningQuestions,
        }),
      })

      if (!res.ok) throw new Error("Failed to save job")

      const job = await res.json()
      router.push(`/jobs/${job.id}`)
    } catch (error) {
      console.error(error)
      alert("Failed to save job")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <Label htmlFor="title">Role Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. Head Chef"
        />
      </div>

      <div>
        <Label htmlFor="locationId">Location *</Label>
        <Select value={locationId} onValueChange={setLocationId} required>
          <SelectTrigger id="locationId">
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="locationType">Location Type</Label>
        <Select value={locationType} onValueChange={setLocationType}>
          <SelectTrigger id="locationType">
            <SelectValue placeholder="Select type (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RESTAURANT">Restaurant</SelectItem>
            <SelectItem value="HOTEL">Hotel</SelectItem>
            <SelectItem value="BAR">Bar</SelectItem>
            <SelectItem value="EVENTS">Events</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="employmentType">Employment Type *</Label>
        <Select value={employmentType} onValueChange={setEmploymentType} required>
          <SelectTrigger id="employmentType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FULL_TIME">Full Time</SelectItem>
            <SelectItem value="PART_TIME">Part Time</SelectItem>
            <SelectItem value="SEASONAL">Seasonal</SelectItem>
            <SelectItem value="ZERO_HOURS">Zero Hours</SelectItem>
            <SelectItem value="FLEXIBLE">Flexible</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="description">Job Description</Label>
          <AiJdButton
            roleTitle={title}
            locationType={locationType}
            onGenerated={handleAiGenerated}
            disabled={loading}
          />
        </div>
        <textarea
          id="description"
          className="flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Enter job description or use AI to generate..."
        />
        {aiDrafted && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ AI-generated draft — review and edit before publishing
          </p>
        )}
      </div>

      <ScreeningQuestionsBuilder
        questions={screeningQuestions}
        onChange={setScreeningQuestions}
      />

      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !title || !locationId}>
          {loading ? "Saving..." : jobId ? "Update Job" : "Create Job"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
