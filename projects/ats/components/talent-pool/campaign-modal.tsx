"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface CampaignModalProps {
  selectedCount: number
  onClose: () => void
  onSend: (message: string) => Promise<void>
}

export function CampaignModal({
  selectedCount,
  onClose,
  onSend,
}: CampaignModalProps) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!message.trim()) return

    setSending(true)
    try {
      await onSend(message)
      setMessage("")
      onClose()
    } catch (error) {
      alert("Failed to send campaign")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <h2 className="text-xl font-bold mb-4">
          Send Re-engagement Campaign
        </h2>
        
        <p className="text-sm text-gray-600 mb-4">
          Message will be sent to {selectedCount} selected candidates via SMS and email.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Message
          </label>
          <textarea
            className="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Candidate name and job details will be included automatically
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSend} disabled={sending || !message.trim()}>
            {sending ? "Sending..." : "Send Campaign"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
