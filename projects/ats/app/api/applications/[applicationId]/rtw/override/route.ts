import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTenantClient, getCurrentUserId } from '@/lib/auth';
import { getUserRole } from '@/lib/rbac';

const overrideSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;
    const body = await request.json();
    const { reason } = overrideSchema.parse(body);

    const prisma = await getTenantClient();
    const userId = await getCurrentUserId();

    // Check role - only group_admin can override
    const userRole = await getUserRole();
    if (userRole !== 'group_admin') {
      return NextResponse.json(
        { error: 'Forbidden - group_admin role required' },
        { status: 403 }
      );
    }

    // Fetch application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            location: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: application.tenantId,
        actorUserId: userId,
        eventType: 'RTW_CHECK_OVERRIDDEN',
        applicationRef: applicationId,
        metadata: {
          reason,
          location: application.job.location.name,
          locationCountry: application.job.location.country,
        },
      },
    });

    return NextResponse.json({
      overridden: true,
      message: 'RTW check requirement overridden by group admin',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('POST /api/applications/[applicationId]/rtw/override error:', error);
    return NextResponse.json(
      { error: 'Failed to override RTW check' },
      { status: 500 }
    );
  }
}
