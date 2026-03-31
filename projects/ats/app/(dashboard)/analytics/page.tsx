"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-brand-300 border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-300">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 md:p-8">
        <div className="bg-[#FCEEEF] border border-[#DA242D]/20 rounded-xl p-4 text-[#DA242D]">
          <p className="font-semibold">Error loading analytics</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-neutral-300 text-center py-12">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="p-5 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-neutral-500">Analytics</h1>
        <Button onClick={exportCSV} variant="secondary">
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-xs font-normal text-neutral-300 uppercase tracking-wider mb-2">
              Total Applications
            </h3>
            <p className="text-3xl font-bold text-brand-300">
              {data.summary.totalApplications}
            </p>
            <p className="text-xs text-neutral-300 mt-1">Last 90 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-xs font-normal text-neutral-300 uppercase tracking-wider mb-2">
              Avg Time to Fill
            </h3>
            <p className="text-3xl font-bold text-neutral-500">
              {data.summary.avgTimeToFill}
            </p>
            <p className="text-xs text-neutral-300 mt-1">days</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-xs font-normal text-neutral-300 uppercase tracking-wider mb-2">
              Conversion Rate
            </h3>
            <p className="text-3xl font-bold text-neutral-500">
              {data.summary.conversionRate}%
            </p>
            <p className="text-xs text-neutral-300 mt-1">applications to hires</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metrics by Location</CardTitle>
        </CardHeader>
        <CardContent>
          <MetricsTable metrics={data.locationMetrics} />
        </CardContent>
      </Card>
    </div>
  )
}
