import { NextResponse } from "next/server";
import { prisma } from "@noue/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await prisma.video.findUnique({ where: { id } });

  if (!video?.mediaKey) {
    return NextResponse.json(
      { error: "Vídeo ainda não foi baixado pelo worker." },
      { status: 404 }
    );
  }

  const base = process.env.R2_PUBLIC_BASE_URL;
  if (base) {
    return NextResponse.redirect(`${base.replace(/\/$/, "")}/${video.mediaKey}`);
  }

  // Sem base pública configurada. (Em produção, gerar URL assinada do R2.)
  return NextResponse.json(
    {
      error:
        "Armazenamento sem URL pública. Defina R2_PUBLIC_BASE_URL ou implemente URL assinada.",
      mediaKey: video.mediaKey,
    },
    { status: 501 }
  );
}
