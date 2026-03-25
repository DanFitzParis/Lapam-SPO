import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email via Resend
 * 
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param body - Email body (plain text or React component)
 * @returns Result object with success status and message ID or error
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string | React.ReactElement
): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Lapam ATS <noreply@lapam.ats>',
      to,
      subject,
      ...(typeof body === 'string' ? { text: body } : { react: body }),
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Unknown email error',
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}
