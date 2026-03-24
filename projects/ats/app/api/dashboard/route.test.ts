import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getTenantClient: vi.fn(),
}));

vi.mock('@/lib/rbac', () => ({
  getUserRole: vi.fn(),
  getUserLocations: vi.fn(),
}));

describe('/api/dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return all locations for group_admin', async () => {
    const { getTenantClient } = await import('@/lib/auth');
    const { getUserRole } = await import('@/lib/rbac');

    vi.mocked(getUserRole).mockResolvedValue('group_admin');

    const mockPrisma = {
      location: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'loc_1',
            name: 'London',
            country: 'GB',
            jobs: [
              {
                id: 'job_1',
                createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
                applications: [
                  { stage: 'APPLIED' },
                  { stage: 'SCREENING' },
                ],
              },
            ],
          },
          {
            id: 'loc_2',
            name: 'Paris',
            country: 'FR',
            jobs: [
              {
                id: 'job_2',
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago, no candidates
                applications: [],
              },
            ],
          },
        ]),
      },
    };

    vi.mocked(getTenantClient).mockResolvedValue(mockPrisma as any);

    const request = new NextRequest('http://localhost/api/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].locationName).toBe('London');
    expect(data[0].stageCounts.APPLIED).toBe(1);
    expect(data[0].stageCounts.SCREENING).toBe(1);
    expect(data[0].staleAlert).toBe(false);

    expect(data[1].locationName).toBe('Paris');
    expect(data[1].staleAlert).toBe(true); // 10 days old, 0 candidates
  });

  it('should return only assigned locations for location_manager', async () => {
    const { getTenantClient } = await import('@/lib/auth');
    const { getUserRole, getUserLocations } = await import('@/lib/rbac');

    vi.mocked(getUserRole).mockResolvedValue('location_manager');
    vi.mocked(getUserLocations).mockResolvedValue(['loc_1']);

    const mockPrisma = {
      location: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'loc_1',
            name: 'London',
            country: 'GB',
            jobs: [],
          },
        ]),
      },
    };

    vi.mocked(getTenantClient).mockResolvedValue(mockPrisma as any);

    const request = new NextRequest('http://localhost/api/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].locationName).toBe('London');
    expect(mockPrisma.location.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['loc_1'] } },
      })
    );
  });

  it('should flag stale alert for job open ≥5 days with 0 active candidates', async () => {
    const { getTenantClient } = await import('@/lib/auth');
    const { getUserRole } = await import('@/lib/rbac');

    vi.mocked(getUserRole).mockResolvedValue('group_admin');

    const mockPrisma = {
      location: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'loc_1',
            name: 'Stale Location',
            country: 'GB',
            jobs: [
              {
                id: 'job_stale',
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Exactly 5 days
                applications: [
                  { stage: 'REJECTED' }, // Not an active stage
                ],
              },
            ],
          },
        ]),
      },
    };

    vi.mocked(getTenantClient).mockResolvedValue(mockPrisma as any);

    const request = new NextRequest('http://localhost/api/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(data[0].staleAlert).toBe(true);
  });
});
