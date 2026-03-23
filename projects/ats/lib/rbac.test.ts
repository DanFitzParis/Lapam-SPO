import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireRole, getUserLocations } from './rbac';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock Prisma client
vi.mock('./prisma', () => ({
  createTenantClient: vi.fn(() => ({
    locationAssignment: {
      findMany: vi.fn(),
    },
  })),
}));

describe('rbac', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requireRole', () => {
    it('should allow group_admin to access any role', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        orgId: 'org_abc',
        sessionClaims: { metadata: { role: 'group_admin' } },
      } as any);

      await expect(requireRole('location_manager')).resolves.toBeUndefined();
    });

    it('should allow location_manager to access location_manager role', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        orgId: 'org_abc',
        sessionClaims: { metadata: { role: 'location_manager' } },
      } as any);

      await expect(requireRole('location_manager')).resolves.toBeUndefined();
    });

    it('should reject location_manager trying to access group_admin', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        orgId: 'org_abc',
        sessionClaims: { metadata: { role: 'location_manager' } },
      } as any);

      await expect(requireRole('group_admin')).rejects.toThrow('Forbidden');
    });

    it('should reject unauthenticated users', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({
        userId: null,
        orgId: null,
      } as any);

      await expect(requireRole('group_admin')).rejects.toThrow('Unauthorized');
    });
  });

  describe('getUserLocations', () => {
    it('should return location IDs for location_manager', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      const { createTenantClient } = await import('./prisma');

      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        orgId: 'org_abc',
      } as any);

      const mockPrisma = {
        locationAssignment: {
          findMany: vi.fn().mockResolvedValue([
            { locationId: 'loc_1' },
            { locationId: 'loc_2' },
          ]),
        },
      };

      vi.mocked(createTenantClient).mockReturnValue(mockPrisma as any);

      const locations = await getUserLocations();
      expect(locations).toEqual(['loc_1', 'loc_2']);
    });
  });
});
