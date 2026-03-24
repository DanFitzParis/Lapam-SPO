"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface AiJdButtonProps {
  roleTitle: string
  locationType?: string
  onGenerated: (description: string) => void
  disabled?: boolean
}

export function AiJdButton({ roleTitle, locationType, onGenerated, disabled }: AiJdButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleGenerate() {
    if (!roleTitle.trim()) {
      alert("Please enter a role title first")
      return
    }

    setIsGenerating(true)

    try {
      const res = await fetch("/api/ai/job-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleTitle, locationType }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to generate")
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          accumulated += chunk
          onGenerated(accumulated)
        }
      }
    } catch (error: any) {
      console.error(error)
      alert(error.message || "Failed to generate job description")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      disabled={disabled || isGenerating || !roleTitle.trim()}
    >
      {isGenerating ? "Generating..." : "✨ Generate with AI"}
    </Button>
  )
}
