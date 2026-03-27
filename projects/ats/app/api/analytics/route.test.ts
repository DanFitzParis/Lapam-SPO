import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindMany = vi.fn();

vi.mock('@/lib/auth', () => ({
  getTenantClient: vi.fn(() => ({
    application: {
      findMany: mockFindMany,
    },
  })),
  getTenantId: vi.fn(() => Promise.resolve('org_abc')),
  getCurrentUserId: vi.fn(() => Promise.resolve('user_1')),
}));

vi.mock('@/lib/rbac', () => ({
  getUserRole: vi.fn(() => Promise.resolve('recruiter')),
  getUserLocations: vi.fn(() => Promise.resolve([])),
}));

const { GET } = await import('./route');

describe('/api/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return analytics summary and location metrics', async () => {
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 30);

    mockFindMany.mockResolvedValue([
      {
        id: 'app_1',
        stage: 'HIRED',
        source: 'linkedin',
        createdAt: pastDate,
        updatedAt: now,
        job: {
          locationId: 'loc_1',
          location: { name: 'London' },
        },
      },
      {
        id: 'app_2',
        stage: 'SCREENING',
        source: 'direct',
        createdAt: pastDate,
        updatedAt: now,
        job: {
          locationId: 'loc_1',
          location: { name: 'London' },
        },
      },
    ]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary.totalApplications).toBe(2);
    expect(data.summary.avgTimeToFill).toBeGreaterThan(0);
    expect(data.summary.conversionRate).toBe('50.0');
    expect(data.locationMetrics).toHaveLength(1);
    expect(data.locationMetrics[0].locationName).toBe('London');
    expect(data.locationMetrics[0].applications).toBe(2);
    expect(data.locationMetrics[0].hired).toBe(1);
  });

  it('should handle empty data', async () => {
    mockFindMany.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary.totalApplications).toBe(0);
    expect(data.summary.avgTimeToFill).toBe(0);
    expect(data.summary.conversionRate).toBe('0.0');
    expect(data.locationMetrics).toHaveLength(0);
  });
});
