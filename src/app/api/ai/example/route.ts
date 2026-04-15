import { NextResponse } from 'next/server';

import { generateExample } from '@/lib/ai';
import { isAIEnabled } from '@/lib/env';

export async function POST(request: Request) {
  if (!isAIEnabled) {
    return NextResponse.json({ error: 'AI disabled' }, { status: 400 });
  }

  const body = (await request.json()) as { word?: string; meaning?: string };
  if (!body.word || !body.meaning) {
    return NextResponse.json({ error: 'word and meaning are required' }, { status: 400 });
  }

  const text = await generateExample(body.word, body.meaning);
  return NextResponse.json({ text });
}
