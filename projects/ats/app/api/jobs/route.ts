import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTenantClient, getCurrentUserId, getTenantId } from '@/lib/auth';
import { getUserRole, getUserLocations } from '@/lib/rbac';

const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  locationId: z.string(),
  locationType: z.enum(['RESTAURANT', 'HOTEL', 'BAR', 'EVENTS', 'OTHER']).optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'SEASONAL', 'ZERO_HOURS', 'FLEXIBLE']).default('FULL_TIME'),
});

export async function GET(request: NextRequest) {
  try {
    const prisma = await getTenantClient();
    const role = await getUserRole();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const locationId = searchParams.get('locationId');

    let where: any = {};

    if (role === 'location_manager') {
      const userLocations = await getUserLocations();
      where.locationId = { in: userLocations };
    }

    if (status) {
      where.status = status;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    const jobs = await prisma.job.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    const response = jobs.map(job => ({
      ...job,
      applyUrl: `/apply/${job.applyLinkToken}`,
      applicationCount: job._count.applications,
      _count: undefined,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createJobSchema.parse(body);

    const prisma = await getTenantClient();
    const userId = await getCurrentUserId();
    const tenantId = await getTenantId();

    const job = await prisma.job.create({
      data: {
        title: validated.title,
        description: validated.description || '',
        locationType: validated.locationType,
        employmentType: validated.employmentType,
        status: 'DRAFT',
        createdByUserId: userId,
        tenant: {
          connect: { id: tenantId },
        },
        location: {
          connect: { id: validated.locationId },
        },
      },
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
      },
    });

    return NextResponse.json(
      {
        ...job,
        applyUrl: `/apply/${job.applyLinkToken}`,
        applicationCount: 0,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('POST /api/jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}
