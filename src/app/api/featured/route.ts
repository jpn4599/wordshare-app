// GET /api/featured — today's featured word (app-wide)
import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase/api';

export async function GET() {
  const supabase = createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });

  const { data, error } = await supabase
    .from('featured_words')
    .select(
      `feature_date, got_it_count, useful_count,
       post:posts(id, word, meaning, example, image_url, author:profiles(username))`
    )
    .eq('feature_date', today)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data || !data.post) {
    return NextResponse.json({ featured: null });
  }

  // Supabase types treat embedded selects as possibly-arrays — normalize.
  const post = Array.isArray(data.post) ? data.post[0] : data.post;
  if (!post) return NextResponse.json({ featured: null });

  const author = Array.isArray(post.author) ? post.author[0] : post.author;

  return NextResponse.json({
    featured: {
      post_id: post.id,
      word: post.word,
      meaning: post.meaning,
      example: post.example ?? null,
      image_url: post.image_url ?? null,
      got_it_count: data.got_it_count,
      useful_count: data.useful_count,
      poster_name: author?.username ?? 'Unknown',
      feature_date: data.feature_date,
    },
  });
}
