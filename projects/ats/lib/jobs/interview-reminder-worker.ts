import { PrismaClient } from '@prisma/client';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';
import { clerkClient } from '@clerk/nextjs/server';

export async function processInterviewReminders(prisma: PrismaClient) {
  // Calculate time window: 23-25 hours from now
  const now = new Date();
  const startWindow = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const endWindow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  // Find CONFIRMED slots in time window without reminder sent
  const slots: any[] = await prisma.interviewSlot.findMany({
    where: {
      status: 'CONFIRMED',
      proposedAt: {
        gte: startWindow,
        lte: endWindow,
      },
      reminderSentAt: null,
    },
    include: {
      application: {
        include: {
          candidate: true,
          job: {
            include: {
              location: {
                include: {
                  assignments: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const results = [];

  for (const slot of slots) {
    try {
      const { candidate, job } = slot.application;

      // Send reminder to candidate
      const candidateMessage = `Hi ${candidate.firstName},

This is a reminder about your interview tomorrow for the ${job.title} role at ${job.location.name}.

Time: ${new Date(slot.proposedAt).toLocaleString()}

We look forward to meeting you!`;

      if (candidate.preferredChannel === 'SMS' && candidate.mobileNumber) {
        await sendSms(candidate.mobileNumber, candidateMessage);
      }

      if (candidate.email) {
        await sendEmail(
          candidate.email,
          'Interview Reminder - Tomorrow',
          candidateMessage
        );
      }

      // Notify location managers
      const clerk = await clerkClient();
      const locationManagers = job.location.assignments
        .filter((a: any) => a.role === 'location_manager');

      for (const assignment of locationManagers) {
        const user = await clerk.users.getUser(assignment.clerkUserId);
        const email = user.emailAddresses.find(
          (e) => e.id === user.primaryEmailAddressId
        )?.emailAddress;

        if (email) {
          await sendEmail(
            email,
            'Interview Reminder - Tomorrow',
            `Reminder: Interview with ${candidate.firstName} ${candidate.lastName} for ${job.title} tomorrow at ${new Date(slot.proposedAt).toLocaleString()}.`
          );
        }
      }

      // Mark reminder as sent
      await prisma.interviewSlot.update({
        where: { id: slot.id },
        data: { reminderSentAt: now },
      });

      results.push({
        slotId: slot.id,
        success: true,
      });
    } catch (error: any) {
      results.push({
        slotId: slot.id,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    totalChecked: slots.length,
    remindersSent: results.filter((r) => r.success).length,
    results,
  };
}
