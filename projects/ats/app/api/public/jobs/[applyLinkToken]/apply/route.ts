import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const applicationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  mobileNumber: z.string().min(1),
  email: z.string().email().optional(),
  availabilityType: z.enum(['FULL_TIME', 'PART_TIME', 'FLEXIBLE']),
  consentGiven: z.boolean(),
  cvDocumentKey: z.string().optional(),
  screeningResponses: z.array(z.object({
    questionId: z.string(),
    response: z.string(),
  })).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ applyLinkToken: string }> }
) {
  try {
    const { applyLinkToken } = await params;
    const body = await request.json();
    const data = applicationSchema.parse(body);

    // Reject if consent not given
    if (!data.consentGiven) {
      return NextResponse.json(
        { error: 'Consent is required to submit an application' },
        { status: 400 }
      );
    }

    // Find job by applyLinkToken
    const job = await prisma.job.findUnique({
      where: { applyLinkToken },
      select: {
        id: true,
        tenantId: true,
        status: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Reject if job is closed
    if (job.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'This job is no longer accepting applications' },
        { status: 410 }
      );
    }

    // Create candidate, application, and consent in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create candidate
      const candidate = await tx.candidate.create({
        data: {
          tenantId: job.tenantId,
          firstName: data.firstName,
          lastName: data.lastName,
          mobileNumber: data.mobileNumber,
          email: data.email,
          preferredChannel: 'SMS',
        },
      });

      // Create application
      const application = await tx.application.create({
        data: {
          tenantId: job.tenantId,
          jobId: job.id,
          candidateId: candidate.id,
          stage: 'APPLIED',
          availabilityType: data.availabilityType,
          cvDocumentKey: data.cvDocumentKey,
          source: 'DIRECT',
        },
      });

      // Create consent record (expires in 12 months)
      const consentExpiry = new Date();
      consentExpiry.setMonth(consentExpiry.getMonth() + 12);

      await tx.consentRecord.create({
        data: {
          tenantId: job.tenantId,
          candidateId: candidate.id,
          consentType: 'APPLICATION',
          consentExpiry,
          applicationId: application.id,
        },
      });

      // Enqueue acknowledgement job
      await tx.jobQueue.create({
        data: {
          tenantId: job.tenantId,
          jobType: 'APPLICATION_ACK_SEND',
          payload: {
            applicationId: application.id,
            candidateId: candidate.id,
          },
          status: 'PENDING',
        },
      });

      return { application, candidate };
    });

    return NextResponse.json(
      {
        applicationId: result.application.id,
        message: 'Application submitted successfully',
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

    console.error('POST /api/public/jobs/[applyLinkToken]/apply error:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
