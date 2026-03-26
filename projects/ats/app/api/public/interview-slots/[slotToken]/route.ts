import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';
import { clerkClient } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slotToken: string }> }
) {
  try {
    const { slotToken } = await params;

    // Find slot and related slots for same application
    const slot = await prisma.interviewSlot.findUnique({
      where: { slotToken },
      include: {
        application: {
          include: {
            candidate: true,
            job: {
              include: {
                location: true,
              },
            },
          },
        },
      },
    });

    if (!slot) {
      return NextResponse.json(
        { error: 'Interview slot not found' },
        { status: 404 }
      );
    }

    // Get all slots for this application
    const allSlots = await prisma.interviewSlot.findMany({
      where: {
        applicationId: slot.applicationId,
        status: { in: ['PROPOSED', 'CONFIRMED'] },
      },
      orderBy: { proposedAt: 'asc' },
      select: {
        id: true,
        slotToken: true,
        proposedAt: true,
        status: true,
      },
    });

    return NextResponse.json({
      slot: {
        id: slot.id,
        status: slot.status,
        proposedAt: slot.proposedAt,
      },
      application: {
        candidate: {
          firstName: slot.application.candidate.firstName,
        },
        job: {
          title: slot.application.job.title,
          location: {
            name: slot.application.job.location.name,
          },
        },
      },
      availableSlots: allSlots,
    });
  } catch (error) {
    console.error('GET /api/public/interview-slots/[slotToken] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slot' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slotToken: string }> }
) {
  try {
    const { slotToken } = await params;

    // Find slot
    const slot = await prisma.interviewSlot.findUnique({
      where: { slotToken },
      include: {
        application: {
          include: {
            candidate: true,
            job: {
              include: {
                location: {
                  include: {
                    assignments: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!slot) {
      return NextResponse.json(
        { error: 'Interview slot not found' },
        { status: 404 }
      );
    }

    // Check if already confirmed
    if (slot.status === 'CONFIRMED') {
      return NextResponse.json(
        { error: 'This slot has already been confirmed' },
        { status: 410 }
      );
    }

    // Check if expired (more than 7 days old)
    const daysSinceProposed = Math.floor(
      (Date.now() - slot.proposedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceProposed > 7) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 410 }
      );
    }

    // Confirm slot and decline others
    await prisma.$transaction([
      prisma.interviewSlot.update({
        where: { id: slot.id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      }),
      prisma.interviewSlot.updateMany({
        where: {
          applicationId: slot.applicationId,
          id: { not: slot.id },
          status: 'PROPOSED',
        },
        data: {
          status: 'DECLINED',
        },
      }),
      prisma.pipelineEvent.create({
        data: {
          tenantId: slot.tenantId,
          applicationId: slot.applicationId,
          eventType: 'INTERVIEW_CONFIRMED',
        },
      }),
    ]);

    // Send confirmation to candidate
    const { candidate, job } = slot.application;
    const confirmationMessage = `Hi ${candidate.firstName},

Your interview for the ${job.title} role at ${job.location.name} is confirmed for:
${new Date(slot.proposedAt).toLocaleString()}

We'll see you then!`;

    if (candidate.preferredChannel === 'SMS' && candidate.mobileNumber) {
      await sendSms(candidate.mobileNumber, confirmationMessage);
    }

    if (candidate.email) {
      await sendEmail(
        candidate.email,
        'Interview Confirmed',
        confirmationMessage
      );
    }

    // Notify location managers
    const clerk = await clerkClient();
    const locationManagers = slot.application.job.location.assignments
      .filter((a: any) => a.role === 'location_manager');

    for (const assignment of locationManagers) {
      const user = await clerk.users.getUser(assignment.clerkUserId);
      const email = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress;

      if (email) {
        await sendEmail(
          email,
          'Interview Confirmed',
          `${candidate.firstName} ${candidate.lastName} has confirmed their interview for ${job.title} on ${new Date(slot.proposedAt).toLocaleString()}.`
        );
      }
    }

    return NextResponse.json({
      confirmed: true,
      proposedAt: slot.proposedAt,
    });
  } catch (error: any) {
    console.error('POST /api/public/interview-slots/[slotToken] error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm slot' },
      { status: 500 }
    );
  }
}
