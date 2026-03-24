import { notFound } from "next/navigation"
import { ApplyForm } from "@/components/apply/apply-form"

async function getJob(token: string) {
  // In production this would call an API endpoint
  // For now, mock implementation
  return {
    title: "Head Chef",
    description: "We are looking for an experienced Head Chef to lead our kitchen team.",
    employmentType: "FULL_TIME",
    status: "PUBLISHED",
  }
}

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ applyLinkToken: string }>
}) {
  const { applyLinkToken } = await params

  // TODO: Fetch job by applyLinkToken from database
  const job = await getJob(applyLinkToken)

  if (!job) {
    notFound()
  }

  if (job.status === "CLOSED") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Application Closed</h1>
          <p className="text-gray-600">
            This role is no longer accepting applications. Thank you for your interest.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <ApplyForm applyLinkToken={applyLinkToken} job={job} />
      </div>

      {/* Google for Jobs JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "JobPosting",
            title: job.title,
            description: job.description,
            employmentType: job.employmentType,
            hiringOrganization: {
              "@type": "Organization",
              name: "Lapam ATS",
            },
            jobLocationType: "TELECOMMUTE",
            applicantLocationRequirements: {
              "@type": "Country",
              name: "GB",
            },
          }),
        }}
      />
    </div>
  )
}
