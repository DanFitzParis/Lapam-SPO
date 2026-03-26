import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateMany = vi.fn();
const mockCreate = vi.fn();
const mockTransaction = vi.fn();
const mockSendEmail = vi.fn();
const mockSendSms = vi.fn();
const mockClerkClient = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    interviewSlot: {
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      update: mockUpdate,
      updateMany: mockUpdateMany,
    },
    pipelineEvent: {
      create: mockCreate,
    },
    $transaction: mockTransaction,
  })),
}));

vi.mock('@/lib/email', () => ({
  sendEmail: mockSendEmail,
}));

vi.mock('@/lib/sms', () => ({
  sendSms: mockSendSms,
}));

vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: mockClerkClient,
}));

const { GET, POST } = await import('./route');

describe('/api/public/interview-slots/[slotToken]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return slot details', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'slot_1',
      status: 'PROPOSED',
      proposedAt: new Date('2024-12-01T10:00:00Z'),
      applicationId: 'app_1',
      application: {
        candidate: { firstName: 'John' },
        job: {
          title: 'Chef',
          location: { name: 'London' },
        },
      },
    });

    mockFindMany.mockResolvedValue([
      {
        id: 'slot_1',
        slotToken: 'token_1',
        proposedAt: new Date('2024-12-01T10:00:00Z'),
        status: 'PROPOSED',
      },
    ]);

    const request = new NextRequest('http://localhost/api/public/interview-slots/token_1');
    const response = await GET(request, { params: Promise.resolve({ slotToken: 'token_1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.application.job.title).toBe('Chef');
  });

  it('should confirm slot and decline others', async () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 1); // 1 day ago

    mockFindUnique.mockResolvedValue({
      id: 'slot_1',
      status: 'PROPOSED',
      proposedAt: recentDate,
      tenantId: 'org_abc',
      applicationId: 'app_1',
      application: {
        candidate: {
          firstName: 'John',
          lastName: 'Doe',
          mobileNumber: '+447700900000',
          preferredChannel: 'SMS',
          email: 'john@example.com',
        },
        job: {
          title: 'Chef',
          location: {
            name: 'London',
            assignments: [],
          },
        },
      },
    });

    mockTransaction.mockImplementation(async (operations: any[]) => {
      return operations;
    });

    mockSendSms.mockResolvedValue({ success: true });
    mockSendEmail.mockResolvedValue({ success: true });
    mockClerkClient.mockResolvedValue({
      users: { getUser: vi.fn() },
    });

    const request = new NextRequest('http://localhost/api/public/interview-slots/token_1', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ slotToken: 'token_1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.confirmed).toBe(true);
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('should return 410 if already confirmed', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'slot_1',
      status: 'CONFIRMED',
      proposedAt: new Date(),
    });

    const request = new NextRequest('http://localhost/api/public/interview-slots/token_1', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ slotToken: 'token_1' }) });

    expect(response.status).toBe(410);
  });
});
