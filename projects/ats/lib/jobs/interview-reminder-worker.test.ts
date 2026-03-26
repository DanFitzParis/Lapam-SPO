import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('@/lib/sms', () => ({
  sendSms: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: vi.fn(),
}));

describe('interview-reminder-worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should find slots in 23-25h window and send reminders', async () => {
    const { sendSms } = await import('@/lib/sms');
    const { sendEmail } = await import('@/lib/email');
    const { clerkClient } = await import('@clerk/nextjs/server');
    const { processInterviewReminders } = await import('./interview-reminder-worker');

    vi.mocked(sendSms).mockResolvedValue({ success: true });
    vi.mocked(sendEmail).mockResolvedValue({ success: true });
    vi.mocked(clerkClient).mockResolvedValue({
      users: {
        getUser: vi.fn().mockResolvedValue({
          emailAddresses: [
            { id: 'email_1', emailAddress: 'manager@example.com' },
          ],
          primaryEmailAddressId: 'email_1',
        }),
      },
    } as any);

    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);

    const mockPrisma = {
      interviewSlot: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'slot_1',
            proposedAt: tomorrow,
            reminderSentAt: null,
            application: {
              candidate: {
                firstName: 'John',
                lastName: 'Doe',
                mobileNumber: '+447700900000',
                email: 'john@example.com',
                preferredChannel: 'SMS',
              },
              job: {
                title: 'Chef',
                location: {
                  name: 'London',
                  assignments: [
                    { role: 'location_manager', clerkUserId: 'user_1' },
                  ],
                },
              },
            },
          },
        ]),
        update: vi.fn(),
      },
    };

    const result = await processInterviewReminders(mockPrisma as any);

    expect(result.totalChecked).toBe(1);
    expect(result.remindersSent).toBe(1);
    expect(sendSms).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledTimes(2); // candidate + manager
    expect(mockPrisma.interviewSlot.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'slot_1' },
        data: expect.objectContaining({ reminderSentAt: expect.any(Date) }),
      })
    );
  });

  it('should not send reminders if reminderSentAt is set', async () => {
    const { processInterviewReminders } = await import('./interview-reminder-worker');

    const mockPrisma = {
      interviewSlot: {
        findMany: vi.fn().mockResolvedValue([]), // No slots (filtered by reminderSentAt: null)
        update: vi.fn(),
      },
    };

    const result = await processInterviewReminders(mockPrisma as any);

    expect(result.totalChecked).toBe(0);
    expect(result.remindersSent).toBe(0);
  });
});
