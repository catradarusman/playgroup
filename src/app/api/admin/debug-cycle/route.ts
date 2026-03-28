import { NextResponse } from 'next/server';
import { db } from '@/neynar-db-sdk/db';
import { cycles, albums } from '@/db/schema';
import { desc, and, lte, gte, eq } from 'drizzle-orm';

/**
 * Debug endpoint: Dump raw cycle + album state for production diagnosis
 * GET /api/admin/debug-cycle
 */
export async function GET(_request: Request) {
  try {
  const now = new Date();

  // All cycles ordered by week number
  const allCycles = await db
    .select()
    .from(cycles)
    .orderBy(desc(cycles.weekNumber));

  // What getCurrentCycle() returns (max weekNumber for current year)
  const currentYear = now.getFullYear();
  const byCycleYear = await db
    .select()
    .from(cycles)
    .where(eq(cycles.year, currentYear))
    .orderBy(desc(cycles.weekNumber))
    .limit(1);

  // What getOrCreateCurrentCycle() finds (time-range)
  const byTimeRange = await db
    .select()
    .from(cycles)
    .where(and(lte(cycles.startDate, now), gte(cycles.endDate, now)))
    .orderBy(desc(cycles.weekNumber))
    .limit(1);

  // Albums for the time-range cycle (if found)
  const activeCycleId = byTimeRange[0]?.id ?? null;
  const cycleAlbums = activeCycleId
    ? await db.select().from(albums).where(eq(albums.cycleId, activeCycleId))
    : [];

  return NextResponse.json({
    serverNow: now.toISOString(),
    currentYear,
    allCycles: allCycles.map((c) => ({
      id: c.id,
      weekNumber: c.weekNumber,
      year: c.year,
      phase: c.phase,
      startDate: c.startDate,
      endDate: c.endDate,
      votingEndsAt: c.votingEndsAt,
      winnerId: c.winnerId,
    })),
    getCurrentCycleResult: byCycleYear[0] ?? null,
    getOrCreateResult_timeRange: byTimeRange[0] ?? null,
    albumsForActiveCycle: cycleAlbums.map((a) => ({
      id: a.id,
      title: a.title,
      status: a.status,
      cycleId: a.cycleId,
    })),
  });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
