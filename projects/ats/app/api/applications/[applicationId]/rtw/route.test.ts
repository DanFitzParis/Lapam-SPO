import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockSendEmail = vi.fn();
const mockSendSms = vi.fn();

vi.mock('@/lib/auth', () => ({
  getTenantClient: vi.fn(() => ({
    application: {
      findUnique: mockFindUnique,
    },
    rtwRequest: {
      create: mockCreate,
    },
  })),
}));

vi.mock('@/lib/email', () => ({
  sendEmail: mockSendEmail,
}));

vi.mock('@/lib/sms', () => ({
  sendSms: mockSendSms,
}));

const { POST, PUT } = await import('./route');

describe('/api/applications/[applicationId]/rtw', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create RTW request and send notifications', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'app_1',
      tenantId: 'org_abc',
      candidate: {
        firstName: 'John',
        mobileNumber: '+447700900000',
        email: 'john@example.com',
        preferredChannel: 'SMS',
      },
      job: {
        title: 'Chef',
        location: { name: 'London' },
      },
    });

    mockCreate.mockResolvedValue({
      id: 'rtw_1',
      rtwToken: 'token_abc',
      createdAt: new Date(),
    });

    mockSendSms.mockResolvedValue({ success: true });
    mockSendEmail.mockResolvedValue({ success: true });

    const request = new NextRequest('http://localhost/api/applications/app_1/rtw', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ applicationId: 'app_1' }) });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.rtwToken).toBe('token_abc');
    expect(data.verificationUrl).toContain('/rtw/token_abc');
    expect(mockSendSms).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it('should return 405 for PUT (immutable)', async () => {
    const response = await PUT();
    expect(response.status).toBe(405);
  });
});
