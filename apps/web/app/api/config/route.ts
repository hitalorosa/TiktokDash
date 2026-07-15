import { NextResponse } from "next/server";
import { prisma } from "@noue/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const num = (v: unknown, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  try {
    const data = {
      topN: Math.max(1, Math.round(num(body.topN, 30))),
      rankBy: ["gmv", "orders", "roas"].includes(String(body.rankBy)) ? String(body.rankBy) : "gmv",
      tier1Gmv: num(body.tier1Gmv, 10000),
      tier2Gmv: num(body.tier2Gmv, 5000),
      windowDays: Math.max(1, Math.round(num(body.windowDays, 30))),
      currency: ["BRL", "USD"].includes(String(body.currency)) ? String(body.currency) : "BRL",
    };
    const saved = await prisma.filterConfig.upsert({
      where: { id: "default" },
      create: { id: "default", ...data },
      update: data,
    });
    return NextResponse.json({ message: "Configurações salvas.", config: saved });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
