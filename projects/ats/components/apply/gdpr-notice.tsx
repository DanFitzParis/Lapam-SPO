"use client"

import { Label } from "@/components/ui/label"

interface GdprNoticeProps {
  checked: boolean
  onChange: (checked: boolean) => void
  error?: boolean
}

export function GdprNotice({ checked, onChange, error }: GdprNoticeProps) {
  return (
    <div className="space-y-3">
      <div className={`border rounded-lg p-4 ${error ? 'border-red-500' : 'border-gray-200'}`}>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="gdpr-consent"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-gray-300"
          />
          <Label htmlFor="gdpr-consent" className="text-sm leading-relaxed cursor-pointer">
            I consent to my personal data being processed for the purpose of assessing my
            application for this role. I understand my data will be stored for 12 months and
            I can withdraw my consent at any time.
          </Label>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600">
          You must consent to data processing to submit your application.
        </p>
      )}
    </div>
  )
}
