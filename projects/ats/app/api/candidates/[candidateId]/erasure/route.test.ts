import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();
const mockUpdate = vi.fn();
const mockDeleteMany = vi.fn();
const mockCreate = vi.fn();
const mockTransaction = vi.fn();
const mockGetUserRole = vi.fn();
const mockS3Send = vi.fn();

vi.mock('@/lib/auth', () => ({
  getTenantClient: vi.fn(() => ({
    candidate: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
    application: {
      findMany: mockFindMany,
    },
    consentRecord: {
      deleteMany: mockDeleteMany,
    },
    auditLog: {
      create: mockCreate,
    },
    $transaction: mockTransaction,
  })),
  getCurrentUserId: vi.fn(() => Promise.resolve('user_1')),
}));

vi.mock('@/lib/rbac', () => ({
  getUserRole: mockGetUserRole,
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({
    send: mockS3Send,
  })),
  DeleteObjectCommand: vi.fn(),
}));

const { POST } = await import('./route');

describe('/api/candidates/[candidateId]/erasure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 403 for non-group_admin', async () => {
    mockGetUserRole.mockResolvedValue('location_manager');

    const request = new NextRequest('http://localhost/api/candidates/cand_1/erasure', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ candidateId: 'cand_1' }) });

    expect(response.status).toBe(403);
  });

  it('should block erasure within RTW 2-year window', async () => {
    mockGetUserRole.mockResolvedValue('group_admin');

    const now = new Date();
    const recentRtw = new Date(now);
    recentRtw.setMonth(recentRtw.getMonth() - 6); // 6 months ago

    mockFindUnique.mockResolvedValue({
      id: 'cand_1',
      tenantId: 'org_abc',
      applications: [
        {
          rightToWorkCheck: {
            completedAt: recentRtw,
          },
        },
      ],
    });

    const request = new NextRequest('http://localhost/api/candidates/cand_1/erasure', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ candidateId: 'cand_1' }) });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain('RTW retention');
  });

  it('should erase candidate data outside RTW window', async () => {
    mockGetUserRole.mockResolvedValue('group_admin');

    const now = new Date();
    const oldRtw = new Date(now);
    oldRtw.setFullYear(oldRtw.getFullYear() - 3); // 3 years ago

    mockFindUnique.mockResolvedValue({
      id: 'cand_1',
      tenantId: 'org_abc',
      email: 'john@example.com',
      applications: [
        {
          rightToWorkCheck: {
            completedAt: oldRtw,
          },
        },
      ],
    });

    mockFindMany.mockResolvedValue([
      { id: 'app_1', cvDocumentKey: 'cv.pdf' },
    ]);

    mockS3Send.mockResolvedValue({});
    mockTransaction.mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/candidates/cand_1/erasure', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ candidateId: 'cand_1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.erased).toBe(true);
    expect(mockTransaction).toHaveBeenCalled();
  });
});
