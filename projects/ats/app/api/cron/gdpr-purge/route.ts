import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { processGdprPurges } from '@/lib/jobs/gdpr-purge-worker';

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

    // Process GDPR purges
    const result = await processGdprPurges(prisma);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('POST /api/cron/gdpr-purge error:', error);
    return NextResponse.json(
      { error: 'Failed to process GDPR purges' },
      { status: 500 }
    );
  }
}
