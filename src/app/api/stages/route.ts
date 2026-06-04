import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pipelineStages } from "@/db/schema";
import { asc } from "drizzle-orm";

// POST: crear una nueva etapa
export async function POST(request: NextRequest) {
  let body: { name?: string; color?: string; pipelineId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  const existing = db
    .select()
    .from(pipelineStages)
    .orderBy(asc(pipelineStages.order))
    .all();
  const maxOrder = existing.reduce((m, s) => Math.max(m, s.order), 0);

  const stage = db
    .insert(pipelineStages)
    .values({
      name: body.name.trim(),
      order: maxOrder + 1,
      color: body.color || "#64748b",
      isWon: false,
      isLost: false,
      pipelineId: body.pipelineId || null,
    })
    .returning()
    .get();

  return NextResponse.json(stage, { status: 201 });
}
