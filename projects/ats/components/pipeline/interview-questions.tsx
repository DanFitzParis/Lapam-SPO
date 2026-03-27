"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface InterviewQuestionsProps {
  roleTitle: string
  locationType?: string
}

export function InterviewQuestions({ roleTitle, locationType }: InterviewQuestionsProps) {
  const [questions, setQuestions] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSuggest() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleTitle, locationType }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate questions')
      }

      const data = await res.json()
      setQuestions(data.questions)
      setSelected(new Set())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function toggleQuestion(index: number) {
    const newSet = new Set(selected)
    if (newSet.has(index)) {
      newSet.delete(index)
    } else {
      newSet.add(index)
    }
    setSelected(newSet)
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">AI Interview Questions</h3>
        <Button
          size="sm"
          onClick={handleSuggest}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Suggest Questions'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {questions.length > 0 && (
        <div className="space-y-2">
          {questions.map((question, index) => (
            <label key={index} className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <Checkbox
                checked={selected.has(index)}
                onCheckedChange={() => toggleQuestion(index)}
              />
              <span className="text-sm flex-1">{question}</span>
            </label>
          ))}
          
          {selected.size > 0 && (
            <p className="text-xs text-gray-500 mt-3">
              {selected.size} question{selected.size > 1 ? 's' : ''} selected
            </p>
          )}
        </div>
      )}

      {questions.length === 0 && !loading && (
        <p className="text-sm text-gray-500">
          Click "Suggest Questions" to generate AI-powered interview questions for this role.
        </p>
      )}
    </div>
  )
}
