import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, DELETE } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getTenantClient: vi.fn(),
}));

vi.mock('@/lib/rbac', () => ({
  requireRole: vi.fn(),
}));

describe('/api/locations/[locationId]/assignments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('should create assignment for group_admin', async () => {
      const { getTenantClient } = await import('@/lib/auth');
      const { requireRole } = await import('@/lib/rbac');

      vi.mocked(requireRole).mockResolvedValue(undefined);

      const mockPrisma = {
        locationAssignment: {
          create: vi.fn().mockResolvedValue({ id: 'assignment_1' }),
        },
      };

      vi.mocked(getTenantClient).mockResolvedValue(mockPrisma as any);

      const request = new NextRequest('http://localhost/api/locations/loc_1/assignments', {
        method: 'POST',
        body: JSON.stringify({ clerkUserId: 'user_123' }),
      });

      const response = await POST(request, { params: { locationId: 'loc_1' } });

      expect(response.status).toBe(201);
    });

    it('should return 403 for location_manager', async () => {
      const { requireRole } = await import('@/lib/rbac');

      vi.mocked(requireRole).mockRejectedValue(
        new Error('Forbidden', { cause: { status: 403 } })
      );

      const request = new NextRequest('http://localhost/api/locations/loc_1/assignments', {
        method: 'POST',
        body: JSON.stringify({ clerkUserId: 'user_123' }),
      });

      const response = await POST(request, { params: { locationId: 'loc_1' } });

      expect(response.status).toBe(403);
    });
  });
});
