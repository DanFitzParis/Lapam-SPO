import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockGetUserRole = vi.fn();
const mockSendEmail = vi.fn();
const mockClerkClient = vi.fn();
const mockS3Send = vi.fn();

vi.mock('@/lib/auth', () => ({
  getTenantClient: vi.fn(() => ({
    candidate: {
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

vi.mock('@/lib/email', () => ({
  sendEmail: mockSendEmail,
}));

vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: mockClerkClient,
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({
    send: mockS3Send,
  })),
  PutObjectCommand: vi.fn(),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(() => Promise.resolve('http://r2.example.com/presigned-url')),
}));

const { POST } = await import('./route');

describe('/api/candidates/[candidateId]/dsar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 403 for non-group_admin', async () => {
    mockGetUserRole.mockResolvedValue('location_manager');

    const request = new NextRequest('http://localhost/api/candidates/cand_1/dsar', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ candidateId: 'cand_1' }) });

    expect(response.status).toBe(403);
  });

  it('should export DSAR data to R2 and send email', async () => {
    mockGetUserRole.mockResolvedValue('group_admin');
    
    mockFindUnique.mockResolvedValue({
      id: 'cand_1',
      tenantId: 'org_abc',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      applications: [],
      talentPoolEntries: [],
    });

    mockS3Send.mockResolvedValue({});
    mockSendEmail.mockResolvedValue({ success: true });
    mockClerkClient.mockResolvedValue({
      users: {
        getUser: vi.fn().mockResolvedValue({
          emailAddresses: [
            { id: 'email_1', emailAddress: 'admin@example.com' },
          ],
          primaryEmailAddressId: 'email_1',
        }),
      },
    });

    mockCreate.mockResolvedValue({});

    const request = new NextRequest('http://localhost/api/candidates/cand_1/dsar', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ candidateId: 'cand_1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.exported).toBe(true);
    expect(data.downloadUrl).toContain('presigned-url');
    expect(mockS3Send).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: 'GDPR_DSAR_EXPORTED',
        }),
      })
    );
  });
});
