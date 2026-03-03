import { NextResponse } from 'next/server';
import { db } from '@/neynar-db-sdk/db';
import { cycles } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { createCycle } from '@/db/actions/cycle-actions';

// Anchor: Mar 2 2026 00:00:00 Jakarta = Mar 1 2026 17:00:00 UTC
const ANCHOR_UTC = new Date('2026-03-01T17:00:00.000Z');
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
const CYCLE_MS = 14 * 24 * 60 * 60 * 1000;
const VOTING_MS = 7 * 24 * 60 * 60 * 1000;
const REVIEW_OFFSET_MS = 11 * 24 * 60 * 60 * 1000;

function computeCycleBoundaries(now: Date) {
  const elapsed = now.getTime() - ANCHOR_UTC.getTime();
  const cycleNum = Math.max(0, Math.floor(elapsed / CYCLE_MS));
  const startDate = new Date(ANCHOR_UTC.getTime() + cycleNum * CYCLE_MS);
  const votingEndsAt = new Date(startDate.getTime() + VOTING_MS);
  const reviewOpensAt = new Date(startDate.getTime() + REVIEW_OFFSET_MS);
  const endDate = new Date(startDate.getTime() + CYCLE_MS - 1);
  const weekNumber = cycleNum + 1;
  const year = new Date(startDate.getTime() + JAKARTA_OFFSET_MS).getUTCFullYear();
  return { weekNumber, year, startDate, votingEndsAt, reviewOpensAt, endDate };
}

/**
 * Admin endpoint: Force-start a new voting cycle
 * GET /api/admin/reset-cycle
 *
 * Creates a fresh voting cycle using the anchor-based 14-day schedule.
 * Increments weekNumber beyond the current DB max so it becomes the active cycle.
 */
export async function GET(request: Request) {
  // Require a Bearer token matching ADMIN_SECRET env var
  const secret = process.env.ADMIN_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const boundaries = computeCycleBoundaries(now);

    // Use max(computed, DB max + 1) to avoid weekNumber collisions
    const lastCycles = await db
      .select()
      .from(cycles)
      .orderBy(desc(cycles.weekNumber))
      .limit(1);

    const weekNumber = Math.max(boundaries.weekNumber, (lastCycles[0]?.weekNumber ?? 0) + 1);

    const newCycle = await createCycle({
      weekNumber,
      year: boundaries.year,
      phase: 'voting',
      startDate: boundaries.startDate,
      endDate: boundaries.endDate,
      votingEndsAt: boundaries.votingEndsAt,
      reviewOpensAt: boundaries.reviewOpensAt,
    });

    return NextResponse.json({
      success: true,
      message: `Cycle ${weekNumber} voting started!`,
      cycle: {
        id: newCycle.id,
        weekNumber: newCycle.weekNumber,
        phase: newCycle.phase,
        startDate: newCycle.startDate,
        votingEndsAt: newCycle.votingEndsAt,
        reviewOpensAt: newCycle.reviewOpensAt,
        endDate: newCycle.endDate,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
