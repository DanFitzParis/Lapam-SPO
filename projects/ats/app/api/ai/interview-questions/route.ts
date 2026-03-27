import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText } from 'ai';
import { aiModel } from '@/lib/ai';
import { getTenantClient, getCurrentUserId, getTenantId } from '@/lib/auth';

const requestSchema = z.object({
  roleTitle: z.string().min(1),
  locationType: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roleTitle, locationType } = requestSchema.parse(body);

    const prisma = await getTenantClient();
    const userId = await getCurrentUserId();
    const tenantId = await getTenantId();

    // Build prompt
    const prompt = `Generate 5-8 interview questions for a ${roleTitle} position${
      locationType ? ` in a ${locationType.toLowerCase()} setting` : ''
    }.

Focus on:
- Role-specific skills and experience
- Situational and behavioral questions
- Questions that reveal cultural fit
- Questions appropriate for hospitality/service industries

Return ONLY a JSON array of strings, no other text. Each string should be a complete interview question.

Example format: ["Question 1?", "Question 2?", ...]`;

    // Call Anthropic API
    const result = await generateText({
      model: aiModel,
      prompt,
    });

    // Parse response
    let questions: string[];
    try {
      questions = JSON.parse(result.text);
      
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid response format');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', result.text);
      return NextResponse.json(
        { error: 'AI service returned invalid format' },
        { status: 500 }
      );
    }

    // Log to audit
    await prisma.auditLog.create({
      data: {
        tenantId,
        eventType: 'AI_INTERVIEW_QUESTIONS',
        actorUserId: userId,
        metadata: {
          roleTitle,
          locationType,
          questionCount: questions.length,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ questions });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('POST /api/ai/interview-questions error:', error);
    return NextResponse.json(
      { error: 'Failed to generate interview questions', message: error.message },
      { status: 500 }
    );
  }
}
