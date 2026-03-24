import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getTenantId: vi.fn(),
}));

vi.mock('@/lib/r2', () => ({
  generatePresignedUploadUrl: vi.fn(),
}));

describe('/api/uploads/presign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return presigned URL for authenticated user', async () => {
    const { getTenantId } = await import('@/lib/auth');
    const { generatePresignedUploadUrl } = await import('@/lib/r2');

    vi.mocked(getTenantId).mockResolvedValue('org_abc');
    vi.mocked(generatePresignedUploadUrl).mockResolvedValue({
      uploadUrl: 'https://r2.example.com/presigned?sig=abc',
      objectKey: 'org_abc/app_1/cv/resume.pdf',
      expiresIn: 900,
    });

    const request = new NextRequest('http://localhost/api/uploads/presign', {
      method: 'POST',
      body: JSON.stringify({
        applicationId: 'app_1',
        documentType: 'cv',
        filename: 'resume.pdf',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.uploadUrl).toContain('presigned');
    expect(data.objectKey).toBe('org_abc/app_1/cv/resume.pdf');
    expect(data.expiresIn).toBe(900);
  });

  it('should return 401 for unauthenticated user', async () => {
    const { getTenantId } = await import('@/lib/auth');

    vi.mocked(getTenantId).mockRejectedValue(new Error('No organization found in session'));

    const request = new NextRequest('http://localhost/api/uploads/presign', {
      method: 'POST',
      body: JSON.stringify({
        applicationId: 'app_1',
        documentType: 'cv',
        filename: 'resume.pdf',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });
});
