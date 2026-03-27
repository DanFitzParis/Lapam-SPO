import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTenantClient } from '@/lib/auth';

const closeHireSchema = z.object({
  tag: z.enum(['REHIRE_ELIGIBLE', 'CONDITIONAL_REHIRE', 'DO_NOT_REENGAGE']),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;
    const body = await request.json();
    const { tag, notes } = closeHireSchema.parse(body);

    const prisma = await getTenantClient();

    // Fetch application with candidate and job
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

    // Verify application is in HIRED stage
    if (application.stage !== 'HIRED') {
      return NextResponse.json(
        { error: 'Application must be in HIRED stage to close' },
        { status: 400 }
      );
    }

    // Check if talent pool entry already exists
    const existingEntry = await prisma.talentPoolEntry.findUnique({
      where: {
        tenantId_candidateId: {
          tenantId: application.tenantId,
          candidateId: application.candidateId,
        },
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Candidate already in talent pool' },
        { status: 409 }
      );
    }

    // Create talent pool entry + consent record in transaction
    const consentExpiry = new Date();
    consentExpiry.setMonth(consentExpiry.getMonth() + 12);

    const result = await prisma.$transaction(async (tx) => {
      // Create talent pool entry
      const talentPoolEntry = await tx.talentPoolEntry.create({
        data: {
          tenantId: application.tenantId,
          candidateId: application.candidateId,
          originalRole: application.job.title,
          locationId: application.job.locationId,
          tag,
          notes,
        },
      });

      // Create TALENT_POOL consent record
      await tx.consentRecord.create({
        data: {
          tenantId: application.tenantId,
          candidateId: application.candidateId,
          consentType: 'TALENT_POOL',
          consentExpiry,
          talentPoolEntryId: talentPoolEntry.id,
        },
      });

      return talentPoolEntry;
    });

    return NextResponse.json({
      talentPoolEntryId: result.id,
      message: 'Candidate added to talent pool',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('POST /api/applications/[applicationId]/close-hire error:', error);
    return NextResponse.json(
      { error: 'Failed to close hire record' },
      { status: 500 }
    );
  }
}
