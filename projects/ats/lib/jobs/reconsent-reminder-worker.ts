import { PrismaClient } from '@prisma/client';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';

/**
 * Process re-consent reminders for expiring talent pool consents
 * 
 * Queries TALENT_POOL consents expiring within 30 days and sends re-consent reminders.
 */
export async function processReconsentReminders(prisma: PrismaClient) {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // Find talent pool consents expiring within 30 days
  const expiringConsents = await prisma.consentRecord.findMany({
    where: {
      consentType: 'TALENT_POOL',
      consentExpiry: {
        gte: now,
        lte: thirtyDaysFromNow,
      },
      revokedAt: null,
      renewedAt: null,
    },
    include: {
      talentPoolEntry: {
        include: {
          candidate: true,
        },
      },
    },
  });

  const results = [];

  for (const consent of expiringConsents) {
    try {
      if (!consent.talentPoolEntry) {
        // Skip if no talent pool entry
        continue;
      }

      const { candidate } = consent.talentPoolEntry;

      if (candidate.deletedAt) {
        // Skip if candidate already purged
        continue;
      }

      // Generate re-consent URL (placeholder - actual implementation would use slotToken)
      const reconsentUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/talent-pool/reconsent/${consent.talentPoolEntryId}`;

      const message = `Hi ${candidate.firstName},

Your consent to remain in our talent pool is expiring soon (${consent.consentExpiry.toLocaleDateString()}).

To continue receiving job opportunities, please renew your consent here:
${reconsentUrl}

If you don't wish to renew, no action is needed and your data will be removed after expiry.`;

      // Send via preferred channel
      if (candidate.preferredChannel === 'SMS' && candidate.mobileNumber) {
        await sendSms(candidate.mobileNumber, message);
      }

      if (candidate.email) {
        await sendEmail(
          candidate.email,
          'Talent Pool Consent Renewal Required',
          message
        );
      }

      results.push({
        consentId: consent.id,
        candidateId: candidate.id,
        sent: true,
      });
    } catch (error: any) {
      results.push({
        consentId: consent.id,
        candidateId: consent.talentPoolEntry?.candidateId,
        sent: false,
        error: error.message,
      });
    }
  }

  return {
    totalChecked: expiringConsents.length,
    remindersSent: results.filter((r) => r.sent).length,
    failed: results.filter((r) => !r.sent).length,
    results,
  };
}
