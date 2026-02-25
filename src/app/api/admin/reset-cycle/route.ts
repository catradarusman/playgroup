import { NextResponse } from 'next/server';
import { db } from '@/neynar-db-sdk/db';
import { cycles } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { createCycle } from '@/db/actions/cycle-actions';

/**
 * Admin endpoint: Force-start a new voting cycle
 * GET /api/admin/reset-cycle
 *
 * Creates a fresh voting cycle starting now, with 4 days of voting.
 * Safe to call multiple times - each call creates a new cycle with an incremented week number.
 */
export async function GET() {
  try {
    const now = new Date();
    const year = now.getFullYear();

    // Find last cycle to determine week number
    const lastCycles = await db
      .select()
      .from(cycles)
      .orderBy(desc(cycles.weekNumber))
      .limit(1);

    const lastWeek = lastCycles[0]?.weekNumber ?? 0;
    const nextWeek = lastWeek + 1;

    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    const votingEndsAt = new Date(startDate);
    votingEndsAt.setDate(votingEndsAt.getDate() + 4);
    votingEndsAt.setHours(22, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    endDate.setHours(23, 59, 59, 999);

    const newCycle = await createCycle({
      weekNumber: nextWeek,
      year,
      phase: 'voting',
      startDate,
      endDate,
      votingEndsAt,
    });

    return NextResponse.json({
      success: true,
      message: `Week ${nextWeek} voting cycle started!`,
      cycle: {
        id: newCycle.id,
        weekNumber: newCycle.weekNumber,
        phase: newCycle.phase,
        votingEndsAt: newCycle.votingEndsAt,
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
