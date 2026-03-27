import { NextResponse } from 'next/server';
import { getTenantClient } from '@/lib/auth';

export async function GET() {
  try {
    const prisma = await getTenantClient();

    const entries = await prisma.talentPoolEntry.findMany({
      where: {
        locationId: { not: null },
      },
      select: {
        id: true,
        originalRole: true,
        tag: true,
        createdAt: true,
        locationId: true,
        candidate: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        consent: {
          select: {
            consentExpiry: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch locations separately for entries
    const locationIds = entries.map((e) => e.locationId).filter(Boolean) as string[];
    const locations = await prisma.location.findMany({
      where: { id: { in: locationIds } },
      select: { id: true, name: true },
    });

    const locationMap = new Map(locations.map((l) => [l.id, l]));

    const enrichedEntries = entries.map((entry) => ({
      ...entry,
      location: entry.locationId ? locationMap.get(entry.locationId) || null : null,
      locationId: undefined,
    }));

    return NextResponse.json(enrichedEntries);
  } catch (error) {
    console.error('GET /api/talent-pool error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch talent pool' },
      { status: 500 }
    );
  }
}
