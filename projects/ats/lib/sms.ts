import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an SMS via Twilio
 * 
 * @param to - Recipient phone number (E.164 format)
 * @param body - SMS message body
 * @returns Result object with success status and message ID or error
 */
export async function sendSms(to: string, body: string): Promise<SmsResult> {
  try {
    const message = await client.messages.create({
      from: TWILIO_PHONE_NUMBER,
      to,
      body,
    });

    return {
      success: true,
      messageId: message.sid,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}
