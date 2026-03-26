import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { processInterviewReminders } from '@/lib/jobs/interview-reminder-worker';

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

    // Process interview reminders
    const result = await processInterviewReminders(prisma);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('POST /api/cron/interview-reminders error:', error);
    return NextResponse.json(
      { error: 'Failed to process interview reminders' },
      { status: 500 }
    );
  }
}
