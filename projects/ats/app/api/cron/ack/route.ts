import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { processAckJobs } from '@/lib/jobs/ack-worker';

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

    // Process acknowledgement jobs
    const results = await processAckJobs(prisma);

    const processed = results.length;
    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      processed,
      succeeded,
      failed,
      results,
    });
  } catch (error: any) {
    console.error('POST /api/cron/ack error:', error);
    return NextResponse.json(
      { error: 'Failed to process acknowledgement jobs' },
      { status: 500 }
    );
  }
}
