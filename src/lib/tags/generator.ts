// src/lib/tags/generator.ts — Tag generation using Gemini API

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { TagGenerationResult } from '@/lib/types/tag';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `あなたは英語学習支援のための単語分類AIです。
与えられた英単語リストに対して、学習者が後から検索・整理しやすいタグを付けます。

# タグ付けルール
- 各単語に 3〜5個のタグを付与
- タグは日本語で、簡潔（1〜6文字程度）
- 以下の観点から複合的に選択:
  - 品詞（動詞/名詞/形容詞など）
  - 場面・分野（ビジネス/日常/IT/旅行など）
  - 感情・ニュアンス（ポジティブ/ネガティブ/フォーマル等）
  - 関連トピック（会議/交渉/食事など）
- 抽象的すぎるタグ（「単語」「英語」等）は避ける
- 既存タグリストが提供されている場合は、可能な限り再利用する

# 出力形式
必ず以下のJSON形式のみで返答する。説明文やマークダウンは含めない。

{
  "results": [
    { "word": "string", "tags": ["tag1", "tag2", "tag3"] }
  ]
}`;

export interface PostInput {
  word: string;
  meaning: string;
  example?: string | null;
}

export async function generateTagsForPosts(
  posts: PostInput[],
  existingTags: string[] = []
): Promise<TagGenerationResult[]> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  const existingTagsSection =
    existingTags.length > 0 ? `# 既存タグ（再利用可）\n${existingTags.join(', ')}\n\n` : '';

  const postsSection = posts
    .map(
      (p, i) =>
        `${i + 1}. ${p.word} (${p.meaning})${p.example ? ` — 例文: ${p.example}` : ''}`
    )
    .join('\n');

  const userPrompt = `${existingTagsSection}# タグ付け対象\n${postsSection}`;

  const result = await model.generateContent(userPrompt);
  const text = result.response.text().trim().replace(/^```json\s*|\s*```$/g, '');

  try {
    const parsed = JSON.parse(text) as { results: TagGenerationResult[] };
    if (!Array.isArray(parsed.results)) {
      throw new Error('Invalid response shape: missing results array');
    }
    return parsed.results;
  } catch (e) {
    console.error('Failed to parse Gemini response:', text);
    throw new Error(`Tag generation failed: ${(e as Error).message}`);
  }
}

export async function generateTagsWithRetry(
  posts: PostInput[],
  existingTags: string[] = [],
  maxRetries = 3
): Promise<TagGenerationResult[]> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateTagsForPosts(posts, existingTags);
    } catch (e) {
      lastError = e as Error;
      const msg = lastError.message;
      if (attempt < maxRetries - 1 && (msg.includes('503') || msg.includes('429'))) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      } else if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }

  throw lastError ?? new Error('Tag generation failed after retries');
}
