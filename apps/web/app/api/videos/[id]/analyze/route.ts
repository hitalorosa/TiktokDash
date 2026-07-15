import { NextResponse } from "next/server";
import { analyzeVideo } from "@/lib/ai-pipeline";
import { geminiReady } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!geminiReady()) {
    return NextResponse.json({ error: "GEMINI_API_KEY não configurada." }, { status: 400 });
  }
  try {
    await analyzeVideo(id);
    return NextResponse.json({ message: "Análise gerada." });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
