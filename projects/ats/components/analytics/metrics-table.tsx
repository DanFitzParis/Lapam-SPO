"use client"

interface LocationMetric {
  locationId: string
  locationName: string
  applications: number
  hired: number
  avgTimeToFill: number
  conversionRate: string
  costPerHire: number
}

interface MetricsTableProps {
  metrics: LocationMetric[]
}

export function MetricsTable({ metrics }: MetricsTableProps) {
  if (metrics.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available for the selected period
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Applications
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hired
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Avg Time to Fill
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Conversion Rate
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cost per Hire
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {metrics.map((metric) => (
            <tr key={metric.locationId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {metric.locationName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {metric.applications}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {metric.hired}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {metric.avgTimeToFill} days
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {metric.conversionRate}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                £{metric.costPerHire.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
