import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockCreate = vi.fn();
const mockTransaction = vi.fn();
const mockSendEmail = vi.fn();
const mockClerkClient = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    offer: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
    application: {
      update: mockUpdate,
    },
    pipelineEvent: {
      create: mockCreate,
    },
    rightToWorkCheck: {
      findUnique: vi.fn().mockResolvedValue({ result: 'PASS' }),
    },
    $transaction: mockTransaction,
  })),
}));

vi.mock('@/lib/email', () => ({
  sendEmail: mockSendEmail,
}));

vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: mockClerkClient,
}));

const { GET, POST } = await import('./route');

describe('/api/public/offers/[acceptanceToken]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch offer details', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'offer_1',
      status: 'SENT',
      sentAt: new Date(),
      application: {
        candidate: {
          firstName: 'John',
          lastName: 'Doe',
        },
        job: {
          title: 'Chef',
          location: { name: 'London' },
        },
      },
    });

    const request = new NextRequest('http://localhost/api/public/offers/token_abc');

    const response = await GET(request, { params: Promise.resolve({ acceptanceToken: 'token_abc' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.candidate.firstName).toBe('John');
    expect(data.job.title).toBe('Chef');
  });

  it('should accept offer and advance to HIRED', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'offer_1',
      tenantId: 'org_abc',
      applicationId: 'app_1',
      status: 'SENT',
      application: {
        id: 'app_1',
        candidate: {
          firstName: 'John',
          lastName: 'Doe',
        },
        job: {
          title: 'Chef',
          location: {
            name: 'London',
            country: 'GB',
            assignments: [
              { role: 'location_manager', clerkUserId: 'user_1' },
            ],
          },
        },
      },
    });

    mockTransaction.mockResolvedValue([]);
    mockSendEmail.mockResolvedValue({ success: true });
    mockClerkClient.mockResolvedValue({
      users: {
        getUser: vi.fn().mockResolvedValue({
          emailAddresses: [
            { id: 'email_1', emailAddress: 'manager@example.com' },
          ],
          primaryEmailAddressId: 'email_1',
        }),
      },
    });

    const request = new NextRequest('http://localhost/api/public/offers/token_abc', {
      method: 'POST',
      body: JSON.stringify({ action: 'accept' }),
    });

    const response = await POST(request, { params: Promise.resolve({ acceptanceToken: 'token_abc' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ACCEPTED');
    expect(mockTransaction).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it('should decline offer and advance to REJECTED', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'offer_1',
      tenantId: 'org_abc',
      applicationId: 'app_1',
      status: 'SENT',
      application: {
        id: 'app_1',
        candidate: {
          firstName: 'John',
          lastName: 'Doe',
        },
        job: {
          title: 'Chef',
          location: {
            name: 'London',
            country: 'GB',
            assignments: [],
          },
        },
      },
    });

    mockTransaction.mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/public/offers/token_abc', {
      method: 'POST',
      body: JSON.stringify({ action: 'decline' }),
    });

    const response = await POST(request, { params: Promise.resolve({ acceptanceToken: 'token_abc' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('DECLINED');
  });
});
