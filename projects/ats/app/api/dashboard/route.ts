import { NextRequest, NextResponse } from 'next/server';
import { getTenantClient } from '@/lib/auth';
import { getUserRole, getUserLocations } from '@/lib/rbac';

interface DashboardLocation {
  locationId: string;
  locationName: string;
  country: string;
  openRolesCount: number;
  stageCounts: {
    APPLIED: number;
    SCREENING: number;
    INTERVIEW: number;
    OFFER: number;
  };
  staleAlert: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const prisma = await getTenantClient();
    const role = await getUserRole();

    // Determine location scope based on role
    let locationIds: string[] | undefined;
    if (role === 'location_manager') {
      locationIds = await getUserLocations();
    }
    // group_admin sees all locations (locationIds remains undefined)

    // Build location filter
    const locationFilter = locationIds ? { id: { in: locationIds } } : {};

    // Fetch locations with related data
    const locations = await prisma.location.findMany({
      where: locationFilter,
      select: {
        id: true,
        name: true,
        country: true,
        jobs: {
          where: {
            status: 'PUBLISHED',
          },
          select: {
            id: true,
            createdAt: true,
            applications: {
              select: {
                stage: true,
              },
            },
          },
        },
      },
    });

    // Compute dashboard data per location
    const dashboardData: DashboardLocation[] = locations.map((location) => {
      const openRolesCount = location.jobs.length;

      // Aggregate stage counts across all jobs
      const stageCounts = {
        APPLIED: 0,
        SCREENING: 0,
        INTERVIEW: 0,
        OFFER: 0,
      };

      let staleAlert = false;

      for (const job of location.jobs) {
        // Count applications by stage
        for (const app of job.applications) {
          if (app.stage in stageCounts) {
            stageCounts[app.stage as keyof typeof stageCounts]++;
          }
        }

        // Stale alert: job open ≥5 days with 0 active candidates
        const daysSinceCreated = Math.floor(
          (Date.now() - job.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        const activeStages = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER'];
        const activeCandidatesCount = job.applications.filter((app) =>
          activeStages.includes(app.stage)
        ).length;

        if (daysSinceCreated >= 5 && activeCandidatesCount === 0) {
          staleAlert = true;
        }
      }

      return {
        locationId: location.id,
        locationName: location.name,
        country: location.country,
        openRolesCount,
        stageCounts,
        staleAlert,
      };
    });

    return NextResponse.json(dashboardData);
  } catch (error: any) {
    if (error.cause?.status === 403) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    console.error('GET /api/dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
