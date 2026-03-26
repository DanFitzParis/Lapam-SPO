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
    interviewSlot: {
      create: mockCreate,
    },
    pipelineEvent: {
      create: vi.fn(),
    },
  })),
}));

vi.mock('@/lib/email', () => ({
  sendEmail: mockSendEmail,
}));

vi.mock('@/lib/sms', () => ({
  sendSms: mockSendSms,
}));

const { POST } = await import('./route');

describe('/api/applications/[applicationId]/interview-slots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create slots and send notifications', async () => {
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

    mockCreate.mockImplementation((args: any) => 
      Promise.resolve({
        id: 'slot_1',
        slotToken: 'token_abc',
        proposedAt: args.data.proposedAt,
        status: 'PROPOSED',
      })
    );

    mockSendSms.mockResolvedValue({ success: true });
    mockSendEmail.mockResolvedValue({ success: true });

    const request = new NextRequest('http://localhost/api/applications/app_1/interview-slots', {
      method: 'POST',
      body: JSON.stringify({
        slots: [
          { proposedAt: '2024-12-01T10:00:00Z' },
          { proposedAt: '2024-12-01T14:00:00Z' },
        ],
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ applicationId: 'app_1' }) });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.slots).toHaveLength(2);
    expect(data.selectionUrl).toContain('/interview/token_abc');
    expect(mockSendSms).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it('should return 400 if more than 3 slots', async () => {
    const request = new NextRequest('http://localhost/api/applications/app_1/interview-slots', {
      method: 'POST',
      body: JSON.stringify({
        slots: [
          { proposedAt: '2024-12-01T10:00:00Z' },
          { proposedAt: '2024-12-01T11:00:00Z' },
          { proposedAt: '2024-12-01T12:00:00Z' },
          { proposedAt: '2024-12-01T13:00:00Z' },
        ],
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ applicationId: 'app_1' }) });

    expect(response.status).toBe(400);
  });
});
