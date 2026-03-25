import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('@/lib/sms', () => ({
  sendSms: vi.fn(),
}));

describe('ack-worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process pending ack job and send SMS', async () => {
    const { sendSms } = await import('@/lib/sms');
    const { processAckJobs } = await import('./ack-worker');

    vi.mocked(sendSms).mockResolvedValue({
      success: true,
      messageId: 'sms_123',
    });

    const mockPrisma = {
      jobQueue: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'job_1',
            jobType: 'APPLICATION_ACK_SEND',
            status: 'PENDING',
            attempts: 0,
            payload: { applicationId: 'app_1', candidateId: 'cand_1' },
          },
        ]),
        update: vi.fn(),
      },
      application: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'app_1',
          tenantId: 'org_abc',
          candidate: {
            id: 'cand_1',
            firstName: 'John',
            mobileNumber: '+447700900000',
            preferredChannel: 'SMS',
          },
          job: {
            title: 'Chef',
          },
        }),
      },
      message: {
        create: vi.fn(),
      },
      pipelineEvent: {
        create: vi.fn(),
      },
    };

    const results = await processAckJobs(mockPrisma as any);

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);
    expect(mockPrisma.jobQueue.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job_1' },
        data: expect.objectContaining({ status: 'DONE' }),
      })
    );
  });

  it('should mark job as FAILED after 3 attempts', async () => {
    const { sendSms } = await import('@/lib/sms');
    const { processAckJobs } = await import('./ack-worker');

    vi.mocked(sendSms).mockResolvedValue({
      success: false,
      error: 'Invalid number',
    });

    const mockPrisma = {
      jobQueue: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'job_1',
            attempts: 2,
            payload: { applicationId: 'app_1', candidateId: 'cand_1' },
          },
        ]),
        update: vi.fn(),
      },
      application: {
        findUnique: vi.fn().mockResolvedValue({
          tenantId: 'org_abc',
          candidate: {
            firstName: 'John',
            mobileNumber: '+447700900000',
            preferredChannel: 'SMS',
          },
          job: { title: 'Chef' },
        }),
      },
      message: { create: vi.fn() },
      pipelineEvent: { create: vi.fn() },
    };

    const results = await processAckJobs(mockPrisma as any);

    expect(mockPrisma.jobQueue.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'FAILED' }),
      })
    );
  });
});
