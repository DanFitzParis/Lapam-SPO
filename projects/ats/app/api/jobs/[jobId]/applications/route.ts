import { NextRequest, NextResponse } from 'next/server';
import { getTenantClient } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const prisma = await getTenantClient();

    const applications = await prisma.application.findMany({
      where: { jobId },
      select: {
        id: true,
        stage: true,
        availabilityType: true,
        createdAt: true,
        candidate: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        job: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('GET /api/jobs/[jobId]/applications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
