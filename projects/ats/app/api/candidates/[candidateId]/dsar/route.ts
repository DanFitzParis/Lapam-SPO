import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getTenantClient, getCurrentUserId } from '@/lib/auth';
import { getUserRole } from '@/lib/rbac';
import { sendEmail } from '@/lib/email';
import { clerkClient } from '@clerk/nextjs/server';

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

    // Only group_admin can request DSAR
    const userRole = await getUserRole();
    if (userRole !== 'group_admin') {
      return NextResponse.json(
        { error: 'Forbidden - group_admin role required' },
        { status: 403 }
      );
    }

    // Fetch all candidate data
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        applications: {
          include: {
            job: {
              include: {
                location: true,
              },
            },
            consent: true,
            pipelineEvents: true,
            messages: true,
            screeningResponses: true,
            rightToWorkCheck: true,
            interviewSlots: true,
            offer: true,
          },
        },
        talentPoolEntries: {
          include: {
            consent: true,
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

    // Generate DSAR export JSON
    const dsarData = {
      exportDate: new Date().toISOString(),
      candidate: {
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        mobileNumber: candidate.mobileNumber,
        email: candidate.email,
        preferredChannel: candidate.preferredChannel,
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt,
        deletedAt: candidate.deletedAt,
      },
      applications: candidate.applications.map((app) => ({
        id: app.id,
        job: {
          title: app.job.title,
          location: app.job.location.name,
        },
        stage: app.stage,
        source: app.source,
        createdAt: app.createdAt,
        consent: app.consent
          ? {
              consentType: app.consent.consentType,
              consentDate: app.consent.consentDate,
              consentExpiry: app.consent.consentExpiry,
            }
          : null,
        pipelineEvents: app.pipelineEvents.map((event) => ({
          eventType: event.eventType,
          createdAt: event.createdAt,
        })),
        messages: app.messages.map((msg) => ({
          direction: msg.direction,
          channel: msg.channel,
          sentAt: msg.sentAt,
        })),
        screeningResponses: app.screeningResponses,
        rightToWorkCheck: app.rightToWorkCheck
          ? {
              checkType: app.rightToWorkCheck.checkType,
              result: app.rightToWorkCheck.result,
              completedAt: app.rightToWorkCheck.completedAt,
            }
          : null,
        interviewSlots: app.interviewSlots.map((slot) => ({
          proposedAt: slot.proposedAt,
          confirmedAt: slot.confirmedAt,
          status: slot.status,
        })),
        offer: app.offer
          ? {
              status: app.offer.status,
              sentAt: app.offer.sentAt,
              respondedAt: app.offer.respondedAt,
            }
          : null,
      })),
      talentPoolEntries: candidate.talentPoolEntries.map((entry) => ({
        id: entry.id,
        originalRole: entry.originalRole,
        tag: entry.tag,
        createdAt: entry.createdAt,
        consent: entry.consent
          ? {
              consentType: entry.consent.consentType,
              consentDate: entry.consent.consentDate,
              consentExpiry: entry.consent.consentExpiry,
            }
          : null,
      })),
    };

    // Upload to R2
    const objectKey = `${candidate.tenantId}/dsar/${candidateId}/${Date.now()}.json`;
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
      Body: JSON.stringify(dsarData, null, 2),
      ContentType: 'application/json',
    });

    await r2Client.send(uploadCommand);

    // Generate presigned download URL (24h expiry)
    const downloadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
    });

    const downloadUrl = await getSignedUrl(r2Client, downloadCommand, {
      expiresIn: 24 * 60 * 60, // 24 hours
    });

    // Get group admin email and send notification
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const email = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId
    )?.emailAddress;

    if (email) {
      await sendEmail(
        email,
        'DSAR Export Ready',
        `DSAR export for candidate ${candidate.firstName} ${candidate.lastName} is ready.

Download link (expires in 24 hours):
${downloadUrl}

Candidate ID: ${candidateId}
Export date: ${new Date().toISOString()}`
      );
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: candidate.tenantId,
        eventType: 'GDPR_DSAR_EXPORTED',
        actorUserId: userId,
        candidateRef: candidateId,
        metadata: {
          exportDate: new Date().toISOString(),
          objectKey,
        },
      },
    });

    return NextResponse.json({
      exported: true,
      downloadUrl,
      expiresIn: '24 hours',
    });
  } catch (error: any) {
    console.error('POST /api/candidates/[candidateId]/dsar error:', error);
    return NextResponse.json(
      { error: 'Failed to export DSAR data' },
      { status: 500 }
    );
  }
}
