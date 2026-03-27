import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/lib/auth', () => ({
  getTenantClient: vi.fn(() => ({
    application: {
      findUnique: mockFindUnique,
    },
    talentPoolEntry: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: mockCreate,
    },
    consentRecord: {
      create: mockCreate,
    },
    $transaction: mockTransaction,
  })),
}));

const { POST } = await import('./route');

describe('/api/applications/[applicationId]/close-hire', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create talent pool entry and consent record', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'app_1',
      tenantId: 'org_abc',
      candidateId: 'cand_1',
      stage: 'HIRED',
      candidate: {
        firstName: 'John',
        lastName: 'Doe',
      },
      job: {
        title: 'Chef',
        locationId: 'loc_1',
      },
    });

    mockTransaction.mockImplementation(async (cb) =>
      cb({
        talentPoolEntry: {
          create: vi.fn().mockResolvedValue({
            id: 'tpe_1',
          }),
        },
        consentRecord: {
          create: vi.fn(),
        },
      })
    );

    const request = new NextRequest('http://localhost/api/applications/app_1/close-hire', {
      method: 'POST',
      body: JSON.stringify({
        tag: 'REHIRE_ELIGIBLE',
        notes: 'Great performer',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ applicationId: 'app_1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.talentPoolEntryId).toBe('tpe_1');
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('should return 400 if application not in HIRED stage', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'app_1',
      stage: 'OFFER',
      tenantId: 'org_abc',
    });

    const request = new NextRequest('http://localhost/api/applications/app_1/close-hire', {
      method: 'POST',
      body: JSON.stringify({
        tag: 'REHIRE_ELIGIBLE',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ applicationId: 'app_1' }) });

    expect(response.status).toBe(400);
  });
});
