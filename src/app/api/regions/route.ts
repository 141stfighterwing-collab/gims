import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getThreshold } from '@/lib/scoring-engine';

export async function GET() {
  try {
    const regions = await db.region.findMany({
      orderBy: { riskScore: 'desc' },
    });

    return NextResponse.json(
      regions.map((r) => ({
        id: r.id,
        name: r.name,
        riskScore: r.riskScore,
        conflictCount: r.conflictCount,
        threshold: getThreshold(r.riskScore),
        updatedAt: r.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Error fetching regions:', error);
    return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 });
  }
}
