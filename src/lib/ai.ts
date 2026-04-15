// src/lib/ai.ts — Gemini API helper (used in API routes, server-side only)

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function askGemini(prompt: string, systemPrompt: string, retries = 2): Promise<string | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemPrompt,
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return text || null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Gemini API error (attempt ${attempt + 1}/${retries + 1}):`, message);

      // Retry on 503 (overloaded) or 429 (rate limit)
      if (attempt < retries && (message.includes('503') || message.includes('429'))) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      return null;
    }
  }
  return null;
}

/**
 * Generate a natural example sentence for a word + its Japanese translation.
 */
export async function generateExample(word: string, meaning: string): Promise<string | null> {
  return askGemini(
    `Word: "${word}" (${meaning})\nGenerate 1 natural example sentence using this word. Then provide a brief Japanese translation.\nFormat exactly:\nEN: <sentence>\nJP: <translation>`,
    'You are a helpful English tutor. Respond concisely with just the requested format, nothing else.'
  );
}

/**
 * Generate a memorable mnemonic hint for a word (in Japanese).
 */
export async function generateHint(word: string, meaning: string): Promise<string | null> {
  return askGemini(
    `Word: "${word}" (${meaning})\nGive a memorable mnemonic or association hint to remember this word. Write in Japanese, keep it under 40 characters.`,
    'You are a creative language learning assistant. Respond with only the hint, nothing else.'
  );
}
