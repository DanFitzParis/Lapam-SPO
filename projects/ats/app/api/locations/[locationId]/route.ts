import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTenantClient } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';

const updateLocationSchema = z.object({
  name: z.string().min(1).optional(),
  timezone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { locationId: string } }
) {
  try {
    await requireRole('group_admin');
    
    const body = await request.json();
    const validated = updateLocationSchema.parse(body);

    const prisma = await getTenantClient();
    
    const location = await prisma.location.update({
      where: {
        id: params.locationId,
      },
      data: validated,
      select: {
        id: true,
        name: true,
        country: true,
        timezone: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(location);
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

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    console.error('PATCH /api/locations/[locationId] error:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}
