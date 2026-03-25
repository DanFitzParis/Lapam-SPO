import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { processStaleAlerts } from '@/lib/jobs/stale-alert-worker';

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

    // Process stale alerts
    const result = await processStaleAlerts(prisma);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('POST /api/cron/stale-alert error:', error);
    return NextResponse.json(
      { error: 'Failed to process stale alerts' },
      { status: 500 }
    );
  }
}
