import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/sms', () => ({
  sendSms: vi.fn().mockResolvedValue({ success: true }),
}));

describe('reconsent-reminder-worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send reminders for expiring talent pool consents', async () => {
    const { sendEmail } = await import('@/lib/email');
    const { sendSms } = await import('@/lib/sms');
    const { processReconsentReminders } = await import('./reconsent-reminder-worker');

    const now = new Date();
    const expiringDate = new Date(now);
    expiringDate.setDate(expiringDate.getDate() + 20); // 20 days from now

    const mockPrisma = {
      consentRecord: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'consent_1',
            consentType: 'TALENT_POOL',
            consentExpiry: expiringDate,
            revokedAt: null,
            renewedAt: null,
            talentPoolEntryId: 'tpe_1',
            talentPoolEntry: {
              candidateId: 'cand_1',
              candidate: {
                id: 'cand_1',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                mobileNumber: '+447700900000',
                preferredChannel: 'SMS',
                deletedAt: null,
              },
            },
          },
        ]),
      },
    };

    const result = await processReconsentReminders(mockPrisma as any);

    expect(result.totalChecked).toBe(1);
    expect(result.remindersSent).toBe(1);
    expect(sendSms).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalled();
  });

  it('should skip candidates already purged', async () => {
    const { processReconsentReminders } = await import('./reconsent-reminder-worker');

    const now = new Date();
    const expiringDate = new Date(now);
    expiringDate.setDate(expiringDate.getDate() + 20);

    const mockPrisma = {
      consentRecord: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'consent_1',
            consentType: 'TALENT_POOL',
            consentExpiry: expiringDate,
            talentPoolEntry: {
              candidate: {
                id: 'cand_1',
                deletedAt: new Date(), // Already purged
              },
            },
          },
        ]),
      },
    };

    const result = await processReconsentReminders(mockPrisma as any);

    expect(result.totalChecked).toBe(1);
    expect(result.remindersSent).toBe(0);
  });

  it('should only query consents expiring within 30 days', async () => {
    const { processReconsentReminders } = await import('./reconsent-reminder-worker');

    const mockFindMany = vi.fn().mockResolvedValue([]);
    const mockPrisma = {
      consentRecord: {
        findMany: mockFindMany,
      },
    };

    await processReconsentReminders(mockPrisma as any);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          consentType: 'TALENT_POOL',
          consentExpiry: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
          revokedAt: null,
          renewedAt: null,
        }),
      })
    );
  });
});
