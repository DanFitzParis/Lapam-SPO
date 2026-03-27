"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { MetricsTable } from "@/components/analytics/metrics-table"

interface AnalyticsData {
  summary: {
    totalApplications: number
    avgTimeToFill: number
    conversionRate: string
  }
  sourceVolume: Record<string, number>
  locationMetrics: Array<{
    locationId: string
    locationName: string
    applications: number
    hired: number
    avgTimeToFill: number
    conversionRate: string
    costPerHire: number
  }>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/analytics')
        if (!res.ok) {
          throw new Error('Failed to fetch analytics')
        }
        const analyticsData = await res.json()
        setData(analyticsData)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  function exportCSV() {
    if (!data) return

    const headers = [
      'Location',
      'Applications',
      'Hired',
      'Avg Time to Fill (days)',
      'Conversion Rate (%)',
      'Cost per Hire (£)',
    ]

    const rows = data.locationMetrics.map((metric) => [
      metric.locationName,
      metric.applications,
      metric.hired,
      metric.avgTimeToFill,
      metric.conversionRate,
      metric.costPerHire,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800">
          {error}
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <Button onClick={exportCSV} variant="outline">
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Total Applications
          </h3>
          <p className="text-3xl font-bold text-gray-900">
            {data.summary.totalApplications}
          </p>
          <p className="text-xs text-gray-500 mt-1">Last 90 days</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Avg Time to Fill
          </h3>
          <p className="text-3xl font-bold text-gray-900">
            {data.summary.avgTimeToFill}
          </p>
          <p className="text-xs text-gray-500 mt-1">days</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Conversion Rate
          </h3>
          <p className="text-3xl font-bold text-gray-900">
            {data.summary.conversionRate}%
          </p>
          <p className="text-xs text-gray-500 mt-1">applications to hires</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Metrics by Location</h2>
        </div>
        <div className="p-6">
          <MetricsTable metrics={data.locationMetrics} />
        </div>
      </div>
    </div>
  )
}
