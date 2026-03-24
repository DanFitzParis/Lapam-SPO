import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getTenantClient: vi.fn(),
  getTenantId: vi.fn(),
}));

vi.mock('@/lib/rbac', () => ({
  requireRole: vi.fn(),
}));

describe('/api/locations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return locations for authenticated tenant', async () => {
      const { getTenantClient } = await import('@/lib/auth');
      
      const mockPrisma = {
        location: {
          findMany: vi.fn().mockResolvedValue([
            { id: 'loc_1', name: 'Bristol', country: 'GB', isActive: true, timezone: 'Europe/London', createdAt: new Date() },
          ]),
        },
      };

      vi.mocked(getTenantClient).mockResolvedValue(mockPrisma as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe('Bristol');
    });
  });

  describe('POST', () => {
    it('should create location for group_admin', async () => {
      const { getTenantClient, getTenantId } = await import('@/lib/auth');
      const { requireRole } = await import('@/lib/rbac');

      vi.mocked(requireRole).mockResolvedValue(undefined);
      vi.mocked(getTenantId).mockResolvedValue('org_abc');

      const mockPrisma = {
        location: {
          create: vi.fn().mockResolvedValue({
            id: 'loc_new',
            name: 'Manchester',
            country: 'GB',
            isActive: true,
            timezone: null,
            createdAt: new Date(),
          }),
        },
      };

      vi.mocked(getTenantClient).mockResolvedValue(mockPrisma as any);

      const request = new NextRequest('http://localhost/api/locations', {
        method: 'POST',
        body: JSON.stringify({ name: 'Manchester', country: 'GB' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe('Manchester');
    });

    it('should return 403 for location_manager', async () => {
      const { requireRole } = await import('@/lib/rbac');

      vi.mocked(requireRole).mockRejectedValue(
        new Error('Forbidden', { cause: { status: 403 } })
      );

      const request = new NextRequest('http://localhost/api/locations', {
        method: 'POST',
        body: JSON.stringify({ name: 'Manchester', country: 'GB' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
    });
  });
});
