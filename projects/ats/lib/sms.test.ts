import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Twilio
const mockCreate = vi.fn();
vi.mock('twilio', () => ({
  default: vi.fn(() => ({
    messages: {
      create: mockCreate,
    },
  })),
}));

describe('sms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send SMS successfully', async () => {
    mockCreate.mockResolvedValue({
      sid: 'sms_123',
    });

    const { sendSms } = await import('./sms');
    const result = await sendSms('+447700900000', 'Test message');

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('sms_123');
  });

  it('should handle Twilio error gracefully', async () => {
    mockCreate.mockRejectedValue(new Error('Invalid phone number'));

    const { sendSms } = await import('./sms');
    const result = await sendSms('invalid', 'Test message');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid phone number');
  });
});
