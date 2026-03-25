import { PrismaClient } from '@prisma/client';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';
import { ApplicationAcknowledgement } from '@/emails/application-acknowledgement';

const MAX_ATTEMPTS = 3;

export interface AckJobPayload {
  applicationId: string;
  candidateId: string;
}

export async function processAckJobs(prisma: PrismaClient) {
  // Fetch pending APPLICATION_ACK_SEND jobs
  const jobs = await prisma.jobQueue.findMany({
    where: {
      jobType: 'APPLICATION_ACK_SEND',
      status: 'PENDING',
      runAfter: {
        lte: new Date(),
      },
    },
    take: 10, // Process in batches
  });

  const results = [];

  for (const job of jobs) {
    try {
      const payload = job.payload as unknown as AckJobPayload;

      // Fetch application and candidate
      const application = await prisma.application.findUnique({
        where: { id: payload.applicationId },
        include: {
          candidate: true,
          job: true,
        },
      });

      if (!application) {
        throw new Error('Application not found');
      }

      const { candidate, job: jobDetails } = application;

      // Send acknowledgement based on preferred channel
      let messageResult;
      let channel: 'SMS' | 'EMAIL';
      let messageBody: string;

      if (candidate.preferredChannel === 'SMS' && candidate.mobileNumber) {
        messageBody = `Hi ${candidate.firstName}, thank you for applying for the ${jobDetails.title} role. We've received your application and will be in touch soon.`;
        messageResult = await sendSms(candidate.mobileNumber, messageBody);
        channel = 'SMS';
      } else if (candidate.email) {
        messageBody = 'Application acknowledgement email';
        messageResult = await sendEmail(
          candidate.email,
          'Application Received',
          ApplicationAcknowledgement({
            candidateName: candidate.firstName,
            jobTitle: jobDetails.title,
          })
        );
        channel = 'EMAIL';
      } else {
        throw new Error('No contact method available');
      }

      if (!messageResult.success) {
        throw new Error(messageResult.error || 'Message send failed');
      }

      // Create Message record
      await prisma.message.create({
        data: {
          tenantId: application.tenantId,
          applicationId: application.id,
          direction: 'OUTBOUND',
          channel,
          body: messageBody,
          externalId: messageResult.messageId,
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      // Create PipelineEvent
      await prisma.pipelineEvent.create({
        data: {
          tenantId: application.tenantId,
          applicationId: application.id,
          eventType: 'APPLICATION_RECEIVED',
        },
      });

      // Mark job as DONE
      await prisma.jobQueue.update({
        where: { id: job.id },
        data: {
          status: 'DONE',
        },
      });

      results.push({ jobId: job.id, success: true });
    } catch (error: any) {
      const attempts = job.attempts + 1;

      if (attempts >= MAX_ATTEMPTS) {
        // Mark as FAILED
        await prisma.jobQueue.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            attempts,
            lastError: error.message,
          },
        });
      } else {
        // Retry later
        const nextRunAfter = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        await prisma.jobQueue.update({
          where: { id: job.id },
          data: {
            attempts,
            lastError: error.message,
            runAfter: nextRunAfter,
          },
        });
      }

      results.push({ jobId: job.id, success: false, error: error.message });
    }
  }

  return results;
}
