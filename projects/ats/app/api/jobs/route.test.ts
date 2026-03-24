import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getTenantClient: vi.fn(),
  getCurrentUserId: vi.fn(),
  getTenantId: vi.fn(),
}));

vi.mock('@/lib/rbac', () => ({
  getUserRole: vi.fn(),
  getUserLocations: vi.fn(),
}));

describe('/api/jobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return all jobs for group_admin', async () => {
      const { getTenantClient } = await import('@/lib/auth');
      const { getUserRole } = await import('@/lib/rbac');

      vi.mocked(getUserRole).mockResolvedValue('group_admin');

      const mockPrisma = {
        job: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'job_1',
              title: 'Chef',
              locationId: 'loc_1',
              status: 'DRAFT',
              applyLinkToken: 'token_abc',
              _count: { applications: 5 },
            },
          ]),
        },
      };

      vi.mocked(getTenantClient).mockResolvedValue(mockPrisma as any);

      const request = new NextRequest('http://localhost/api/jobs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].applicationCount).toBe(5);
    });

    it('should filter jobs by location for location_manager', async () => {
      const { getTenantClient } = await import('@/lib/auth');
      const { getUserRole, getUserLocations } = await import('@/lib/rbac');

      vi.mocked(getUserRole).mockResolvedValue('location_manager');
      vi.mocked(getUserLocations).mockResolvedValue(['loc_1']);

      const mockPrisma = {
        job: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      };

      vi.mocked(getTenantClient).mockResolvedValue(mockPrisma as any);

      const request = new NextRequest('http://localhost/api/jobs');
      await GET(request);

      expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            locationId: { in: ['loc_1'] },
          }),
        })
      );
    });
  });

  describe('POST', () => {
    it('should create job with DRAFT status and applyLinkToken', async () => {
      const { getTenantClient, getCurrentUserId, getTenantId } = await import('@/lib/auth');

      vi.mocked(getCurrentUserId).mockResolvedValue('user_123');
      vi.mocked(getTenantId).mockResolvedValue('org_abc');

      const mockPrisma = {
        job: {
          create: vi.fn().mockResolvedValue({
            id: 'job_new',
            title: 'Waiter',
            locationId: 'loc_1',
            status: 'DRAFT',
            applyLinkToken: 'token_xyz',
            employmentType: 'FULL_TIME',
            createdAt: new Date(),
            closedAt: null,
          }),
        },
      };

      vi.mocked(getTenantClient).mockResolvedValue(mockPrisma as any);

      const request = new NextRequest('http://localhost/api/jobs', {
        method: 'POST',
        body: JSON.stringify({ title: 'Waiter', locationId: 'loc_1' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.status).toBe('DRAFT');
      expect(data.applyUrl).toBe('/apply/token_xyz');
    });
  });
});
