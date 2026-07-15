import "server-only";
import { GoogleGenAI } from "@google/genai";
import { extractJson } from "@noue/core";

const KEY = process.env.GEMINI_API_KEY || "";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

let ai: GoogleGenAI | null = null;

export function geminiReady(): boolean {
  return Boolean(KEY);
}

function client(): GoogleGenAI {
  if (!KEY) throw new Error("GEMINI_API_KEY não configurada. Adicione a chave no .env / Vercel.");
  if (!ai) ai = new GoogleGenAI({ apiKey: KEY });
  return ai;
}

/** Chama o Gemini pedindo JSON e devolve o objeto parseado (com 1 retry). */
export async function generateJson<T>(prompt: string): Promise<T> {
  const run = async (): Promise<string> => {
    const res = await client().models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.7 },
    });
    return res.text ?? "";
  };
  let text = await run();
  try {
    return extractJson<T>(text);
  } catch {
    text = await run();
    return extractJson<T>(text);
  }
}
