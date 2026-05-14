import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;

    const scores = await db.indexScore.findMany({
      where: { indexName: name },
      orderBy: { calculatedAt: 'asc' },
      take: 30,
    });

    const history = scores.map((s) => ({
      date: s.calculatedAt.toISOString().split('T')[0],
      score: s.score,
      decayedScore: s.decayedScore,
      signals: JSON.parse(s.inputSignals),
    }));

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching index history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
