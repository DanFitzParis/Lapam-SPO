import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTenantClient } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';

const assignmentSchema = z.object({
  clerkUserId: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    await requireRole('group_admin');
    const { locationId } = await params;
    
    const body = await request.json();
    const { clerkUserId } = assignmentSchema.parse(body);

    const prisma = await getTenantClient();
    
    await prisma.locationAssignment.create({
      data: {
        locationId,
        clerkUserId,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    if (error.cause?.status === 403) {
      return NextResponse.json(
        { error: 'Forbidden: group_admin role required' },
        { status: 403 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Assignment already exists' },
        { status: 409 }
      );
    }

    console.error('POST /api/locations/[locationId]/assignments error:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    await requireRole('group_admin');
    const { locationId } = await params;
    
    const body = await request.json();
    const { clerkUserId } = assignmentSchema.parse(body);

    const prisma = await getTenantClient();
    
    await prisma.locationAssignment.delete({
      where: {
        locationId_clerkUserId: {
          locationId,
          clerkUserId,
        },
      },
    });

    return NextResponse.json(null, { status: 204 });
  } catch (error: any) {
    if (error.cause?.status === 403) {
      return NextResponse.json(
        { error: 'Forbidden: group_admin role required' },
        { status: 403 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    console.error('DELETE /api/locations/[locationId]/assignments error:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}
