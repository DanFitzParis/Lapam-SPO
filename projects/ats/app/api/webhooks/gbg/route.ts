import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '@/lib/email';
import { clerkClient } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

interface GbgWebhookPayload {
  checkId: string
  applicantId: string
  result: 'PASS' | 'FAIL'
  documentType?: string
  completedAt: string
}

export async function POST(request: NextRequest) {
  try {
    const payload: GbgWebhookPayload = await request.json();
    const { checkId, applicantId, result } = payload;

    // Find application by GBG checkId or applicantId
    // In real implementation, we'd store checkId when initiating verification
    // For mock, we'll find by recent RTW request
    
    // TODO: In production, look up by checkId stored during initiation
    // For now, this is a simplified mock webhook handler
    
    console.log('[GBG Webhook] Received:', payload);

    // Mock response - in real implementation, process the check result
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('POST /api/webhooks/gbg error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
