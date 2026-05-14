import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIndexName } from '@/lib/scoring-engine';

export async function GET() {
  try {
    const forecasts = await db.forecast.findMany({
      orderBy: { triggeredAt: 'desc' },
    });

    return NextResponse.json(
      forecasts.map((f) => ({
        id: f.id,
        indexName: f.indexName,
        indexDisplayName: getIndexName(f.indexName),
        region: f.region,
        forecastValue: f.forecastValue,
        method: f.method,
        horizonDays: f.horizonDays,
        confidence: f.confidence,
        scenario: f.scenario,
        triggeredAt: f.triggeredAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Error fetching forecasts:', error);
    return NextResponse.json({ error: 'Failed to fetch forecasts' }, { status: 500 });
  }
}
