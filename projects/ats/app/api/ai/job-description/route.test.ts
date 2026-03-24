import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getTenantClient: vi.fn(),
  getCurrentUserId: vi.fn(),
  getTenantId: vi.fn(),
}));

vi.mock('ai', () => ({
  streamText: vi.fn(),
}));

vi.mock('@/lib/ai', () => ({
  aiModel: {},
}));

describe('/api/ai/job-description', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create audit log and return streaming response', async () => {
    const { getTenantClient, getCurrentUserId, getTenantId } = await import('@/lib/auth');
    const { streamText } = await import('ai');

    vi.mocked(getCurrentUserId).mockResolvedValue('user_123');
    vi.mocked(getTenantId).mockResolvedValue('org_abc');

    const mockPrisma = {
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: 'audit_1' }),
      },
    };

    vi.mocked(getTenantClient).mockResolvedValue(mockPrisma as any);

    const mockStreamResult = {
      toTextStreamResponse: vi.fn().mockReturnValue(new Response('stream', { status: 200 })),
    };

    vi.mocked(streamText).mockReturnValue(mockStreamResult as any);

    const request = new NextRequest('http://localhost/api/ai/job-description', {
      method: 'POST',
      body: JSON.stringify({ roleTitle: 'Kitchen Porter' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: 'AI_JD_GENERATION',
          actorUserId: 'user_123',
        }),
      })
    );
  });

  it('should return 503 when AI service unavailable', async () => {
    const { getTenantClient, getCurrentUserId, getTenantId } = await import('@/lib/auth');
    const { streamText } = await import('ai');

    vi.mocked(getCurrentUserId).mockResolvedValue('user_123');
    vi.mocked(getTenantId).mockResolvedValue('org_abc');

    const mockPrisma = {
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: 'audit_1' }),
      },
    };

    vi.mocked(getTenantClient).mockResolvedValue(mockPrisma as any);

    vi.mocked(streamText).mockImplementation(() => {
      throw new Error('API connection failed');
    });

    const request = new NextRequest('http://localhost/api/ai/job-description', {
      method: 'POST',
      body: JSON.stringify({ roleTitle: 'Chef' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toContain('unavailable');
  });
});
