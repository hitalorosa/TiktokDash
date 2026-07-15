import { NextResponse } from "next/server";
import { runAggregate } from "@/lib/ai-pipeline";
import { geminiReady } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  if (!geminiReady()) {
    return NextResponse.json({ error: "GEMINI_API_KEY não configurada." }, { status: 400 });
  }
  try {
    const reportId = await runAggregate();
    return NextResponse.json({ message: "Playbook dos 30 dias gerado.", reportId });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
