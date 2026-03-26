import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { initiateGbgCheck } from '@/lib/gbg';

const prisma = new PrismaClient();

const submissionSchema = z.object({
  method: z.enum(['idvt', 'share_code']),
  shareCode: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ rtwToken: string }> }
) {
  try {
    const { rtwToken } = await params;
    const body = await request.json();
    const { method, shareCode } = submissionSchema.parse(body);

    // Find RTW request
    const rtwRequest = await prisma.rtwRequest.findUnique({
      where: { rtwToken },
      include: {
        application: {
          include: {
            candidate: true,
          },
        },
      },
    });

    if (!rtwRequest) {
      return NextResponse.json(
        { error: 'RTW request not found' },
        { status: 404 }
      );
    }

    // Check if already completed
    const existingCheck = await prisma.rightToWorkCheck.findUnique({
      where: { applicationId: rtwRequest.applicationId },
    });

    if (existingCheck) {
      return NextResponse.json(
        { error: 'RTW check already completed' },
        { status: 410 }
      );
    }

    const { candidate } = rtwRequest.application;

    // Initiate GBG check
    const gbgResponse = await initiateGbgCheck({
      applicantId: rtwRequest.applicationId,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      documentType: method === 'idvt' ? 'passport' : 'share_code',
      documentNumber: shareCode,
    });

    // If IDVT, return redirect URL
    if (method === 'idvt' && gbgResponse.redirectUrl) {
      return NextResponse.json({
        redirectUrl: gbgResponse.redirectUrl,
        checkId: gbgResponse.checkId,
      });
    }

    // For share code, mock immediate completion
    // In production, GBG would process and webhook back
    return NextResponse.json({
      submitted: true,
      checkId: gbgResponse.checkId,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('POST /api/public/rtw/[rtwToken] error:', error);
    return NextResponse.json(
      { error: 'Failed to submit verification' },
      { status: 500 }
    );
  }
}
