import { JobForm } from "@/components/jobs/job-form"

export default function NewJobPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Create New Job</h1>
      <JobForm />
    </div>
  )
}
