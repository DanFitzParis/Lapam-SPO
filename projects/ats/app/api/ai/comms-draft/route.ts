import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { streamText } from 'ai';
import { aiModel } from '@/lib/ai';

const requestSchema = z.object({
  candidateName: z.string(),
  jobTitle: z.string(),
  stage: z.enum(['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN']),
  context: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateName, jobTitle, stage, context } = requestSchema.parse(body);

    const prompt = `Draft a professional, friendly message to ${candidateName} about their application for the ${jobTitle} role. Current stage: ${stage}.${context ? ` Additional context: ${context}` : ''} Keep it concise (2-3 sentences), warm, and hospitality-focused.`;

    const result = streamText({
      model: aiModel,
      prompt,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('POST /api/ai/comms-draft error:', error);
    return NextResponse.json(
      { error: 'Failed to generate draft' },
      { status: 500 }
    );
  }
}
