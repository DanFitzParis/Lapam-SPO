import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTenantClient } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';

const campaignSchema = z.object({
  entryIds: z.array(z.string()).min(1),
  message: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entryIds, message } = campaignSchema.parse(body);

    const prisma = await getTenantClient();

    // Fetch talent pool entries with candidate details
    const entries = await prisma.talentPoolEntry.findMany({
      where: {
        id: { in: entryIds },
      },
      include: {
        candidate: true,
      },
    });

    const results = [];

    for (const entry of entries) {
      try {
        const { candidate } = entry;

        // Send via SMS if available
        if (candidate.mobileNumber) {
          await sendSms(candidate.mobileNumber, message);
        }

        // Send via email if available
        if (candidate.email) {
          await sendEmail(
            candidate.email,
            'New Opportunity - Talent Pool Re-engagement',
            message
          );
        }

        results.push({
          entryId: entry.id,
          success: true,
        });
      } catch (error: any) {
        results.push({
          entryId: entry.id,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      totalSent: results.filter((r) => r.success).length,
      totalFailed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('POST /api/talent-pool/campaigns error:', error);
    return NextResponse.json(
      { error: 'Failed to send campaign' },
      { status: 500 }
    );
  }
}
