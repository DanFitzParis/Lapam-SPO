"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface MessageComposeProps {
  applicationId: string
  candidateName: string
  jobTitle: string
  stage: string
  onMessageSent: () => void
}

export function MessageCompose({
  applicationId,
  candidateName,
  jobTitle,
  stage,
  onMessageSent,
}: MessageComposeProps) {
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [aiDrafted, setAiDrafted] = useState(false)
  const [generatingDraft, setGeneratingDraft] = useState(false)

  async function handleAiDraft() {
    setGeneratingDraft(true)
    try {
      const res = await fetch("/api/ai/comms-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName,
          jobTitle,
          stage,
        }),
      })

      if (!res.ok) throw new Error("Failed to generate draft")

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let draftText = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          // Simple parsing - extract text from data stream
          const lines = chunk.split("\n")
          for (const line of lines) {
            if (line.startsWith("0:")) {
              const text = line.substring(3).replace(/^"|"$/g, "")
              draftText += text
              setMessage(draftText)
            }
          }
        }
      }

      setAiDrafted(true)
    } catch (error) {
      console.error("AI draft failed:", error)
      alert("Failed to generate AI draft")
    } finally {
      setGeneratingDraft(false)
    }
  }

  async function handleSend() {
    if (!message.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/applications/${applicationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: message,
          aiAssisted: aiDrafted,
        }),
      })

      if (!res.ok) throw new Error("Failed to send message")

      setMessage("")
      setAiDrafted(false)
      onMessageSent()
    } catch (error) {
      console.error("Send failed:", error)
      alert("Failed to send message")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between">
        <Label htmlFor="message">Send Message</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAiDraft}
          disabled={loading || generatingDraft}
        >
          {generatingDraft ? "Generating..." : "✨ AI Draft"}
        </Button>
      </div>

      <textarea
        id="message"
        className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value)
          if (aiDrafted) setAiDrafted(false)
        }}
        placeholder="Type your message..."
        disabled={loading}
      />

      {aiDrafted && (
        <p className="text-xs text-amber-600">
          ⚠️ AI-generated draft — review before sending
        </p>
      )}

      <Button onClick={handleSend} disabled={loading || !message.trim()}>
        {loading ? "Sending..." : "Send"}
      </Button>
    </div>
  )
}
