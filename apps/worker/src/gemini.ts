import { GoogleGenAI } from "@google/genai";
import { extractJson } from "@noue/core";
import { env } from "./env";

let ai: GoogleGenAI | null = null;

function client(): GoogleGenAI {
  if (!env.geminiKey) throw new Error("GEMINI_API_KEY não configurada.");
  if (!ai) ai = new GoogleGenAI({ apiKey: env.geminiKey });
  return ai;
}

/** Chama o Gemini pedindo JSON e devolve o objeto parseado (com 1 retry). */
export async function generateJson<T>(prompt: string): Promise<T> {
  const run = async (): Promise<string> => {
    const res = await client().models.generateContent({
      model: env.geminiModel,
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.7 },
    });
    return res.text ?? "";
  };

  let text = await run();
  try {
    return extractJson<T>(text);
  } catch {
    // retry uma vez
    text = await run();
    return extractJson<T>(text);
  }
}
