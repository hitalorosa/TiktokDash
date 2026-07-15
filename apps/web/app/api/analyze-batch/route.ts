import { NextResponse } from "next/server";
import { prisma } from "@noue/db";
import { pendingAnalysis, analyzeVideo } from "@/lib/ai-pipeline";
import { geminiReady } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Free tier do Gemini = ~15 req/min. Analisamos poucos por chamada e espaçamos
// ~4,5s entre eles (≈13/min) para não estourar. O cliente repete até remaining = 0.
const CHUNK = 2;
const SPACING_MS = 4500;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseRetryMs(msg: string): number {
  const m = msg.match(/retry(?:Delay)?["\s:]*?(\d+(?:\.\d+)?)s/i) || msg.match(/(\d+(?:\.\d+)?)s/);
  const secs = m ? parseFloat(m[1]!) : 30;
  return Math.min(60000, Math.round(secs * 1000));
}

function isRateLimit(msg: string): boolean {
  return /429|RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(msg);
}

export async function POST() {
  if (!geminiReady()) {
    return NextResponse.json({ error: "GEMINI_API_KEY não configurada." }, { status: 400 });
  }
  try {
    const config = await prisma.filterConfig.findUnique({ where: { id: "default" } });
    const topN = config?.topN ?? 30;
    const pending = await pendingAnalysis(topN);
    const batch = pending.slice(0, CHUNK);
    if (batch.length === 0) {
      return NextResponse.json({ analyzed: 0, remaining: 0, done: true });
    }

    let analyzed = 0;
    let rateLimited = false;
    let retryAfterMs = 0;
    let lastErr: Error | null = null;

    for (let i = 0; i < batch.length; i++) {
      try {
        await analyzeVideo(batch[i]!);
        analyzed++;
        if (i < batch.length - 1) await sleep(SPACING_MS);
      } catch (e) {
        const msg = (e as Error).message || "";
        if (isRateLimit(msg)) {
          rateLimited = true;
          retryAfterMs = parseRetryMs(msg);
          break;
        }
        lastErr = e as Error;
      }
    }

    if (analyzed === 0 && lastErr && !rateLimited) {
      return NextResponse.json({ error: lastErr.message }, { status: 500 });
    }
    return NextResponse.json({
      analyzed,
      remaining: Math.max(0, pending.length - analyzed),
      total: pending.length,
      rateLimited,
      retryAfterMs,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
