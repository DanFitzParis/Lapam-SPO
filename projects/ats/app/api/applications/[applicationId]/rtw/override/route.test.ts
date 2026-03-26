import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockGetUserRole = vi.fn();

vi.mock('@/lib/auth', () => ({
  getTenantClient: vi.fn(() => ({
    application: {
      findUnique: mockFindUnique,
    },
    auditLog: {
      create: mockCreate,
    },
  })),
  getCurrentUserId: vi.fn(() => Promise.resolve('user_1')),
}));

vi.mock('@/lib/rbac', () => ({
  getUserRole: mockGetUserRole,
}));

const { POST } = await import('./route');

describe('/api/applications/[applicationId]/rtw/override', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 403 for non-group_admin', async () => {
    mockGetUserRole.mockResolvedValue('location_manager');

    const request = new NextRequest('http://localhost/api/applications/app_1/rtw/override', {
      method: 'POST',
      body: JSON.stringify({
        reason: 'Manual verification completed offline',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ applicationId: 'app_1' }) });

    expect(response.status).toBe(403);
  });

  it('should create audit log for group_admin override', async () => {
    mockGetUserRole.mockResolvedValue('group_admin');
    
    mockFindUnique.mockResolvedValue({
      id: 'app_1',
      tenantId: 'org_abc',
      job: {
        location: { name: 'London', countryCode: 'GB' },
      },
    });

    mockCreate.mockResolvedValue({
      id: 'audit_1',
      eventType: 'RTW_CHECK_OVERRIDDEN',
    });

    const request = new NextRequest('http://localhost/api/applications/app_1/rtw/override', {
      method: 'POST',
      body: JSON.stringify({
        reason: 'Manual verification completed offline',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ applicationId: 'app_1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.overridden).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: 'RTW_CHECK_OVERRIDDEN',
        }),
      })
    );
  });

  it('should require reason of at least 10 characters', async () => {
    mockGetUserRole.mockResolvedValue('group_admin');

    const request = new NextRequest('http://localhost/api/applications/app_1/rtw/override', {
      method: 'POST',
      body: JSON.stringify({
        reason: 'Short',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ applicationId: 'app_1' }) });

    expect(response.status).toBe(400);
  });
});
