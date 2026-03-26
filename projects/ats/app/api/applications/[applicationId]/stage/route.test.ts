import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockCreate = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/lib/auth', () => ({
  getTenantClient: vi.fn(() => ({
    application: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
    pipelineEvent: {
      create: mockCreate,
    },
    $transaction: mockTransaction,
  })),
  getCurrentUserId: vi.fn(() => Promise.resolve('user_1')),
}));

const { PATCH } = await import('./route');

describe('/api/applications/[applicationId]/stage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update stage to OFFER (no RTW gate)', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'app_1',
      stage: 'INTERVIEW',
      tenantId: 'org_abc',
      job: {
        location: { country: 'GB' },
      },
      rightToWorkCheck: null,
    });

    mockTransaction.mockResolvedValue([
      {
        id: 'app_1',
        stage: 'OFFER',
        candidate: { firstName: 'John', lastName: 'Doe' },
      },
    ]);

    const request = new NextRequest('http://localhost/api/applications/app_1/stage', {
      method: 'PATCH',
      body: JSON.stringify({ stage: 'OFFER' }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ applicationId: 'app_1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stage).toBe('OFFER');
  });

  it('should block HIRED stage for GB location without RTW', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'app_1',
      stage: 'OFFER',
      tenantId: 'org_abc',
      job: {
        location: { country: 'GB' },
      },
      rightToWorkCheck: null, // No RTW check
    });

    const request = new NextRequest('http://localhost/api/applications/app_1/stage', {
      method: 'PATCH',
      body: JSON.stringify({ stage: 'HIRED' }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ applicationId: 'app_1' }) });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain('Right to work');
  });

  it('should allow HIRED stage for GB location with PASS RTW', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'app_1',
      stage: 'OFFER',
      tenantId: 'org_abc',
      job: {
        location: { country: 'GB' },
      },
      rightToWorkCheck: { result: 'PASS' },
    });

    mockTransaction.mockResolvedValue([
      {
        id: 'app_1',
        stage: 'HIRED',
        candidate: { firstName: 'John', lastName: 'Doe' },
      },
    ]);

    const request = new NextRequest('http://localhost/api/applications/app_1/stage', {
      method: 'PATCH',
      body: JSON.stringify({ stage: 'HIRED' }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ applicationId: 'app_1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stage).toBe('HIRED');
  });
});
