import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTenantClient } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';

const MAX_SLOTS = 3;

const proposeSchema = z.object({
  slots: z.array(z.object({
    proposedAt: z.string().datetime(),
  })).min(1).max(MAX_SLOTS),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;
    const body = await request.json();
    const { slots } = proposeSchema.parse(body);

    if (slots.length > MAX_SLOTS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_SLOTS} slots allowed per proposal` },
        { status: 400 }
      );
    }

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

    // Create interview slots
    const createdSlots = await Promise.all(
      slots.map((slot) =>
        prisma.interviewSlot.create({
          data: {
            tenantId: application.tenantId,
            applicationId,
            proposedAt: new Date(slot.proposedAt),
            status: 'PROPOSED',
          },
          select: {
            id: true,
            slotToken: true,
            proposedAt: true,
            status: true,
          },
        })
      )
    );

    // Send notification to candidate with selection URL
    const { candidate, job } = application;
    const selectionUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/interview/${createdSlots[0].slotToken}`;

    const slotsList = createdSlots
      .map((s) => `- ${new Date(s.proposedAt).toLocaleString()}`)
      .join('\n');

    const messageBody = `Hi ${candidate.firstName},

We'd like to invite you for an interview for the ${job.title} role at ${job.location.name}.

Please select your preferred time slot:
${slotsList}

Choose your slot here: ${selectionUrl}

Looking forward to meeting you!`;

    // Send via preferred channel
    if (candidate.preferredChannel === 'SMS' && candidate.mobileNumber) {
      await sendSms(candidate.mobileNumber, messageBody);
    }

    // Always send email if available
    if (candidate.email) {
      await sendEmail(
        candidate.email,
        `Interview Invitation: ${job.title}`,
        messageBody
      );
    }

    // Create PipelineEvent
    await prisma.pipelineEvent.create({
      data: {
        tenantId: application.tenantId,
        applicationId,
        eventType: 'INTERVIEW_SCHEDULED',
      },
    });

    return NextResponse.json(
      {
        slots: createdSlots,
        selectionUrl,
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

    console.error('POST /api/applications/[applicationId]/interview-slots error:', error);
    return NextResponse.json(
      { error: 'Failed to create interview slots' },
      { status: 500 }
    );
  }
}
