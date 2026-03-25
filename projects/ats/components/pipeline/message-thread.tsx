"use client"

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

interface MessageThreadProps {
  messages: Message[]
}

export function MessageThread({ messages }: MessageThreadProps) {
  if (messages.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        No messages yet
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`p-3 rounded-lg ${
            msg.direction === 'OUTBOUND'
              ? 'bg-blue-50 ml-8'
              : 'bg-gray-50 mr-8'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700">
              {msg.direction === 'OUTBOUND' ? 'You' : 'Candidate'} · {msg.channel}
            </span>
            <span className="text-xs text-gray-500">
              {msg.sentAt ? new Date(msg.sentAt).toLocaleString() : 'Pending'}
            </span>
          </div>
          <p className="text-sm text-gray-900">{msg.body}</p>
          {msg.aiAssisted && (
            <span className="inline-block mt-1 text-xs text-amber-600">
              ✨ AI-assisted
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
