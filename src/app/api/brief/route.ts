import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIndexName, getThreshold, getIndexKeys } from '@/lib/scoring-engine';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get latest articles
    const recentArticles = await db.article.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 5,
    });

    // Get current index scores
    const indexKeys = getIndexKeys();
    const indexSummaries: Array<{
      name: string;
      score: number;
      threshold: ReturnType<typeof getThreshold>;
      change: number;
      direction: string;
    }> = [];
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
      const change = score - prevScore;

      indexSummaries.push({
        name: getIndexName(indexName),
        score,
        threshold: getThreshold(score),
        change: parseFloat(change.toFixed(1)),
        direction: change > 2 ? 'rising' : change < -2 ? 'falling' : 'stable',
      });
    }

    // Get top 3 priority items
    const priorityItems = recentArticles.slice(0, 3).map((a) => ({
      title: a.title,
      summary: a.summary,
      tags: JSON.parse(a.tags),
      indexImpact: JSON.parse(a.indexImpact),
    }));

    // Get active forecasts
    const activeForecasts = await db.forecast.findMany({
      orderBy: { confidence: 'desc' },
      take: 3,
    });

    // Get regional risk summary
    const regions = await db.region.findMany({
      orderBy: { riskScore: 'desc' },
    });

    const brief = {
      date: today,
      priorityItems,
      indexSummaries,
      keyDevelopments: recentArticles.map((a) => ({
        title: a.title,
        source: a.source,
        publishedAt: a.publishedAt.toISOString(),
      })),
      activeForecasts: activeForecasts.map((f) => ({
        indexName: getIndexName(f.indexName),
        forecastValue: f.forecastValue,
        method: f.method,
        confidence: f.confidence,
        scenario: f.scenario,
      })),
      regionalRiskSummary: regions.map((r) => ({
        name: r.name,
        riskScore: r.riskScore,
        threshold: getThreshold(r.riskScore),
        conflictCount: r.conflictCount,
      })),
    };

    return NextResponse.json(brief);
  } catch (error) {
    console.error('Error generating brief:', error);
    return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 });
  }
}
