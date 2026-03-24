import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTenantClient, getCurrentUserId } from '@/lib/auth';

const stageSchema = z.object({
  stage: z.enum(['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN']),
  note: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;
    const body = await request.json();
    const { stage, note } = stageSchema.parse(body);

    const prisma = await getTenantClient();
    const userId = await getCurrentUserId();

    // Fetch current application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        stage: true,
        tenantId: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Update stage and create pipeline event
    const [updatedApplication] = await prisma.$transaction([
      prisma.application.update({
        where: { id: applicationId },
        data: { stage },
        select: {
          id: true,
          stage: true,
          candidate: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.pipelineEvent.create({
        data: {
          tenantId: application.tenantId,
          applicationId,
          eventType: 'STAGE_CHANGED',
          fromStage: application.stage,
          toStage: stage,
          actorUserId: userId,
          note,
        },
      }),
    ]);

    return NextResponse.json(updatedApplication);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    console.error('PATCH /api/applications/[applicationId]/stage error:', error);
    return NextResponse.json(
      { error: 'Failed to update stage' },
      { status: 500 }
    );
  }
}
