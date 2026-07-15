import { NextResponse } from "next/server";
import { prisma } from "@noue/db";
import { pendingAnalysis, analyzeVideo } from "@/lib/ai-pipeline";
import { geminiReady } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// analisa alguns por chamada; o cliente repete até remaining = 0 (evita timeout).
const CHUNK = 3;

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
    let lastErr: Error | null = null;
    for (const id of batch) {
      try {
        await analyzeVideo(id);
        analyzed++;
      } catch (e) {
        lastErr = e as Error;
      }
    }
    if (analyzed === 0 && lastErr) {
      return NextResponse.json({ error: lastErr.message }, { status: 500 });
    }
    return NextResponse.json({
      analyzed,
      remaining: Math.max(0, pending.length - analyzed),
      total: pending.length,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
