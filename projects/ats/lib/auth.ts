import { auth } from '@clerk/nextjs/server';
import { createTenantClient, type TenantPrismaClient } from './prisma';

export async function getTenantClient(): Promise<TenantPrismaClient> {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error(
      'No organization found in session. User must be part of a Clerk organization to access tenant data.'
    );
  }

  return createTenantClient(orgId);
}

export async function getCurrentUserId(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('User not authenticated');
  }

  return userId;
}

export async function getTenantId(): Promise<string> {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error('No organization found in session');
  }

  return orgId;
}
