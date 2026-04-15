// src/lib/ai.ts — Claude API helper (used in API routes, server-side only)

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function askClaude(prompt: string, systemPrompt: string): Promise<string | null> {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    return textBlock && 'text' in textBlock ? textBlock.text : null;
  } catch (error) {
    console.error('Claude API error:', error);
    return null;
  }
}

/**
 * Generate a natural example sentence for a word + its Japanese translation.
 */
export async function generateExample(word: string, meaning: string): Promise<string | null> {
  return askClaude(
    `Word: "${word}" (${meaning})\nGenerate 1 natural example sentence using this word. Then provide a brief Japanese translation.\nFormat exactly:\nEN: <sentence>\nJP: <translation>`,
    'You are a helpful English tutor. Respond concisely with just the requested format, nothing else.'
  );
}

/**
 * Generate a memorable mnemonic hint for a word (in Japanese).
 */
export async function generateHint(word: string, meaning: string): Promise<string | null> {
  return askClaude(
    `Word: "${word}" (${meaning})\nGive a memorable mnemonic or association hint to remember this word. Write in Japanese, keep it under 40 characters.`,
    'You are a creative language learning assistant. Respond with only the hint, nothing else.'
  );
}
