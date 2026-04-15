// src/lib/ai.ts — Gemini API helper (used in API routes, server-side only)

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function askGemini(prompt: string, systemPrompt: string): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text || null;
  } catch (error) {
    console.error('Gemini API error:', error);
    return null;
  }
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
