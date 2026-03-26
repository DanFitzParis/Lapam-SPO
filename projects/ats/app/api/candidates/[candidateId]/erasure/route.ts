import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createHash } from 'crypto';
import { getTenantClient, getCurrentUserId } from '@/lib/auth';
import { getUserRole } from '@/lib/rbac';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const { candidateId } = await params;
    const prisma = await getTenantClient();
    const userId = await getCurrentUserId();

    // Only group_admin can request erasure
    const userRole = await getUserRole();
    if (userRole !== 'group_admin') {
      return NextResponse.json(
        { error: 'Forbidden - group_admin role required' },
        { status: 403 }
      );
    }

    // Fetch candidate with applications
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        applications: {
          include: {
            rightToWorkCheck: true,
          },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Check RTW 2-year retention window
    const now = new Date();
    const twoYearsAgo = new Date(now);
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const recentRtwCheck = candidate.applications.find(
      (app) =>
        app.rightToWorkCheck &&
        app.rightToWorkCheck.completedAt > twoYearsAgo
    );

    if (recentRtwCheck) {
      return NextResponse.json(
        {
          error: 'RTW retention period not expired',
          message: 'Cannot erase candidate data within 2 years of RTW check completion (UK law)',
        },
        { status: 409 }
      );
    }

    // Generate SHA-256 hash for audit trail
    const candidateRef = createHash('sha256')
      .update(`${candidate.id}:${candidate.email || candidate.mobileNumber}`)
      .digest('hex');

    // Delete application documents from R2
    const applications = await prisma.application.findMany({
      where: { candidateId },
      select: { id: true, cvDocumentKey: true },
    });

    for (const app of applications) {
      if (app.cvDocumentKey) {
        try {
          await r2Client.send(
            new DeleteObjectCommand({
              Bucket: BUCKET_NAME,
              Key: app.cvDocumentKey,
            })
          );
        } catch (r2Error) {
          console.error(`Failed to delete R2 object ${app.cvDocumentKey}:`, r2Error);
          // Continue - don't fail entire erasure
        }
      }
    }

    // Soft-delete candidate PII + delete consent records in transaction
    await prisma.$transaction([
      prisma.candidate.update({
        where: { id: candidateId },
        data: {
          firstName: '[REDACTED]',
          lastName: '[REDACTED]',
          mobileNumber: null,
          email: null,
          deletedAt: now,
        },
      }),
      prisma.consentRecord.deleteMany({
        where: {
          OR: [
            { applicationId: { in: applications.map((a) => a.id) } },
            { candidateId },
          ],
        },
      }),
      prisma.auditLog.create({
        data: {
          tenantId: candidate.tenantId,
          eventType: 'GDPR_ERASURE_REQUESTED',
          actorUserId: userId,
          candidateRef,
          metadata: {
            erasureDate: now.toISOString(),
            reason: 'manual_erasure_request',
          },
        },
      }),
    ]);

    return NextResponse.json({
      erased: true,
      message: 'Candidate data erased successfully',
    });
  } catch (error: any) {
    console.error('POST /api/candidates/[candidateId]/erasure error:', error);
    return NextResponse.json(
      { error: 'Failed to erase candidate data' },
      { status: 500 }
    );
  }
}
