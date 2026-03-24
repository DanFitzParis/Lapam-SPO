import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getTenantClient: vi.fn(),
}));

vi.mock('@/lib/rbac', () => ({
  requireRole: vi.fn(),
}));

vi.mock('@/lib/indeed', () => ({
  postJobToIndeed: vi.fn(),
}));

describe('/api/jobs/[jobId]/publish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should publish DRAFT job to Indeed and update status', async () => {
    const { getTenantClient } = await import('@/lib/auth');
    const { requireRole } = await import('@/lib/rbac');
    const { postJobToIndeed } = await import('@/lib/indeed');

    vi.mocked(requireRole).mockResolvedValue(undefined);
    vi.mocked(postJobToIndeed).mockResolvedValue({
      jobId: 'indeed_123',
      status: 'active',
    });

    const mockPrisma = {
      job: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'job_1',
          title: 'Chef',
          description: 'Job description',
          status: 'DRAFT',
          employmentType: 'FULL_TIME',
          applyLinkToken: 'token_abc',
          location: { country: 'GB' },
        }),
        update: vi.fn().mockResolvedValue({
          id: 'job_1',
          title: 'Chef',
          status: 'PUBLISHED',
          externalIndeedId: 'indeed_123',
        }),
      },
    };

    vi.mocked(getTenantClient).mockResolvedValue(mockPrisma as any);

    const request = new NextRequest('http://localhost/api/jobs/job_1/publish', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ jobId: 'job_1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('PUBLISHED');
    expect(data.externalIndeedId).toBe('indeed_123');
    expect(mockPrisma.job.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PUBLISHED',
          externalIndeedId: 'indeed_123',
        }),
      })
    );
  });

  it('should return 400 if job is not DRAFT', async () => {
    const { getTenantClient } = await import('@/lib/auth');
    const { requireRole } = await import('@/lib/rbac');

    vi.mocked(requireRole).mockResolvedValue(undefined);

    const mockPrisma = {
      job: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'job_1',
          status: 'PUBLISHED',
        }),
      },
    };

    vi.mocked(getTenantClient).mockResolvedValue(mockPrisma as any);

    const request = new NextRequest('http://localhost/api/jobs/job_1/publish', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ jobId: 'job_1' }) });

    expect(response.status).toBe(400);
  });
});
