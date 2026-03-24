import { NextRequest } from 'next/server';
import { z } from 'zod';
import { streamText } from 'ai';
import { aiModel } from '@/lib/ai';
import { getTenantClient, getCurrentUserId, getTenantId } from '@/lib/auth';

const requestSchema = z.object({
  roleTitle: z.string().min(1),
  locationType: z.enum(['RESTAURANT', 'HOTEL', 'BAR', 'EVENTS', 'OTHER']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roleTitle, locationType } = requestSchema.parse(body);

    // Log audit entry
    const prisma = await getTenantClient();
    const userId = await getCurrentUserId();
    const tenantId = await getTenantId();

    await prisma.auditLog.create({
      data: {
        eventType: 'AI_JD_GENERATION',
        actorUserId: userId,
        metadata: {
          roleTitle,
          locationType: locationType || null,
        },
        tenant: {
          connect: { id: tenantId },
        },
      },
    });

    // Generate job description
    const prompt = locationType
      ? `Write a concise, professional job description for a ${roleTitle} role in a ${locationType.toLowerCase()} setting. Include key responsibilities and required skills. Keep it under 200 words.`
      : `Write a concise, professional job description for a ${roleTitle} role in the hospitality industry. Include key responsibilities and required skills. Keep it under 200 words.`;

    const result = streamText({
      model: aiModel,
      prompt,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.error('POST /api/ai/job-description error:', error);

    // Check for Anthropic API errors
    if (error.message?.includes('API') || error.code === 'ECONNREFUSED') {
      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable. Please try again later.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Failed to generate job description' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
