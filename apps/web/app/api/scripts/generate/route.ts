import { NextResponse } from "next/server";
import { prisma } from "@noue/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const report = await prisma.aggregateReport.findFirst({ orderBy: { createdAt: "desc" } });
  if (!report) {
    return NextResponse.json(
      { error: "Nenhuma análise agregada encontrada. Reprocesse os 30 dias primeiro." },
      { status: 400 }
    );
  }

  // evita jobs duplicados
  await prisma.job.deleteMany({ where: { type: "scripts", status: "pending" } });
  await prisma.job.create({
    data: { type: "scripts", payload: { aggregateReportId: report.id } },
  });

  return NextResponse.json({
    message: "Geração de roteiros enfileirada. O worker vai criar os roteiros a partir do playbook.",
  });
}
