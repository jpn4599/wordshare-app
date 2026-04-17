// POST /api/posts/tags/batch-generate
// Batch-generates AI tags for pending posts using Gemini API

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createAdminClient } from '@/lib/supabase/api';
import { generateTagsWithRetry, type PostInput } from '@/lib/tags/generator';

const BATCH_SIZE = parseInt(process.env.TAG_BATCH_SIZE || '10', 10);

export async function POST(request: NextRequest) {
  // Verify user is authenticated
  const supabase = createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use admin client for writes (tagging_status updates etc.)
  const admin = createAdminClient();

  const body = (await request.json()) as { post_ids?: string[] };
  const { post_ids } = body;

  // Fetch pending posts
  let query = admin
    .from('posts')
    .select('id, word, meaning, example')
    .eq('tagging_status', 'pending');

  if (post_ids && post_ids.length > 0) {
    query = query.in('id', post_ids);
  }

  const { data: targetPosts, error: postsError } = await query.limit(BATCH_SIZE);

  if (postsError) {
    return NextResponse.json({ error: postsError.message }, { status: 500 });
  }

  if (!targetPosts || targetPosts.length === 0) {
    return NextResponse.json({ success: true, processed: 0, failed: 0, results: [] });
  }

  // Fetch existing tags for reuse
  const { data: existingTags } = await admin.from('tags').select('name');
  const existingTagNames = existingTags?.map((t) => t.name) ?? [];

  // Mark as processing
  await admin
    .from('posts')
    .update({ tagging_status: 'processing' })
    .in(
      'id',
      targetPosts.map((p) => p.id)
    );

  const results = [];
  const failed: string[] = [];

  try {
    const postInputs: PostInput[] = targetPosts.map((p) => ({
      word: p.word,
      meaning: p.meaning,
      example: p.example,
    }));

    const generated = await generateTagsWithRetry(postInputs, existingTagNames);

    for (const result of generated) {
      const post = targetPosts.find((p) => p.word === result.word);
      if (!post) continue;

      for (const tagName of result.tags) {
        // Upsert tag
        const { data: tag, error: tagError } = await admin
          .from('tags')
          .upsert({ name: tagName, axis: 'general' }, { onConflict: 'name,axis' })
          .select()
          .single();

        if (tagError || !tag) {
          console.error('Tag upsert error:', tagError);
          continue;
        }

        // Upsert word_tag association
        await admin
          .from('word_tags')
          .upsert({ post_id: post.id, tag_id: tag.id, source: 'ai' }, { onConflict: 'post_id,tag_id' });
      }

      // Mark post as completed
      await admin
        .from('posts')
        .update({ tagging_status: 'completed', tagged_at: new Date().toISOString() })
        .eq('id', post.id);

      results.push({
        post_id: post.id,
        word: post.word,
        status: 'completed' as const,
        tags: result.tags,
      });
    }
  } catch (e) {
    console.error('Tag generation error:', e);
    await admin
      .from('posts')
      .update({ tagging_status: 'failed' })
      .in(
        'id',
        targetPosts.map((p) => p.id)
      );
    targetPosts.forEach((p) => failed.push(p.id));
  }

  return NextResponse.json({
    success: failed.length === 0,
    processed: results.length,
    failed: failed.length,
    results,
  });
}
