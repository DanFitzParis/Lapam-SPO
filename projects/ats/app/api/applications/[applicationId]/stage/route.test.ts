import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockApplicationFindUnique = vi.fn();
const mockApplicationUpdate = vi.fn();
const mockPipelineEventCreate = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/lib/auth', () => ({
  getTenantClient: vi.fn(() => ({
    application: {
      findUnique: mockApplicationFindUnique,
      update: mockApplicationUpdate,
    },
    pipelineEvent: {
      create: mockPipelineEventCreate,
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

  it('should update stage and create pipeline event', async () => {
    mockApplicationFindUnique.mockResolvedValue({
      id: 'app_1',
      stage: 'APPLIED',
      tenantId: 'org_abc',
    });

    mockTransaction.mockImplementation(async (operations: any[]) => {
      return [
        {
          id: 'app_1',
          stage: 'SCREENING',
          candidate: { firstName: 'John', lastName: 'Doe' },
        },
        { id: 'event_1' },
      ];
    });

    const request = new NextRequest('http://localhost/api/applications/app_1/stage', {
      method: 'PATCH',
      body: JSON.stringify({
        stage: 'SCREENING',
        note: 'Initial review passed',
      }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ applicationId: 'app_1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stage).toBe('SCREENING');
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('should return 404 if application not found', async () => {
    mockApplicationFindUnique.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/applications/app_999/stage', {
      method: 'PATCH',
      body: JSON.stringify({ stage: 'SCREENING' }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ applicationId: 'app_999' }) });

    expect(response.status).toBe(404);
  });
});
