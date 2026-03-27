import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGenerateText = vi.fn();
const mockCreate = vi.fn();

vi.mock('ai', () => ({
  generateText: mockGenerateText,
}));

vi.mock('@/lib/ai', () => ({
  aiModel: 'mock-model',
}));

vi.mock('@/lib/auth', () => ({
  getTenantClient: vi.fn(() => ({
    auditLog: {
      create: mockCreate,
    },
  })),
  getCurrentUserId: vi.fn(() => Promise.resolve('user_1')),
  getTenantId: vi.fn(() => Promise.resolve('org_abc')),
}));

const { POST } = await import('./route');

describe('/api/ai/interview-questions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate interview questions and log to audit', async () => {
    const mockQuestions = [
      'Tell me about your experience in fine dining?',
      'How do you handle difficult customers?',
      'Describe a time you worked under pressure.',
    ];

    mockGenerateText.mockResolvedValue({
      text: JSON.stringify(mockQuestions),
    });

    mockCreate.mockResolvedValue({});

    const request = new NextRequest('http://localhost/api/ai/interview-questions', {
      method: 'POST',
      body: JSON.stringify({
        roleTitle: 'Head Chef',
        locationType: 'RESTAURANT',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.questions).toEqual(mockQuestions);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: 'AI_INTERVIEW_QUESTIONS',
          metadata: expect.objectContaining({
            roleTitle: 'Head Chef',
            locationType: 'RESTAURANT',
            questionCount: 3,
          }),
        }),
      })
    );
  });

  it('should handle AI service errors gracefully', async () => {
    mockGenerateText.mockRejectedValue(new Error('AI service unavailable'));

    const request = new NextRequest('http://localhost/api/ai/interview-questions', {
      method: 'POST',
      body: JSON.stringify({
        roleTitle: 'Chef',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to generate interview questions');
  });
});
