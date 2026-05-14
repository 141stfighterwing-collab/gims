import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getThreshold, getIndexName, getIndexKeys } from '@/lib/scoring-engine';

export async function GET() {
  try {
    const indexKeys = getIndexKeys();
    const results = [];

    for (const indexName of indexKeys) {
      const latest = await db.indexScore.findFirst({
        where: { indexName },
        orderBy: { calculatedAt: 'desc' },
      });

      const previous = await db.indexScore.findFirst({
        where: { indexName },
        orderBy: { calculatedAt: 'desc' },
        skip: 1,
      });

      const score = latest?.score ?? 0;
      const prevScore = previous?.score ?? 0;
      const trend = prevScore > 0 ? ((score - prevScore) / prevScore) * 100 : 0;

      results.push({
        key: indexName,
        name: getIndexName(indexName),
        score,
        threshold: getThreshold(score),
        trend: parseFloat(trend.toFixed(1)),
        calculatedAt: latest?.calculatedAt ?? null,
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching indices:', error);
    return NextResponse.json({ error: 'Failed to fetch indices' }, { status: 500 });
  }
}
