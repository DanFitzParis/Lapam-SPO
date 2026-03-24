import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTenantClient } from '@/lib/auth';

const updateJobSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  locationType: z.enum(['RESTAURANT', 'HOTEL', 'BAR', 'EVENTS', 'OTHER']).optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'SEASONAL', 'ZERO_HOURS', 'FLEXIBLE']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const prisma = await getTenantClient();

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        description: true,
        locationId: true,
        locationType: true,
        employmentType: true,
        status: true,
        applyLinkToken: true,
        createdAt: true,
        closedAt: true,
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...job,
      applyUrl: `/apply/${job.applyLinkToken}`,
      applicationCount: job._count.applications,
      _count: undefined,
    });
  } catch (error) {
    console.error('GET /api/jobs/[jobId] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const body = await request.json();
    const validated = updateJobSchema.parse(body);

    const prisma = await getTenantClient();

    // If closing, set closedAt
    const data: any = { ...validated };
    if (validated.status === 'CLOSED') {
      data.closedAt = new Date();
    }

    const job = await prisma.job.update({
      where: { id: jobId },
      data,
      select: {
        id: true,
        title: true,
        description: true,
        locationId: true,
        locationType: true,
        employmentType: true,
        status: true,
        applyLinkToken: true,
        createdAt: true,
        closedAt: true,
        _count: {
          select: { applications: true },
        },
      },
    });

    return NextResponse.json({
      ...job,
      applyUrl: `/apply/${job.applyLinkToken}`,
      applicationCount: job._count.applications,
      _count: undefined,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    console.error('PATCH /api/jobs/[jobId] error:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}
