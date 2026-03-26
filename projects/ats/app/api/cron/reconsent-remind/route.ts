import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { processReconsentReminders } from '@/lib/jobs/reconsent-reminder-worker';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Verify CRON_SECRET
    const authHeader = request.headers.get('authorization');
    const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Process re-consent reminders
    const result = await processReconsentReminders(prisma);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('POST /api/cron/reconsent-remind error:', error);
    return NextResponse.json(
      { error: 'Failed to process re-consent reminders' },
      { status: 500 }
    );
  }
}
