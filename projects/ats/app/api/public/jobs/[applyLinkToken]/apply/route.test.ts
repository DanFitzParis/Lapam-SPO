import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    job: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  })),
}));

describe('/api/public/jobs/[applyLinkToken]/apply', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create candidate, application, and consent record atomically', async () => {
    const { PrismaClient } = await import('@prisma/client');
    
    const mockPrisma = new PrismaClient() as any;
    
    mockPrisma.job.findUnique.mockResolvedValue({
      id: 'job_1',
      tenantId: 'org_abc',
      status: 'PUBLISHED',
    });

    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      const mockTx = {
        candidate: {
          create: vi.fn().mockResolvedValue({ id: 'cand_1' }),
        },
        application: {
          create: vi.fn().mockResolvedValue({ id: 'app_1' }),
        },
        consentRecord: {
          create: vi.fn(),
        },
        jobQueue: {
          create: vi.fn(),
        },
      };
      return callback(mockTx);
    });

    const request = new NextRequest('http://localhost/api/public/jobs/token_abc/apply', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'John',
        lastName: 'Doe',
        mobileNumber: '+447700900000',
        availabilityType: 'FULL_TIME',
        consentGiven: true,
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ applyLinkToken: 'token_abc' }) });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.applicationId).toBe('app_1');
  });

  it('should return 400 if consent not given', async () => {
    const request = new NextRequest('http://localhost/api/public/jobs/token_abc/apply', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'John',
        lastName: 'Doe',
        mobileNumber: '+447700900000',
        availabilityType: 'FULL_TIME',
        consentGiven: false,
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ applyLinkToken: 'token_abc' }) });

    expect(response.status).toBe(400);
  });

  it('should return 410 if job is closed', async () => {
    const { PrismaClient } = await import('@prisma/client');
    
    const mockPrisma = new PrismaClient() as any;
    
    mockPrisma.job.findUnique.mockResolvedValue({
      id: 'job_1',
      tenantId: 'org_abc',
      status: 'CLOSED',
    });

    const request = new NextRequest('http://localhost/api/public/jobs/token_abc/apply', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'John',
        lastName: 'Doe',
        mobileNumber: '+447700900000',
        availabilityType: 'FULL_TIME',
        consentGiven: true,
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ applyLinkToken: 'token_abc' }) });

    expect(response.status).toBe(410);
  });
});
