import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTenantId } from '@/lib/auth';
import { generatePresignedUploadUrl } from '@/lib/r2';

const requestSchema = z.object({
  applicationId: z.string(),
  documentType: z.enum(['cv', 'rtw-document', 'offer-letter']),
  filename: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // Require authenticated session
    const tenantId = await getTenantId();

    const body = await request.json();
    const { applicationId, documentType, filename } = requestSchema.parse(body);

    const result = await generatePresignedUploadUrl(
      tenantId,
      applicationId,
      documentType,
      filename
    );

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message?.includes('No organization')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('POST /api/uploads/presign error:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 500 }
    );
  }
}
