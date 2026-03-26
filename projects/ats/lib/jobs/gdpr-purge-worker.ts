import { PrismaClient } from '@prisma/client';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createHash } from 'crypto';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

/**
 * Process GDPR candidate purges
 * 
 * Soft-deletes candidate PII and cascades to application documents.
 * Respects:
 * - 2-year RTW retention window (UK law)
 * - Active application exclusion
 * - Consent record expiry
 */
export async function processGdprPurges(prisma: PrismaClient) {
  const now = new Date();
  const twoYearsAgo = new Date(now);
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  // Find expired consents with candidates eligible for purge
  const expiredConsents = await prisma.consentRecord.findMany({
    where: {
      consentExpiry: {
        lt: now,
      },
      revokedAt: null,
      renewedAt: null,
    },
    include: {
      application: {
        include: {
          candidate: true,
          rightToWorkCheck: true,
        },
      },
      talentPoolEntry: {
        include: {
          candidate: true,
        },
      },
    },
  });

  const results = [];

  for (const consent of expiredConsents) {
    try {
      const candidate = consent.application?.candidate || consent.talentPoolEntry?.candidate;
      
      if (!candidate || candidate.deletedAt) {
        // Already purged
        continue;
      }

      // Check for active applications (not terminal stages)
      const activeApplications = await prisma.application.findMany({
        where: {
          candidateId: candidate.id,
          stage: {
            notIn: ['HIRED', 'REJECTED', 'WITHDRAWN'],
          },
        },
      });

      if (activeApplications.length > 0) {
        // Skip - candidate has active applications
        results.push({
          candidateId: candidate.id,
          skipped: true,
          reason: 'active_applications',
        });
        continue;
      }

      // Check RTW retention window (2 years from completion)
      const rtwCheck = consent.application?.rightToWorkCheck;
      if (rtwCheck && rtwCheck.completedAt > twoYearsAgo) {
        // Skip - RTW retention period not expired
        results.push({
          candidateId: candidate.id,
          skipped: true,
          reason: 'rtw_retention_window',
        });
        continue;
      }

      // Generate SHA-256 hash for audit trail
      const candidateRef = createHash('sha256')
        .update(`${candidate.id}:${candidate.email || candidate.mobileNumber}`)
        .digest('hex');

      // Delete application documents from R2
      const applications = await prisma.application.findMany({
        where: { candidateId: candidate.id },
        select: { id: true, cvDocumentKey: true, tenantId: true },
      });

      for (const app of applications) {
        if (app.cvDocumentKey) {
          try {
            await r2Client.send(new DeleteObjectCommand({
              Bucket: BUCKET_NAME,
              Key: app.cvDocumentKey,
            }));
          } catch (r2Error) {
            console.error(`Failed to delete R2 object ${app.cvDocumentKey}:`, r2Error);
            // Continue - don't fail entire purge
          }
        }
      }

      // Soft-delete candidate PII + delete consent record in transaction
      await prisma.$transaction([
        prisma.candidate.update({
          where: { id: candidate.id },
          data: {
            firstName: '[REDACTED]',
            lastName: '[REDACTED]',
            mobileNumber: null,
            email: null,
            deletedAt: now,
          },
        }),
        prisma.consentRecord.delete({
          where: { id: consent.id },
        }),
        prisma.auditLog.create({
          data: {
            tenantId: candidate.tenantId,
            eventType: 'GDPR_CANDIDATE_DELETED',
            candidateRef,
            metadata: {
              purgeDate: now.toISOString(),
              reason: 'consent_expired',
              consentExpiry: consent.consentExpiry.toISOString(),
            },
          },
        }),
      ]);

      results.push({
        candidateId: candidate.id,
        purged: true,
      });
    } catch (error: any) {
      results.push({
        candidateId: consent.application?.candidateId || consent.talentPoolEntry?.candidateId,
        failed: true,
        error: error.message,
      });
    }
  }

  return {
    totalChecked: expiredConsents.length,
    purged: results.filter((r) => r.purged).length,
    skipped: results.filter((r) => r.skipped).length,
    failed: results.filter((r) => r.failed).length,
    results,
  };
}
