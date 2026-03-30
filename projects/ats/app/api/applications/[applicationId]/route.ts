import { NextRequest, NextResponse } from 'next/server';
import { getTenantClient } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;
    const prisma = await getTenantClient();

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        stage: true,
        source: true,
        availabilityType: true,
        cvDocumentKey: true,
        createdAt: true,
        updatedAt: true,
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            mobileNumber: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            locationType: true,
            location: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        rightToWorkCheck: {
          select: {
            checkType: true,
            result: true,
            completedAt: true,
          },
        },
        offer: {
          select: {
            id: true,
            acceptanceToken: true,
            letterDocumentKey: true,
            status: true,
            sentAt: true,
            respondedAt: true,
          },
        },
        interviewSlots: {
          select: {
            id: true,
            slotToken: true,
            proposedAt: true,
            confirmedAt: true,
            status: true,
            reminderSentAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error('GET /api/applications/[applicationId] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}
