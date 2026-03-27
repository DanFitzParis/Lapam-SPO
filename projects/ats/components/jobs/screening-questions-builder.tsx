"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export interface ScreeningQuestion {
  id?: string
  question: string
  type: "FREE_TEXT" | "YES_NO" | "SINGLE_CHOICE"
  options: string[]
  isKnockout: boolean
  order: number
}

interface ScreeningQuestionsBuilderProps {
  questions: ScreeningQuestion[]
  onChange: (questions: ScreeningQuestion[]) => void
}

export function ScreeningQuestionsBuilder({
  questions,
  onChange,
}: ScreeningQuestionsBuilderProps) {
  const [newOption, setNewOption] = useState("")

  function addQuestion() {
    if (questions.length >= 5) {
      alert("Maximum 5 screening questions allowed")
      return
    }

    const newQuestion: ScreeningQuestion = {
      question: "",
      type: "FREE_TEXT",
      options: [],
      isKnockout: false,
      order: questions.length,
    }

    onChange([...questions, newQuestion])
  }

  function removeQuestion(index: number) {
    const updated = questions.filter((_, i) => i !== index)
    // Re-order
    const reordered = updated.map((q, i) => ({ ...q, order: i }))
    onChange(reordered)
  }

  function updateQuestion(
    index: number,
    field: keyof ScreeningQuestion,
    value: any
  ) {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  function addOption(index: number) {
    if (!newOption.trim()) return

    const updated = [...questions]
    updated[index] = {
      ...updated[index],
      options: [...updated[index].options, newOption.trim()],
    }
    onChange(updated)
    setNewOption("")
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    const updated = [...questions]
    updated[questionIndex] = {
      ...updated[questionIndex],
      options: updated[questionIndex].options.filter((_, i) => i !== optionIndex),
    }
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Screening Questions (optional, max 5)</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addQuestion}
          disabled={questions.length >= 5}
        >
          Add Question
        </Button>
      </div>

      {questions.length === 0 && (
        <p className="text-sm text-gray-500">
          No screening questions added yet
        </p>
      )}

      {questions.map((question, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <Label>Question {index + 1}</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeQuestion(index)}
            >
              Remove
            </Button>
          </div>

          <Input
            value={question.question}
            onChange={(e) =>
              updateQuestion(index, "question", e.target.value)
            }
            placeholder="e.g. Do you have experience in fine dining?"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`type-${index}`}>Type</Label>
              <Select
                value={question.type}
                onValueChange={(value) =>
                  updateQuestion(index, "type", value)
                }
              >
                <SelectTrigger id={`type-${index}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE_TEXT">Free Text</SelectItem>
                  <SelectItem value="YES_NO">Yes/No</SelectItem>
                  <SelectItem value="SINGLE_CHOICE">Single Choice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={question.isKnockout}
                  onCheckedChange={(checked: boolean) =>
                    updateQuestion(index, "isKnockout", checked)
                  }
                />
                <span className="text-sm">Knockout question</span>
              </label>
            </div>
          </div>

          {question.type === "SINGLE_CHOICE" && (
            <div className="space-y-2">
              <Label>Options</Label>
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center gap-2">
                  <Input value={option} disabled className="flex-1" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(index, optionIndex)}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Add option"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addOption(index)
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addOption(index)}
                >
                  Add
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
