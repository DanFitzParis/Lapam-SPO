import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();
const mockCreate = vi.fn();
const mockSendSms = vi.fn();
const mockSendEmail = vi.fn();

vi.mock('@/lib/auth', () => ({
  getTenantClient: vi.fn(() => ({
    application: {
      findUnique: mockFindUnique,
    },
    message: {
      findMany: mockFindMany,
      create: mockCreate,
    },
  })),
  getCurrentUserId: vi.fn(() => Promise.resolve('user_1')),
}));

vi.mock('@/lib/sms', () => ({
  sendSms: mockSendSms,
}));

vi.mock('@/lib/email', () => ({
  sendEmail: mockSendEmail,
}));

const { GET, POST } = await import('./route');

describe('/api/applications/[applicationId]/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return message history', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'msg_1',
        direction: 'OUTBOUND',
        channel: 'SMS',
        body: 'Test message',
        status: 'SENT',
        sentAt: new Date(),
        aiAssisted: true,
        createdAt: new Date(),
      },
    ]);

    const request = new NextRequest('http://localhost/api/applications/app_1/messages');
    const response = await GET(request, { params: Promise.resolve({ applicationId: 'app_1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe('msg_1');
  });

  it('should send SMS and create message record', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'app_1',
      tenantId: 'org_abc',
      candidate: {
        id: 'cand_1',
        firstName: 'John',
        mobileNumber: '+447700900000',
        preferredChannel: 'SMS',
      },
    });

    mockSendSms.mockResolvedValue({
      success: true,
      messageId: 'sms_123',
    });

    mockCreate.mockResolvedValue({
      id: 'msg_1',
      direction: 'OUTBOUND',
      channel: 'SMS',
      body: 'Test message',
      status: 'SENT',
      sentAt: new Date(),
      aiAssisted: false,
      createdAt: new Date(),
    });

    const request = new NextRequest('http://localhost/api/applications/app_1/messages', {
      method: 'POST',
      body: JSON.stringify({
        body: 'Test message',
        aiAssisted: false,
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ applicationId: 'app_1' }) });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe('msg_1');
    expect(mockSendSms).toHaveBeenCalledWith('+447700900000', 'Test message');
  });
});
