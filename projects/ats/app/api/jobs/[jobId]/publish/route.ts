import { NextRequest, NextResponse } from 'next/server';
import { getTenantClient } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';
import { postJobToIndeed } from '@/lib/indeed';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    await requireRole('group_admin');

    const { jobId } = await params;
    const prisma = await getTenantClient();

    // Fetch job with location
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        location: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only DRAFT jobs can be published' },
        { status: 400 }
      );
    }

    // Post to Indeed
    const indeedResponse = await postJobToIndeed({
      title: job.title,
      description: job.description,
      location: {
        country: job.location.country,
      },
      employmentType: job.employmentType,
      applyUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://ats.example.com'}/apply/${job.applyLinkToken}`,
    });

    // Update job status
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'PUBLISHED',
        externalIndeedId: indeedResponse.jobId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        externalIndeedId: true,
      },
    });

    return NextResponse.json({
      ...updatedJob,
      indeedStatus: indeedResponse.status,
    });
  } catch (error: any) {
    if (error.cause?.status === 403) {
      return NextResponse.json(
        { error: 'Forbidden: group_admin role required' },
        { status: 403 }
      );
    }

    console.error('POST /api/jobs/[jobId]/publish error:', error);
    return NextResponse.json(
      { error: 'Failed to publish job' },
      { status: 500 }
    );
  }
}
