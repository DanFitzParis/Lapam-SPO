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

    // Create RTW request with token
    const rtwRequest = await prisma.rtwRequest.create({
      data: {
        tenantId: application.tenantId,
        applicationId,
      },
      select: {
        id: true,
        rtwToken: true,
        createdAt: true,
      },
    });

    // Generate verification URL
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/rtw/${rtwRequest.rtwToken}`;

    // Send notification to candidate
    const { candidate, job } = application;
    const message = `Hi ${candidate.firstName},

To proceed with your application for ${job.title} at ${job.location.name}, we need to verify your right to work in the UK.

Please complete verification here: ${verificationUrl}

This should take less than 5 minutes.`;

    // Send via preferred channel
    if (candidate.preferredChannel === 'SMS' && candidate.mobileNumber) {
      await sendSms(candidate.mobileNumber, message);
    }

    if (candidate.email) {
      await sendEmail(
        candidate.email,
        'Right to Work Verification Required',
        message
      );
    }

    return NextResponse.json(
      {
        rtwToken: rtwRequest.rtwToken,
        verificationUrl,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/applications/[applicationId]/rtw error:', error);
    return NextResponse.json(
      { error: 'Failed to create RTW request' },
      { status: 500 }
    );
  }
}

// RTW checks are immutable - no PUT/PATCH allowed
export async function PUT() {
  return NextResponse.json(
    { error: 'RTW checks are immutable' },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'RTW checks are immutable' },
    { status: 405 }
  );
}
