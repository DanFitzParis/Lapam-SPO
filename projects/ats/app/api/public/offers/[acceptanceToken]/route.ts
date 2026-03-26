import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';
import { clerkClient } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

const responseSchema = z.object({
  action: z.enum(['accept', 'decline']),
});

// GET: Fetch offer details for display
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ acceptanceToken: string }> }
) {
  try {
    const { acceptanceToken } = await params;

    const offer = await prisma.offer.findUnique({
      where: { acceptanceToken },
      include: {
        application: {
          include: {
            candidate: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            job: {
              include: {
                location: true,
              },
            },
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    // Check if already responded
    if (offer.status !== 'SENT') {
      return NextResponse.json(
        {
          alreadyResponded: true,
          status: offer.status,
          respondedAt: offer.respondedAt,
        },
        { status: 410 }
      );
    }

    return NextResponse.json({
      candidate: {
        firstName: offer.application.candidate.firstName,
        lastName: offer.application.candidate.lastName,
      },
      job: {
        title: offer.application.job.title,
        location: offer.application.job.location.name,
      },
      sentAt: offer.sentAt,
      status: offer.status,
    });
  } catch (error: any) {
    console.error('GET /api/public/offers/[acceptanceToken] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offer' },
      { status: 500 }
    );
  }
}

// POST: Accept or decline offer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ acceptanceToken: string }> }
) {
  try {
    const { acceptanceToken } = await params;
    const body = await request.json();
    const { action } = responseSchema.parse(body);

    const offer = await prisma.offer.findUnique({
      where: { acceptanceToken },
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

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    // Check if already responded
    if (offer.status !== 'SENT') {
      return NextResponse.json(
        { error: 'Offer already responded to' },
        { status: 410 }
      );
    }

    const now = new Date();
    const newStatus = action === 'accept' ? 'ACCEPTED' : 'DECLINED';
    const newApplicationStage = action === 'accept' ? 'HIRED' : 'REJECTED';

    // Check RTW gate for GB locations on ACCEPT
    if (action === 'accept' && offer.application.job.location.country === 'GB') {
      const rtwCheck = await prisma.rightToWorkCheck.findUnique({
        where: { applicationId: offer.application.id },
      });

      if (!rtwCheck || rtwCheck.result !== 'PASS') {
        return NextResponse.json(
          {
            error: 'Right to work verification required',
            message: 'Cannot accept offer for UK locations without a passing right to work check',
          },
          { status: 409 }
        );
      }
    }

    // Update offer and application stage in transaction
    await prisma.$transaction([
      prisma.offer.update({
        where: { id: offer.id },
        data: {
          status: newStatus,
          respondedAt: now,
        },
      }),
      prisma.application.update({
        where: { id: offer.applicationId },
        data: {
          stage: newApplicationStage,
        },
      }),
      prisma.pipelineEvent.create({
        data: {
          tenantId: offer.tenantId,
          applicationId: offer.applicationId,
          eventType: action === 'accept' ? 'OFFER_ACCEPTED' : 'OFFER_DECLINED',
        },
      }),
    ]);

    // Notify location managers
    const clerk = await clerkClient();
    const locationAssignments = offer.application.job.location.assignments;

    for (const assignment of locationAssignments) {
      const user = await clerk.users.getUser(assignment.clerkUserId);
      const email = user.emailAddresses.find(
        (e) => e.id === user.primaryEmailAddressId
      )?.emailAddress;

      if (email) {
        await sendEmail(
          email,
          `Offer ${action === 'accept' ? 'Accepted' : 'Declined'} - ${offer.application.candidate.firstName} ${offer.application.candidate.lastName}`,
          `${offer.application.candidate.firstName} ${offer.application.candidate.lastName} has ${action === 'accept' ? 'accepted' : 'declined'} the offer for ${offer.application.job.title} at ${offer.application.job.location.name}.`
        );
      }
    }

    return NextResponse.json({
      status: newStatus,
      respondedAt: now,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('POST /api/public/offers/[acceptanceToken] error:', error);
    return NextResponse.json(
      { error: 'Failed to process offer response' },
      { status: 500 }
    );
  }
}
