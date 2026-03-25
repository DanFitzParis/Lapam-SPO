import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { EmailResult } from './email';

// Mock Resend
const mockSend = vi.fn();
vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

describe('email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send email successfully', async () => {
    mockSend.mockResolvedValue({
      data: { id: 'email_123' },
      error: null,
    });

    const { sendEmail } = await import('./email');
    const result = await sendEmail('test@example.com', 'Test Subject', 'Test body');

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('email_123');
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test body',
      })
    );
  });

  it('should handle Resend error gracefully', async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { message: 'Invalid email address' },
    });

    const { sendEmail } = await import('./email');
    const result = await sendEmail('invalid', 'Subject', 'Body');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email address');
  });
});
