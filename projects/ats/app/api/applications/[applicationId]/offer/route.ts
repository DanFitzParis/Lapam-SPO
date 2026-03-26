import { NextRequest, NextResponse } from 'next/server';
import { getTenantClient } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;
    const prisma = await getTenantClient();

    // Fetch application and candidate
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: true,
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

    // Check if offer already exists
    const existingOffer = await prisma.offer.findUnique({
      where: { applicationId },
    });

    if (existingOffer) {
      return NextResponse.json(
        { error: 'Offer already exists for this application' },
        { status: 409 }
      );
    }

    // Create offer
    const offer = await prisma.offer.create({
      data: {
        tenantId: application.tenantId,
        applicationId,
      },
      select: {
        id: true,
        acceptanceToken: true,
        sentAt: true,
        status: true,
      },
    });

    // Generate acceptance URL
    const acceptanceUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/offer/${offer.acceptanceToken}`;

    // Send notification to candidate
    const { candidate, job } = application;
    const message = `Hi ${candidate.firstName},

Congratulations! We're pleased to offer you the ${job.title} position at ${job.location.name}.

Please review and respond to your offer here: ${acceptanceUrl}

We look forward to hearing from you.`;

    // Send via preferred channel
    if (candidate.preferredChannel === 'SMS' && candidate.mobileNumber) {
      await sendSms(candidate.mobileNumber, message);
    }

    if (candidate.email) {
      await sendEmail(
        candidate.email,
        `Job Offer - ${job.title} at ${job.location.name}`,
        message
      );
    }

    return NextResponse.json(
      {
        offerId: offer.id,
        acceptanceToken: offer.acceptanceToken,
        acceptanceUrl,
        status: offer.status,
        sentAt: offer.sentAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/applications/[applicationId]/offer error:', error);
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    );
  }
}
