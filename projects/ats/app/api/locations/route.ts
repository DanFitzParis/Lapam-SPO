import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTenantClient, getTenantId } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';

const createLocationSchema = z.object({
  name: z.string().min(1),
  country: z.enum(['GB', 'IE', 'FR', 'DE', 'NL', 'ES', 'IT', 'US', 'OTHER']),
  timezone: z.string().optional(),
});

export async function GET() {
  try {
    const prisma = await getTenantClient();
    
    const locations = await prisma.location.findMany({
      select: {
        id: true,
        name: true,
        country: true,
        timezone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error('GET /api/locations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole('group_admin');
    
    const body = await request.json();
    const validated = createLocationSchema.parse(body);

    const prisma = await getTenantClient();
    const tenantId = await getTenantId();
    
    const location = await prisma.location.create({
      data: {
        name: validated.name,
        country: validated.country,
        timezone: validated.timezone,
        tenant: {
          connect: { id: tenantId },
        },
      },
      select: {
        id: true,
        name: true,
        country: true,
        timezone: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error: any) {
    if (error.cause?.status === 403) {
      return NextResponse.json(
        { error: 'Forbidden: group_admin role required' },
        { status: 403 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('POST /api/locations error:', error);
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    );
  }
}
