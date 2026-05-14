import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag') ?? '';
    const search = searchParams.get('search') ?? '';
    const limit = parseInt(searchParams.get('limit') ?? '10', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const where: Record<string, unknown> = {};

    if (tag) {
      where.tags = { contains: tag };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { summary: { contains: search } },
      ];
    }

    const [articles, total] = await Promise.all([
      db.article.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.article.count({ where }),
    ]);

    return NextResponse.json({
      articles: articles.map((a) => ({
        id: a.id,
        source: a.source,
        url: a.url,
        title: a.title,
        summary: a.summary,
        whyMatters: a.whyMatters,
        publishedAt: a.publishedAt.toISOString(),
        tags: JSON.parse(a.tags),
        indexImpact: JSON.parse(a.indexImpact),
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}
