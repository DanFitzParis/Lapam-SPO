import { PrismaClient, PipelineStage } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';
import { sendEmail } from '@/lib/email';

const STALE_THRESHOLD_DAYS = 5;
const TERMINAL_STAGES: PipelineStage[] = ['HIRED', 'REJECTED', 'WITHDRAWN'];

export async function processStaleAlerts(prisma: PrismaClient) {
  // Calculate date threshold (5 business days ago)
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - STALE_THRESHOLD_DAYS);

  // Find applications with no recent pipeline events and not in terminal stage
  const applications: any[] = await prisma.application.findMany({
    where: {
      stage: {
        notIn: TERMINAL_STAGES,
      },
    },
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
      pipelineEvents: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  });

  const staleApplications = applications.filter((app) => {
    if (app.pipelineEvents.length === 0) {
      return app.createdAt <= thresholdDate;
    }
    const lastEvent = app.pipelineEvents[0];
    return lastEvent.createdAt <= thresholdDate;
  });

  const results = [];

  for (const app of staleApplications) {
    try {
      // Find location managers for this location
      const locationManagers = app.job.location.assignments
        .filter((a: any) => a.role === 'location_manager');

      if (locationManagers.length === 0) {
        results.push({
          applicationId: app.id,
          success: false,
          error: 'No location manager assigned',
        });
        continue;
      }

      // Send email to each location manager
      const clerk = await clerkClient();
      let notifiedCount = 0;

      for (const assignment of locationManagers) {
        // Fetch user from Clerk
        const user = await clerk.users.getUser(assignment.clerkUserId);
        const email = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress;

        if (!email) continue;

        const emailBody = `
Hi,

The application from ${app.candidate.firstName} ${app.candidate.lastName} for the ${app.job.title} role has had no activity for ${STALE_THRESHOLD_DAYS}+ days.

Current stage: ${app.stage}

Please review and take action.

Best regards,
Lapam ATS
        `.trim();

        const result = await sendEmail(
          email,
          `Stale Application Alert: ${app.candidate.firstName} ${app.candidate.lastName}`,
          emailBody
        );

        if (!result.success) {
          throw new Error(`Failed to send alert to ${email}: ${result.error}`);
        }

        notifiedCount++;
      }

      results.push({
        applicationId: app.id,
        success: true,
        managersNotified: notifiedCount,
      });
    } catch (error: any) {
      results.push({
        applicationId: app.id,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    totalChecked: applications.length,
    staleFound: staleApplications.length,
    alertsSent: results.filter((r) => r.success).length,
    results,
  };
}
