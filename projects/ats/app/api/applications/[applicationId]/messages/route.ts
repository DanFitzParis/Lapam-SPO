import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTenantClient, getCurrentUserId } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';

const sendMessageSchema = z.object({
  body: z.string().min(1),
  channel: z.enum(['SMS', 'EMAIL']).optional(),
  aiAssisted: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;
    const prisma = await getTenantClient();

    const messages = await prisma.message.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        direction: true,
        channel: true,
        body: true,
        status: true,
        sentAt: true,
        deliveredAt: true,
        aiAssisted: true,
        createdAt: true,
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('GET /api/applications/[applicationId]/messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;
    const body = await request.json();
    const { body: messageBody, channel, aiAssisted } = sendMessageSchema.parse(body);

    const prisma = await getTenantClient();

    // Fetch application and candidate
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const { candidate } = application;

    // Determine channel if not specified
    let finalChannel: 'SMS' | 'EMAIL' | 'WHATSAPP' = channel || candidate.preferredChannel;

    // Send message
    let messageResult;
    if (finalChannel === 'SMS' && candidate.mobileNumber) {
      messageResult = await sendSms(candidate.mobileNumber, messageBody);
    } else if (candidate.email) {
      messageResult = await sendEmail(candidate.email, 'Message from Recruitment Team', messageBody);
      finalChannel = 'EMAIL';
    } else {
      return NextResponse.json(
        { error: 'No contact method available' },
        { status: 400 }
      );
    }

    if (!messageResult.success) {
      return NextResponse.json(
        { error: messageResult.error || 'Failed to send message' },
        { status: 500 }
      );
    }

    // Create message record
    const message = await prisma.message.create({
      data: {
        tenantId: application.tenantId,
        applicationId,
        direction: 'OUTBOUND',
        channel: finalChannel,
        body: messageBody,
        externalId: messageResult.messageId,
        status: 'SENT',
        sentAt: new Date(),
        aiAssisted: aiAssisted || false,
      },
      select: {
        id: true,
        direction: true,
        channel: true,
        body: true,
        status: true,
        sentAt: true,
        aiAssisted: true,
        createdAt: true,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('POST /api/applications/[applicationId]/messages error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
