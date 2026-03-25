import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: vi.fn(),
}));

describe('stale-alert-worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should find stale applications and send alerts', async () => {
    const { sendEmail } = await import('@/lib/email');
    const { clerkClient } = await import('@clerk/nextjs/server');
    const { processStaleAlerts } = await import('./stale-alert-worker');

    vi.mocked(sendEmail).mockResolvedValue({
      success: true,
      messageId: 'email_123',
    });

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

    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

    const mockPrisma = {
      application: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'app_1',
            stage: 'SCREENING',
            createdAt: new Date(),
            candidate: {
              firstName: 'John',
              lastName: 'Doe',
            },
            job: {
              title: 'Chef',
              location: {
                assignments: [
                  {
                    role: 'location_manager',
                    clerkUserId: 'user_clerk_1',
                  },
                ],
              },
            },
            pipelineEvents: [
              {
                createdAt: sixDaysAgo,
              },
            ],
          },
        ]),
      },
    };

    const result = await processStaleAlerts(mockPrisma as any);

    expect(result.staleFound).toBe(1);
    expect(result.alertsSent).toBe(1);
    expect(sendEmail).toHaveBeenCalledWith(
      'manager@example.com',
      expect.stringContaining('Stale Application Alert'),
      expect.stringContaining('John Doe')
    );
  });

  it('should not alert for HIRED applications', async () => {
    const { processStaleAlerts } = await import('./stale-alert-worker');

    const mockPrisma = {
      application: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    const result = await processStaleAlerts(mockPrisma as any);

    expect(result.staleFound).toBe(0);
  });
});
