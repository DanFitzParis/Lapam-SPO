import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({
    send: vi.fn().mockResolvedValue({}),
  })),
  DeleteObjectCommand: vi.fn(),
}));

describe('gdpr-purge-worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should purge expired consent with no active applications', async () => {
    const { processGdprPurges } = await import('./gdpr-purge-worker');

    const now = new Date();
    const expired = new Date(now);
    expired.setMonth(expired.getMonth() - 1);

    const mockPrisma = {
      consentRecord: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'consent_1',
            consentExpiry: expired,
            revokedAt: null,
            renewedAt: null,
            application: {
              candidate: {
                id: 'cand_1',
                tenantId: 'org_abc',
                email: 'john@example.com',
                deletedAt: null,
              },
              rightToWorkCheck: null,
            },
          },
        ]),
        delete: vi.fn(),
      },
      application: {
        findMany: vi.fn()
          .mockResolvedValueOnce([]) // No active applications
          .mockResolvedValueOnce([{ id: 'app_1', cvDocumentKey: 'cv.pdf', tenantId: 'org_abc' }]),
      },
      candidate: {
        update: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      $transaction: vi.fn((operations) => Promise.all(operations)),
    };

    const result = await processGdprPurges(mockPrisma as any);

    expect(result.totalChecked).toBe(1);
    expect(result.purged).toBe(1);
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it('should skip candidate with active applications', async () => {
    const { processGdprPurges } = await import('./gdpr-purge-worker');

    const now = new Date();
    const expired = new Date(now);
    expired.setMonth(expired.getMonth() - 1);

    const mockPrisma = {
      consentRecord: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'consent_1',
            consentExpiry: expired,
            revokedAt: null,
            renewedAt: null,
            application: {
              candidate: {
                id: 'cand_1',
                tenantId: 'org_abc',
                email: 'john@example.com',
                deletedAt: null,
              },
            },
          },
        ]),
      },
      application: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'app_1', stage: 'INTERVIEW' }, // Active
        ]),
      },
      $transaction: vi.fn(),
    };

    const result = await processGdprPurges(mockPrisma as any);

    expect(result.totalChecked).toBe(1);
    expect(result.skipped).toBe(1);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('should skip candidate within RTW 2-year retention window', async () => {
    const { processGdprPurges } = await import('./gdpr-purge-worker');

    const now = new Date();
    const expired = new Date(now);
    expired.setMonth(expired.getMonth() - 1);

    const recentRtw = new Date(now);
    recentRtw.setMonth(recentRtw.getMonth() - 6); // 6 months ago

    const mockPrisma = {
      consentRecord: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'consent_1',
            consentExpiry: expired,
            revokedAt: null,
            renewedAt: null,
            application: {
              candidate: {
                id: 'cand_1',
                tenantId: 'org_abc',
                email: 'john@example.com',
                deletedAt: null,
              },
              rightToWorkCheck: {
                completedAt: recentRtw, // Within 2 years
              },
            },
          },
        ]),
      },
      application: {
        findMany: vi.fn().mockResolvedValue([]), // No active
      },
      $transaction: vi.fn(),
    };

    const result = await processGdprPurges(mockPrisma as any);

    expect(result.totalChecked).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.results[0].reason).toBe('rtw_retention_window');
  });
});
