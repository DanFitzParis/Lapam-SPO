export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = await params

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Job Detail: {jobId}</h1>
      <p className="text-gray-500 mt-2">Full job detail page to be implemented in later phase.</p>
    </div>
  )
}
