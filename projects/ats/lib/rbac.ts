import { auth } from '@clerk/nextjs/server';
import { createTenantClient } from './prisma';

export type Role = 'group_admin' | 'location_manager' | 'read_only';

export async function requireRole(requiredRole: Role): Promise<void> {
  const { userId, orgId, sessionClaims } = await auth();

  if (!userId || !orgId) {
    throw new Error('Unauthorized: User not authenticated or not part of an organization', {
      cause: { status: 401 },
    });
  }

  const userRole = (sessionClaims?.metadata as any)?.role as Role | undefined;

  if (!userRole) {
    throw new Error('Unauthorized: User has no role assigned', {
      cause: { status: 403 },
    });
  }

  if (userRole === 'group_admin') {
    return;
  }

  if (userRole !== requiredRole) {
    throw new Error(`Forbidden: User role '${userRole}' does not have access. Required: '${requiredRole}'`, {
      cause: { status: 403 },
    });
  }
}

export async function getUserLocations(): Promise<string[]> {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    throw new Error('Unauthorized: User not authenticated');
  }

  const prisma = createTenantClient(orgId);

  const assignments = await prisma.locationAssignment.findMany({
    where: {
      clerkUserId: userId,
    },
    select: {
      locationId: true,
    },
  });

  return assignments.map(a => a.locationId);
}

export async function getUserRole(): Promise<Role | null> {
  const { sessionClaims } = await auth();
  return ((sessionClaims?.metadata as any)?.role as Role) || null;
}
