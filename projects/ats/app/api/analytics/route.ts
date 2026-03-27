import { NextResponse } from 'next/server';
import { getTenantClient, getTenantId, getCurrentUserId } from '@/lib/auth';
import { getUserRole, getUserLocations } from '@/lib/rbac';

export async function GET() {
  try {
    const prisma = await getTenantClient();
    const tenantId = await getTenantId();
    const userId = await getCurrentUserId();
    const userRole = await getUserRole();

    // Date range: trailing 90 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    // Get user's location filter if location_manager
    let locationFilter: string[] | undefined;
    if (userRole === 'location_manager') {
      locationFilter = await getUserLocations();
    }

    // Fetch applications with related data
    const applications = await prisma.application.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate },
        ...(locationFilter && {
          job: {
            locationId: { in: locationFilter },
          },
        }),
      },
      include: {
        job: {
          include: {
            location: true,
          },
        },
      },
    });

    // Calculate metrics
    const totalApplications = applications.length;

    // Time-to-fill: applications where stage = HIRED
    const hiredApplications = applications.filter((app) => app.stage === 'HIRED');
    const timeToFillDays = hiredApplications.map((app) => {
      const days = Math.floor(
        (new Date(app.updatedAt).getTime() - new Date(app.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return days;
    });
    const avgTimeToFill =
      timeToFillDays.length > 0
        ? Math.round(
            timeToFillDays.reduce((sum, days) => sum + days, 0) / timeToFillDays.length
          )
        : 0;

    // Conversion rate: HIRED / total
    const conversionRate =
      totalApplications > 0
        ? ((hiredApplications.length / totalApplications) * 100).toFixed(1)
        : '0.0';

    // Volume by source
    const sourceVolume: Record<string, number> = {};
    for (const app of applications) {
      const source = app.source || 'direct';
      sourceVolume[source] = (sourceVolume[source] || 0) + 1;
    }

    // Per-location breakdown
    const locationMap: Record<
      string,
      {
        locationId: string;
        locationName: string;
        applications: number;
        hired: number;
        avgTimeToFill: number;
        conversionRate: string;
        costPerHire: number;
      }
    > = {};

    for (const app of applications) {
      const locId = app.job.locationId || 'unknown';
      const locName = app.job.location?.name || 'Unknown';

      if (!locationMap[locId]) {
        locationMap[locId] = {
          locationId: locId,
          locationName: locName,
          applications: 0,
          hired: 0,
          avgTimeToFill: 0,
          conversionRate: '0.0',
          costPerHire: 0,
        };
      }

      locationMap[locId].applications += 1;
      if (app.stage === 'HIRED') {
        locationMap[locId].hired += 1;
      }
    }

    // Calculate per-location metrics
    const locationMetrics = Object.values(locationMap).map((loc) => {
      const locApps = applications.filter((app) => app.job.locationId === loc.locationId);
      const locHired = locApps.filter((app) => app.stage === 'HIRED');

      const locTimeToFillDays = locHired.map((app) =>
        Math.floor(
          (new Date(app.updatedAt).getTime() - new Date(app.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      const locAvgTimeToFill =
        locTimeToFillDays.length > 0
          ? Math.round(
              locTimeToFillDays.reduce((sum, days) => sum + days, 0) /
                locTimeToFillDays.length
            )
          : 0;

      const locConversionRate =
        loc.applications > 0 ? ((loc.hired / loc.applications) * 100).toFixed(1) : '0.0';

      // Cost-per-hire estimate: £500 + (timeToFill * £50)
      const locCostPerHire = loc.hired > 0 ? 500 + locAvgTimeToFill * 50 : 0;

      return {
        locationId: loc.locationId,
        locationName: loc.locationName,
        applications: loc.applications,
        hired: loc.hired,
        avgTimeToFill: locAvgTimeToFill,
        conversionRate: locConversionRate,
        costPerHire: locCostPerHire,
      };
    });

    return NextResponse.json({
      summary: {
        totalApplications,
        avgTimeToFill,
        conversionRate,
      },
      sourceVolume,
      locationMetrics,
    });
  } catch (error: any) {
    console.error('GET /api/analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', message: error.message },
      { status: 500 }
    );
  }
}
