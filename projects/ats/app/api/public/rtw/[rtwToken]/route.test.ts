import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFindUnique = vi.fn();
const mockInitiateGbgCheck = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    rtwRequest: {
      findUnique: mockFindUnique,
    },
    rightToWorkCheck: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  })),
}));

vi.mock('@/lib/gbg', () => ({
  initiateGbgCheck: mockInitiateGbgCheck,
}));

const { POST } = await import('./route');

describe('/api/public/rtw/[rtwToken]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initiate IDVT and return redirect URL', async () => {
    mockFindUnique.mockResolvedValue({
      rtwToken: 'token_abc',
      applicationId: 'app_1',
      application: {
        candidate: {
          firstName: 'John',
          lastName: 'Doe',
        },
      },
    });

    mockInitiateGbgCheck.mockResolvedValue({
      checkId: 'gbg_123',
      status: 'pending',
      redirectUrl: 'http://localhost:3000/rtw/mock-idvt?checkId=gbg_123',
    });

    const request = new NextRequest('http://localhost/api/public/rtw/token_abc', {
      method: 'POST',
      body: JSON.stringify({
        method: 'idvt',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ rtwToken: 'token_abc' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.redirectUrl).toContain('mock-idvt');
    expect(data.checkId).toBe('gbg_123');
  });

  it('should submit share code', async () => {
    mockFindUnique.mockResolvedValue({
      rtwToken: 'token_abc',
      applicationId: 'app_1',
      application: {
        candidate: {
          firstName: 'John',
          lastName: 'Doe',
        },
      },
    });

    mockInitiateGbgCheck.mockResolvedValue({
      checkId: 'gbg_456',
      status: 'completed',
      result: 'PASS',
    });

    const request = new NextRequest('http://localhost/api/public/rtw/token_abc', {
      method: 'POST',
      body: JSON.stringify({
        method: 'share_code',
        shareCode: 'ABC123XYZ',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ rtwToken: 'token_abc' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.submitted).toBe(true);
  });
});
